"""JWT verification for protected admin endpoints."""

import os
from typing import Any, FrozenSet, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

security = HTTPBearer(auto_error=False)

# Placeholder values that have shipped in .env.example / old defaults; never sign with them.
_INSECURE_JWT_SECRETS = {"change-me-in-production", "secret"}
MIN_JWT_SECRET_LENGTH = 32


def get_allowed_admin_emails() -> FrozenSet[str]:
    """Emails allowed to use admin. Empty means nobody (fail closed).

    Format: a@x.com,b@y.com. A pasted JSON-style list (["a@x.com"]) also works.
    """
    raw = os.getenv("ALLOWED_ADMIN_EMAILS", "")
    emails = (e.strip().strip("[]\"' ").lower() for e in raw.split(","))
    return frozenset(e for e in emails if e)


def is_admin_email(email: Optional[str]) -> bool:
    return bool(email) and email.strip().lower() in get_allowed_admin_emails()


def get_jwt_secret() -> str:
    """Signing secret for admin JWTs. Raises 503 if missing or guessable."""
    secret = get_settings().jwt_secret
    if (
        not secret
        or secret in _INSECURE_JWT_SECRETS
        or len(secret) < MIN_JWT_SECRET_LENGTH
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin auth not configured (JWT_SECRET)",
        )
    return secret


async def verify_admin_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict[str, Any]:
    """Verify JWT and that its subject is still an allowed admin. Raises 401 if not."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Re-check on every request so removing an email from ALLOWED_ADMIN_EMAILS
    # revokes access immediately instead of when the token expires.
    if not is_admin_email(payload.get("sub")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
