from fastapi import APIRouter


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login() -> dict[str, str]:
    return {"message": "Login endpoint placeholder"}


@router.post("/otp")
def verify_otp() -> dict[str, str]:
    return {"message": "OTP endpoint placeholder"}
