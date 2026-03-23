import os
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel


class Settings(BaseModel):
    firebase_api_key: Optional[str] = None
    jwt_secret: Optional[str] = None
    jwt_expire_hours: int = 24
    firebase_auth_domain: Optional[str] = None
    firebase_project_id: Optional[str] = None
    firebase_storage_bucket: Optional[str] = None
    firebase_messaging_sender_id: Optional[str] = None
    firebase_app_id: Optional[str] = None
    firebase_measurement_id: Optional[str] = None
    firebase_credentials_path: Optional[str] = None
    firebase_credentials_json: Optional[str] = None  # JSON string for Azure/cloud (no file path)
    firebase_posts_collection: Optional[str] = None
    firebase_projects_collection: Optional[str] = None

    @property
    def has_firebase_config(self) -> bool:
        return bool(self.firebase_project_id)


def _env_strip(name: str) -> Optional[str]:
    v = os.getenv(name)
    if not v:
        return None
    s = v.strip()
    return s if s else None


def _env_firebase_credentials_json() -> Optional[str]:
    """Azure may expose the same app setting as FIREBASE_CREDENTIALS_JSON or APPSETTING_...."""
    for name in ("FIREBASE_CREDENTIALS_JSON", "APPSETTING_FIREBASE_CREDENTIALS_JSON"):
        v = _env_strip(name)
        if v:
            return v
    return None


def _env_credentials_file_path(name: str) -> Optional[str]:
    """Only return GOOGLE_APPLICATION_CREDENTIALS if that path exists on this machine.

    Ignores stale dev paths (e.g. /Users/...) left in Azure App Settings so Firebase
    never calls open() on a missing file.
    """
    v = _env_strip(name)
    if not v:
        return None
    expanded = os.path.expanduser(v)
    return expanded if os.path.isfile(expanded) else None


@lru_cache
def get_settings() -> Settings:
    return Settings(
        firebase_api_key=_env_strip("FIREBASE_API_KEY"),
        jwt_secret=os.getenv("JWT_SECRET", "change-me-in-production"),
        jwt_expire_hours=int(os.getenv("JWT_EXPIRE_HOURS", "24")),
        firebase_auth_domain=os.getenv("FIREBASE_AUTH_DOMAIN", "joels-portfolio-2f583.firebaseapp.com"),
        firebase_project_id=os.getenv("FIREBASE_PROJECT_ID", "joels-portfolio-2f583"),
        firebase_storage_bucket=os.getenv("FIREBASE_STORAGE_BUCKET", "joels-portfolio-2f583.firebasestorage.app"),
        firebase_messaging_sender_id=os.getenv("FIREBASE_MESSAGING_SENDER_ID", "719665161324"),
        firebase_app_id=os.getenv("FIREBASE_APP_ID", "1:719665161324:web:1d053ed21e9f6b2ce3e449"),
        firebase_measurement_id=_env_strip("FIREBASE_MEASUREMENT_ID"),
        firebase_credentials_path=_env_credentials_file_path("GOOGLE_APPLICATION_CREDENTIALS"),
        firebase_credentials_json=_env_firebase_credentials_json(),
        firebase_posts_collection=os.getenv("FIREBASE_POSTS_COLLECTION", "posts"),
        firebase_projects_collection=os.getenv("FIREBASE_PROJECTS_COLLECTION", "projects"),
    )
