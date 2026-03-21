"""
Database access layer - single file to change when switching providers.
Currently: Firebase/Firestore. To switch to Cosmos DB, replace this file.
"""

import tempfile
from typing import Any, Dict, List, Optional

from app.core.config import get_settings


def _to_iso_string(val: Any) -> Optional[str]:
    """Convert Firestore Timestamp/datetime to ISO string for JSON serialization."""
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        s = val.isoformat()
        return s + "Z" if "Z" not in s and "+" not in s else s
    if isinstance(val, str):
        return val
    return str(val)


def _normalize_post_dates(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize date fields to ISO strings so they serialize correctly."""
    out = dict(data)
    for key in ("publishedAt", "updatedAt", "editedAt"):
        if key in out and out[key] is not None:
            out[key] = _to_iso_string(out[key])
    return out

# --- Firebase client (replace with Cosmos client when switching) ---
import firebase_admin
from firebase_admin import credentials, firestore

_firestore_client = None


def init_firebase() -> None:
    """Initialize Firebase (call at startup so auth can verify tokens)."""
    _get_firestore()


def _get_firestore():
    global _firestore_client
    if _firestore_client is None:
        settings = get_settings()
        if not settings.firebase_project_id:
            raise RuntimeError("Firebase config missing. Set FIREBASE_PROJECT_ID.")
        if not firebase_admin._apps:
            cred_path = settings.firebase_credentials_path
            if not cred_path and settings.firebase_credentials_json:
                # Azure/cloud: credentials from env var (JSON string)
                with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
                    f.write(settings.firebase_credentials_json)
                    cred_path = f.name
            cred = (
                credentials.Certificate(cred_path)
                if cred_path
                else credentials.ApplicationDefault()
            )
            firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
        _firestore_client = firestore.client()
    return _firestore_client


def _posts_collection():
    settings = get_settings()
    name = settings.firebase_posts_collection or "posts"
    return _get_firestore().collection(name)


def _projects_collection():
    settings = get_settings()
    name = settings.firebase_projects_collection or "projects"
    return _get_firestore().collection(name)


# --- Public API (same signatures regardless of provider) ---

def list_posts(
    tag: Optional[str] = None,
    search: Optional[str] = None,
    published_only: bool = True,
) -> List[Dict[str, Any]]:
    coll = _posts_collection()
    docs = coll.stream()
    items = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        # Only exclude explicit drafts; treat missing status as published (backwards compat)
        if published_only and data.get("status") == "draft":
            continue
        if tag and tag not in data.get("tags", []):
            continue
        if search:
            sl = search.lower()
            if sl not in (data.get("title") or "").lower() and sl not in (data.get("summary") or "").lower():
                continue
        items.append(_normalize_post_dates(data))
    def _sort_key(x):
        v = x.get("publishedAt")
        if v is None:
            return ""
        return v.isoformat() if hasattr(v, "isoformat") else str(v)
    items.sort(key=_sort_key, reverse=True)
    return items


def get_post_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    coll = _posts_collection()
    for doc in coll.where("slug", "==", slug).limit(1).stream():
        data = doc.to_dict()
        data["id"] = doc.id
        return _normalize_post_dates(data)
    return None


def upsert_post(document: Dict[str, Any]) -> None:
    _posts_collection().document(document["slug"]).set(document)


def delete_post(slug: str) -> None:
    _posts_collection().document(slug).delete()


def list_projects() -> List[Dict[str, Any]]:
    coll = _projects_collection()
    items = []
    for doc in coll.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        items.append(data)
    return items
