import random
import string
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.supabase_service import get_supabase_client


router = APIRouter(prefix="/groups", tags=["groups"])

class CreateGroupRequest(BaseModel):
    name: str
    user_id: str

@router.post("")
async def create_group(request: CreateGroupRequest) -> dict[str, Any]:
    if not request.name or not request.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name and user_id are required")
        
    client = get_supabase_client()
    invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    try:
        # Create group
        group_data = client.table("groups").insert({
            "name": request.name,
            "invite_code": invite_code,
            "creator_id": request.user_id,
            "invite_expires_at": expires_at
        }).execute()
        
        if not group_data.data:
            raise HTTPException(status_code=500, detail="Failed to create group")
            
        group = group_data.data[0]
        group_id = group["id"]
        
        # Add user as admin to group_members
        client.table("group_members").insert({
            "group_id": group_id,
            "user_id": request.user_id,
            "role": "admin"
        }).execute()
        
        return group
    except Exception as exc:
        print(f"Failed to create group: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create group. Make sure groups and group_members tables exist."
        ) from exc


class JoinGroupRequest(BaseModel):
    invite_code: str
    user_id: str

@router.post("/join")
async def join_group(request: JoinGroupRequest) -> dict[str, Any]:
    if not request.invite_code or not request.user_id:
        raise HTTPException(status_code=400, detail="Invite code and user_id are required")
        
    client = get_supabase_client()
    try:
        # Find group by invite code
        group_query = client.table("groups").select("*").eq("invite_code", request.invite_code.upper()).execute()
        
        if not group_query.data:
            raise HTTPException(status_code=404, detail="Invalid invite code")
            
        group = group_query.data[0]
        
        if group.get("invite_expires_at"):
             # Handle Z timezone string from js/supabase correctly
             expiry_str = group["invite_expires_at"].replace("Z", "+00:00")
             try:
                 expiry = datetime.fromisoformat(expiry_str)
                 if datetime.now(timezone.utc) > expiry:
                     raise HTTPException(status_code=400, detail="This invite code has expired.")
             except ValueError:
                 pass # if parsing fails, ignore expiration check for safety
                 
        group_id = group["id"]
        
        # Check if already a member
        member_query = client.table("group_members").select("*").eq("group_id", group_id).eq("user_id", request.user_id).execute()
        if member_query.data:
            return group # Already joined
            
        # Add to group
        client.table("group_members").insert({
            "group_id": group_id,
            "user_id": request.user_id,
            "role": "member"
        }).execute()
        
        return group
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Failed to join group: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not join group"
        ) from exc


@router.get("")
async def get_groups(user_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client()
    try:
        # Get memberships
        memberships = client.table("group_members").select("group_id").eq("user_id", user_id).execute()
        if not memberships.data:
            return []
            
        group_ids = [m["group_id"] for m in memberships.data]
        
        # Get groups details
        groups = client.table("groups").select("*").in_("id", group_ids).execute()
        return groups.data
    except Exception as exc:
        print(f"Failed to fetch groups: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch groups"
        ) from exc

@router.delete("/{group_id}")
async def delete_group(group_id: str, user_id: str) -> dict[str, str]:
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
        
    client = get_supabase_client()
    try:
        # Check creator
        group_query = client.table("groups").select("creator_id").eq("id", group_id).execute()
        if not group_query.data or group_query.data[0]["creator_id"] != user_id:
             raise HTTPException(status_code=403, detail="Only the creator can delete this group")
             
        client.table("group_members").delete().eq("group_id", group_id).execute()
        client.table("groups").delete().eq("id", group_id).execute()
        return {"message": "Group deleted successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete group.") from exc

class UpdateGroupRequest(BaseModel):
    name: str
    user_id: str

@router.put("/{group_id}")
async def update_group(group_id: str, request: UpdateGroupRequest) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        # Check creator
        group_query = client.table("groups").select("creator_id").eq("id", group_id).execute()
        if not group_query.data or group_query.data[0]["creator_id"] != request.user_id:
             raise HTTPException(status_code=403, detail="Only the creator can edit this group")
             
        data = client.table("groups").update({"name": request.name}).eq("id", group_id).execute()
        return data.data[0] if data.data else {}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not update group.") from exc

class RefreshInviteRequest(BaseModel):
    user_id: str

@router.post("/{group_id}/refresh_invite")
async def refresh_invite(group_id: str, request: RefreshInviteRequest) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        # Check creator
        group_query = client.table("groups").select("creator_id").eq("id", group_id).execute()
        if not group_query.data or group_query.data[0]["creator_id"] != request.user_id:
             raise HTTPException(status_code=403, detail="Only the creator can refresh the invite code")
             
        new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        
        data = client.table("groups").update({
            "invite_code": new_code,
            "invite_expires_at": expires_at
        }).eq("id", group_id).execute()
        
        return data.data[0] if data.data else {}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not refresh invite code.") from exc
