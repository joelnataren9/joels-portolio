"""Database layer - single file: app/db/data.py. Change that file to switch providers."""

from app.db.data import (
    get_post_by_slug,
    list_posts,
    list_projects,
    upsert_post,
)

__all__ = ["get_post_by_slug", "list_posts", "list_projects", "upsert_post"]
