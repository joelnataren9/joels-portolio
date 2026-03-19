from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.db.data import get_post_by_slug, list_posts as db_list_posts
from app.models.post import Post, PostListItem

router = APIRouter()


@router.get("/", response_model=List[PostListItem], summary="List blog posts")
async def list_posts(
    tag: Optional[str] = Query(default=None, description="Filter by tag"),
    search: Optional[str] = Query(default=None, description="Search in title/summary"),
) -> List[PostListItem]:
    items = db_list_posts(tag=tag, search=search)
    return [PostListItem.model_validate(d) for d in items]


@router.get("/{slug}", response_model=Post, summary="Get a single blog post by slug")
async def get_post(slug: str) -> Post:
    data = get_post_by_slug(slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return Post.model_validate(data)
