from datetime import datetime
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import verify_admin_token
from app.db.data import delete_post, get_post_by_slug, list_posts as db_list_posts, upsert_post
from app.models.post import Post, PostCreate, PostListItem, PostUpdate

router = APIRouter()


def _datetime_to_iso(d: Optional[datetime]) -> Optional[str]:
    """Convert datetime to ISO string for consistent Firestore storage."""
    if d is None:
        return None
    s = d.isoformat()
    return s + "Z" if "Z" not in s and "+" not in s else s


def _to_document(model: Union[PostCreate, PostUpdate], existing: Optional[dict] = None) -> dict:
    """Convert create/update model to Firestore document (camelCase)."""
    now = datetime.utcnow().isoformat() + "Z"
    base = existing.copy() if existing else {}
    if isinstance(model, PostCreate):
        base.update({
            "slug": model.slug,
            "title": model.title,
            "summary": model.summary,
            "contentMarkdown": model.content_markdown,
            "tags": model.tags,
            "publishedAt": _datetime_to_iso(model.published_at) if model.published_at is not None else now,
            "heroMediaUrl": model.hero_media_url,
            "isVideo": model.is_video,
            "status": model.status,
        })
    else:
        if model.title is not None:
            base["title"] = model.title
        if model.summary is not None:
            base["summary"] = model.summary
        if model.content_markdown is not None:
            base["contentMarkdown"] = model.content_markdown
        if model.tags is not None:
            base["tags"] = model.tags
        if model.published_at is not None:
            base["publishedAt"] = _datetime_to_iso(model.published_at)
        if model.hero_media_url is not None:
            base["heroMediaUrl"] = model.hero_media_url
        if model.is_video is not None:
            base["isVideo"] = model.is_video
        if model.status is not None:
            base["status"] = model.status
    base.setdefault("publishedAt", now)
    base["updatedAt"] = now
    # editedAt only set when updating an existing post (not on create)
    if existing is not None:
        base["editedAt"] = now
    return base


@router.get("/", response_model=List[PostListItem], response_model_by_alias=True, summary="List blog posts")
async def list_posts(
    tag: Optional[str] = Query(default=None, description="Filter by tag"),
    search: Optional[str] = Query(default=None, description="Search in title/summary"),
    include_drafts: bool = Query(default=False, description="Include draft posts (for admin)"),
) -> List[PostListItem]:
    items = db_list_posts(tag=tag, search=search, published_only=not include_drafts)
    return [PostListItem.model_validate(d) for d in items]


@router.get("/{slug}", response_model=Post, response_model_by_alias=True, summary="Get a single blog post by slug")
async def get_post(slug: str) -> Post:
    data = get_post_by_slug(slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return Post.model_validate(data)


@router.post("/", response_model=Post, status_code=201, summary="Create a blog post (admin)")
async def create_post(
    body: PostCreate,
    _user: dict = Depends(verify_admin_token),
) -> Post:
    if get_post_by_slug(body.slug):
        raise HTTPException(status_code=409, detail=f"Post with slug '{body.slug}' already exists")
    doc = _to_document(body)
    upsert_post(doc)
    doc["id"] = doc["slug"]
    return Post.model_validate(doc)


@router.put("/{slug}", response_model=Post, summary="Update a blog post (admin)")
async def update_post(
    slug: str,
    body: PostUpdate,
    _user: dict = Depends(verify_admin_token),
) -> Post:
    existing = get_post_by_slug(slug)
    if existing is None:
        raise HTTPException(status_code=404, detail="Post not found")
    doc = _to_document(body, existing)
    doc["slug"] = slug
    doc["id"] = slug
    upsert_post(doc)
    return Post.model_validate(doc)


@router.delete("/{slug}", status_code=204, summary="Delete a blog post (admin)")
async def remove_post(
    slug: str,
    _user: dict = Depends(verify_admin_token),
) -> None:
    if get_post_by_slug(slug) is None:
        raise HTTPException(status_code=404, detail="Post not found")
    delete_post(slug)
