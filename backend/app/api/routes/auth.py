from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.supabase_service import get_supabase_client


router = APIRouter(prefix="/auth", tags=["auth"])

class ResolveRequest(BaseModel):
    identifier: str

@router.post("/resolve")
def resolve_identifier(payload: ResolveRequest) -> dict[str, Any]:
    """
    Takes an email or username and returns the corresponding email for Supabase auth.
    If the identifier is already an email, it returns it as is.
    """
    client = get_supabase_client()
    identifier = payload.identifier.strip().lower()
    
    # If it contains '@', it's already an email
    if "@" in identifier:
        return {"email": identifier}
        
    # Search in profiles table by username
    # Note: We prioritize exact matches on the username prefix
    res = client.table("profiles").select("id").eq("username", identifier).execute()
    
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Username not found. Please provide your full email."
        )
        
    if len(res.data) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Multiple users found with this username. Please use your full email."
        )
        
    user_id = res.data[0]["id"]
    
    # We need the email from auth.users, but the public profiles table doesn't have it.
    # We use the Service Role key to query the auth admin API if needed, 
    # but a simpler way is to have the backend fetch the user email via admin api.
    try:
        user_res = client.auth.admin.get_user_by_id(user_id)
        if not user_res or not user_res.user:
             raise Exception("User not found in auth system")
        return {"email": user_res.user.email}
    except Exception as e:
        print(f"Error resolving user email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to resolve identifier."
        )

@router.post("/login")
def login() -> dict[str, str]:
    return {"message": "Login endpoint placeholder"}


@router.post("/otp")
def verify_otp() -> dict[str, str]:
    return {"message": "OTP endpoint placeholder"}
