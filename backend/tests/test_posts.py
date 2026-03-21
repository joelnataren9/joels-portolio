"""Tests for posts API - verifies publishedAt is accepted and persisted."""

import pytest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import verify_admin_token


@pytest.fixture
def client():
    """Test client with auth bypassed."""
    async def override():
        return {"sub": "admin", "email": "admin@test.com"}
    app.dependency_overrides[verify_admin_token] = override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def mock_get_post():
    """Return a mock post for get_post_by_slug."""
    return {
        "id": "test-slug",
        "slug": "test-slug",
        "title": "Test Post",
        "summary": "Summary",
        "contentMarkdown": "Content",
        "tags": [],
        "publishedAt": "2025-01-15T00:00:00.000Z",
        "updatedAt": "2025-01-15T00:00:00.000Z",
        "status": "published",
    }


def test_update_post_accepts_published_at(client, mock_get_post):
    """Verify PUT /posts/{slug} accepts publishedAt and includes it in the saved doc."""
    saved_doc = {}

    def capture_upsert(doc):
        nonlocal saved_doc
        saved_doc = doc.copy()

    with patch("app.api.routes.posts.get_post_by_slug", return_value=mock_get_post), \
         patch("app.api.routes.posts.upsert_post", side_effect=capture_upsert):
        res = client.put(
            "/posts/test-slug",
            json={
                "title": "Updated Title",
                "publishedAt": "2025-03-20T00:00:00.000Z",
            },
        )

    assert res.status_code == 200
    assert "publishedAt" in saved_doc
    assert saved_doc["publishedAt"] == "2025-03-20T00:00:00.000Z"
    assert saved_doc["title"] == "Updated Title"
