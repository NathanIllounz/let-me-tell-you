from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.services.supabase_service import get_supabase_client

router = APIRouter(tags=["friends"])

class FriendRequestPayload(BaseModel):
    username: str
    tag: str

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    """Fetch my own Discord style handle from the Public Profiles table."""
    client = get_supabase_client()
    user_id = current_user["sub"]
    
    res = client.table("profiles").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile handle not established. Ensure SQL trigger was run.")
        
    return res.data[0]

@router.post("/request")
def send_friend_request(payload: FriendRequestPayload, current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    """Lookup user by handle and send a friend request."""
    client = get_supabase_client()
    sender_id = current_user["sub"]
    
    # Secure exact lookup
    res = client.table("profiles").select("id").eq("username", payload.username).eq("tag", payload.tag).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="User handle not found.")
        
    receiver_id = res.data[0]["id"]
    
    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="You cannot friend yourself!")
        
    try:
        # Determine strict alphabetical order for the LEAST/GREATEST constraint
        user_1 = min(sender_id, receiver_id)
        user_2 = max(sender_id, receiver_id)
        
        # Check if already pending or accepted
        check = client.table("friend_requests").select("status, sender_id").eq("sender_id", user_1).eq("receiver_id", user_2).execute()
        # Fallback check (since the unique constraint is LEAST/GREATEST, querying both directions is safest via OR, but uniquely bound logic makes it easy)
        check2 = client.table("friend_requests").select("status, sender_id").or_(f"and(sender_id.eq.{sender_id},receiver_id.eq.{receiver_id}),and(sender_id.eq.{receiver_id},receiver_id.eq.{sender_id})").execute()
        
        if check2.data:
            existing = check2.data[0]
            if existing["status"] == 'accepted':
                raise HTTPException(status_code=400, detail="You are already friends.")
                
            if existing["status"] == 'pending':
                if existing["sender_id"] == receiver_id:
                    # They sent US a request, let's just auto-accept it!
                    client.table("friend_requests").update({"status": "accepted"}).eq("id", existing["id"]).execute()
                    return {"status": "accepted", "message": "They already sent you a request! You are now friends."}
                raise HTTPException(status_code=400, detail="Friend request already pending.")
                
            if existing["status"] == 'declined':
                # Re-activate it
                client.table("friend_requests").update({"status": "pending", "sender_id": sender_id, "receiver_id": receiver_id}).eq("id", existing["id"]).execute()
                return {"status": "pending", "message": "Friend request sent."}

        # Insert brand new request
        client.table("friend_requests").insert({
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "status": "pending"
        }).execute()
        
        return {"status": "pending", "message": "Friend request sent successfully!"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Friend Request Error: {e}")
        # The unique constraint throws 409 naturally if race condition hits
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process friend request.")

@router.get("/pending")
def get_pending_requests(current_user: dict = Depends(get_current_user)) -> list[dict[str, Any]]:
    """Get all INBOUND pending friend requests."""
    client = get_supabase_client()
    user_id = current_user["sub"]
    
    # Inner join using Supabase syntax to pull their profile tags automatically
    res = client.table("friend_requests").select("id, status, created_at, profiles!friend_requests_sender_id_fkey(id, username, tag)").eq("receiver_id", user_id).eq("status", "pending").execute()
    
    # Format cleanly for frontend
    formatted = []
    for req in (res.data or []):
        formatted.append({
            "request_id": req["id"],
            "created_at": req["created_at"],
            "sender_id": req["profiles"]["id"],
            "sender_username": req["profiles"]["username"],
            "sender_tag": req["profiles"]["tag"]
        })
        
    return formatted

@router.post("/{request_id}/accept")
def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    client = get_supabase_client()
    user_id = current_user["sub"]
    
    # Ensure they are the intended receiver
    res = client.table("friend_requests").update({"status": "accepted"}).eq("id", request_id).eq("receiver_id", user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized.")
        
    return {"message": "Friend request accepted"}

@router.post("/{request_id}/decline")
def decline_friend_request(request_id: str, current_user: dict = Depends(get_current_user)) -> dict[str, str]:
    client = get_supabase_client()
    user_id = current_user["sub"]
    
    # Decline the request (we delete it to prevent permanent bloat, or we can just set to declined)
    res = client.table("friend_requests").update({"status": "declined"}).eq("id", request_id).eq("receiver_id", user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized.")
        
    return {"message": "Friend request declined"}

@router.get("/all")
def get_all_friends(current_user: dict = Depends(get_current_user)) -> list[dict[str, Any]]:
    """Return all accepted friends. (Querying BOTH where you are sender OR receiver)"""
    client = get_supabase_client()
    user_id = current_user["sub"]
    
    # Query all accepted requests where user is sender or receiver
    res = client.table("friend_requests").select("id, sender_id, receiver_id").eq("status", "accepted").or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}").execute()
    
    if not res.data:
        return []
        
    # Extract all friend UUIDs
    friend_ids = []
    for req in res.data:
        if req["sender_id"] == user_id:
            friend_ids.append(req["receiver_id"])
        else:
            friend_ids.append(req["sender_id"])
            
    if not friend_ids:
        return []
        
    # Get all profiles
    profiles_res = client.table("profiles").select("id, username, tag").in_("id", friend_ids).execute()
    
    return profiles_res.data or []
