import os
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel


class Settings(BaseModel):
    firebase_api_key: Optional[str] = None
    firebase_auth_domain: Optional[str] = None
    firebase_project_id: Optional[str] = None
    firebase_storage_bucket: Optional[str] = None
    firebase_messaging_sender_id: Optional[str] = None
    firebase_app_id: Optional[str] = None
    firebase_measurement_id: Optional[str] = None
    firebase_credentials_path: Optional[str] = None
    firebase_posts_collection: Optional[str] = None
    firebase_projects_collection: Optional[str] = None

    @property
    def has_firebase_config(self) -> bool:
        return bool(self.firebase_project_id)


@lru_cache
def get_settings() -> Settings:
    return Settings(
        firebase_api_key=os.getenv("FIREBASE_API_KEY"),
        firebase_auth_domain=os.getenv("FIREBASE_AUTH_DOMAIN", "joels-portfolio-2f583.firebaseapp.com"),
        firebase_project_id=os.getenv("FIREBASE_PROJECT_ID", "joels-portfolio-2f583"),
        firebase_storage_bucket=os.getenv("FIREBASE_STORAGE_BUCKET", "joels-portfolio-2f583.firebasestorage.app"),
        firebase_messaging_sender_id=os.getenv("FIREBASE_MESSAGING_SENDER_ID", "719665161324"),
        firebase_app_id=os.getenv("FIREBASE_APP_ID", "1:719665161324:web:1d053ed21e9f6b2ce3e449"),
        firebase_measurement_id=os.getenv("FIREBASE_MEASUREMENT_ID"),
        firebase_credentials_path=os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        firebase_posts_collection=os.getenv("FIREBASE_POSTS_COLLECTION", "posts"),
        firebase_projects_collection=os.getenv("FIREBASE_PROJECTS_COLLECTION", "projects"),
    )
