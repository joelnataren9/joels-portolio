"""Admin login - backend verifies Firebase credentials via REST API, returns JWT."""

import datetime
import os
from typing import Any, Optional, Set

import httpx
import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter()

FIREBASE_SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"


def get_allowed_emails() -> Optional[Set[str]]:
    raw = os.getenv("ALLOWED_ADMIN_EMAILS", "").strip()
    if not raw:
        return None
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


def create_jwt(email: str) -> str:
    settings = get_settings()
    payload = {
        "sub": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret or "secret",
        algorithm="HS256",
    )


@router.post("/login", response_model=TokenResponse, summary="Admin login (Firebase credentials)")
async def admin_login(body: LoginRequest) -> TokenResponse:
    """Verify email/password with Firebase Auth REST API, return JWT."""
    settings = get_settings()
    if not settings.firebase_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin login not configured (FIREBASE_API_KEY)",
        )
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{FIREBASE_SIGN_IN_URL}?key={settings.firebase_api_key}",
                json={
                    "email": body.email.strip(),
                    "password": body.password,
                    "returnSecureToken": True,
                },
                timeout=10.0,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to verify credentials",
        ) from e

    data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
    if res.status_code != 200:
        err = data.get("error", {})
        msg = err.get("message", "Invalid email or password")
        if msg == "INVALID_PASSWORD" or msg == "EMAIL_NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid response from auth")

    allowed = get_allowed_emails()
    if allowed and email not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin",
        )

    token = create_jwt(email)
    return TokenResponse(access_token=token, email=email)
