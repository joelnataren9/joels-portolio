"""
Database access layer - single file to change when switching providers.
Currently: Firebase/Firestore. To switch to Cosmos DB, replace this file.
"""

import base64
import binascii
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union

from app.core.config import get_settings

_logger = logging.getLogger(__name__)


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


def _parse_service_account_json(raw: str) -> Dict[str, Any]:
    """Decode Azure-friendly variants: raw JSON, JSON-as-string, or base64(JSON)."""
    text = raw.strip().lstrip("\ufeff")
    candidates: list[str] = [text]
    # Sometimes App Settings store a JSON *string* (extra quotes / escaping)
    if not text.lstrip().startswith("{"):
        try:
            unwrapped = json.loads(text)
            if isinstance(unwrapped, str) and unwrapped.strip().startswith("{"):
                candidates.append(unwrapped)
        except json.JSONDecodeError:
            pass
    # Base64 of the JSON file avoids quote/escape issues in the portal
    try:
        pad = (4 - len(text) % 4) % 4
        decoded = base64.b64decode(text + "=" * pad, validate=False)
        candidates.append(decoded.decode("utf-8"))
    except (binascii.Error, UnicodeDecodeError, ValueError):
        pass

    last_err: Optional[Exception] = None
    for candidate in candidates:
        try:
            data = json.loads(candidate)
            if isinstance(data, str) and data.strip().startswith("{"):
                data = json.loads(data)
            if (
                isinstance(data, dict)
                and data.get("type") == "service_account"
                and isinstance(data.get("private_key"), str)
            ):
                return data
        except json.JSONDecodeError as e:
            last_err = e
            continue
    raise RuntimeError(
        "FIREBASE_CREDENTIALS_JSON is not valid JSON (or base64 of JSON). "
        "Paste the service account file as one line, or base64-encode the file contents."
    ) from last_err


def _verify_private_key_pem(pem: str) -> None:
    """Ensure the RSA private key parses; catches truncated/corrupt Azure pastes before Firestore."""
    try:
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import serialization
    except ImportError as e:
        raise RuntimeError(
            "cryptography package required to validate service account keys. "
            "Install dependencies from requirements.txt."
        ) from e
    try:
        serialization.load_pem_private_key(
            pem.encode("utf-8"), password=None, backend=default_backend()
        )
    except Exception as e:
        raise RuntimeError(
            "FIREBASE_CREDENTIALS_JSON private_key is not valid PEM or is truncated. "
            "Azure App Settings can corrupt long values—use base64-encoded JSON or Azure Key Vault. "
            "Or generate a new key in Google Cloud IAM and paste again."
        ) from e


def _validate_service_account_dict(data: Dict[str, Any]) -> None:
    for key in ("type", "private_key", "client_email", "project_id"):
        if key not in data:
            raise RuntimeError(
                f"FIREBASE_CREDENTIALS_JSON is missing '{key}'. Use the downloaded "
                "Firebase/GCP service account JSON without edits."
            )
    if data.get("type") != "service_account":
        raise RuntimeError(
            "FIREBASE_CREDENTIALS_JSON must be a service account key (type: service_account)."
        )
    pk = (data.get("private_key") or "").strip()
    # Azure / portal pastes sometimes store literal backslash-n instead of newlines.
    if "\\n" in pk:
        pk = pk.replace("\\n", "\n")
    data["private_key"] = pk
    if not pk.startswith("-----BEGIN"):
        raise RuntimeError(
            "FIREBASE_CREDENTIALS_JSON private_key is invalid or truncated. "
            "Regenerate the key in Google Cloud Console and set the app setting again."
        )
    _verify_private_key_pem(pk)


def init_firebase() -> None:
    """Initialize Firebase (call at startup so auth can verify tokens)."""
    _get_firestore()


def _log_firebase_cred_choice(
    source: str,
    firebase_project: str,
    *,
    json_len: Optional[int] = None,
    private_key_len: Optional[int] = None,
    sa_project_id: Optional[str] = None,
    cred_file: Optional[str] = None,
) -> None:
    """Operational log (Azure stream): how Firebase was authenticated; no secrets."""
    _logger.warning(
        "Firebase credentials: source=%s firebase_project=%s sa_project=%s "
        "json_env_len=%s private_key_len=%s cred_file=%s",
        source,
        firebase_project,
        sa_project_id,
        json_len,
        private_key_len,
        os.path.basename(cred_file) if cred_file else None,
    )


def _get_firestore():
    global _firestore_client
    if _firestore_client is None:
        settings = get_settings()
        if not settings.firebase_project_id:
            raise RuntimeError("Firebase config missing. Set FIREBASE_PROJECT_ID.")
        if not firebase_admin._apps:
            # Prefer JSON-in-env (Azure) over GOOGLE_APPLICATION_CREDENTIALS so a
            # dev-machine path in Application Settings does not break Linux deploys.
            # Certificate() accepts either a filesystem path or the parsed service account dict.
            cred: Union[credentials.Certificate, Any]
            firebase_project_for_app = settings.firebase_project_id
            if settings.firebase_credentials_json:
                sa = _parse_service_account_json(settings.firebase_credentials_json)
                _validate_service_account_dict(sa)
                if (
                    settings.firebase_project_id
                    and sa.get("project_id")
                    and sa["project_id"] != settings.firebase_project_id
                ):
                    _logger.warning(
                        "FIREBASE_PROJECT_ID (%s) differs from service account project_id (%s); "
                        "using the key's project_id for Firebase.",
                        settings.firebase_project_id,
                        sa["project_id"],
                    )
                firebase_project_for_app = sa["project_id"]
                cred = credentials.Certificate(sa)
                _log_firebase_cred_choice(
                    "env_json",
                    firebase_project_for_app,
                    json_len=len(settings.firebase_credentials_json or ""),
                    private_key_len=len(sa.get("private_key") or ""),
                    sa_project_id=sa.get("project_id"),
                )
            elif settings.firebase_credentials_path:
                # Config only sets this when the file exists (see config._env_credentials_file_path).
                cred = credentials.Certificate(settings.firebase_credentials_path)
                _log_firebase_cred_choice(
                    "file",
                    firebase_project_for_app,
                    cred_file=settings.firebase_credentials_path,
                )
            else:
                if os.getenv("WEBSITE_INSTANCE_ID"):
                    raise RuntimeError(
                        "Firebase on Azure App Service requires FIREBASE_CREDENTIALS_JSON "
                        "(service account JSON as one line, or base64 of that file). "
                        "Set it under Configuration → Application settings. "
                        "Application Default Credentials are not valid for Firestore here "
                        "(this causes invalid_grant / Invalid JWT Signature)."
                    )
                _logger.warning(
                    "No FIREBASE_CREDENTIALS_JSON and no valid GOOGLE_APPLICATION_CREDENTIALS file; "
                    "using Application Default Credentials (local/dev only)."
                )
                cred = credentials.ApplicationDefault()
                _log_firebase_cred_choice("adc", firebase_project_for_app)
            firebase_admin.initialize_app(cred, {"projectId": firebase_project_for_app})
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
    # Posts are stored with document id == slug (see upsert_post). A direct console
    # or import may set only the doc id and omit a `slug` field, so the query above
    # returns nothing even though posts/{slug} exists.
    snap = coll.document(slug).get()
    if snap.exists:
        data = snap.to_dict() or {}
        data["id"] = snap.id
        if not data.get("slug"):
            data["slug"] = snap.id
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
