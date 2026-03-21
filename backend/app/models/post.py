from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Post(BaseModel):
    id: str
    slug: str
    title: str
    summary: Optional[str] = None
    content_markdown: str = Field(alias="contentMarkdown")
    tags: List[str] = []
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")
    edited_at: Optional[datetime] = Field(default=None, alias="editedAt")
    hero_media_url: Optional[str] = Field(default=None, alias="heroMediaUrl")
    is_video: bool = Field(default=False, alias="isVideo")
    status: str = "published"

    class Config:
        populate_by_name = True


class PostListItem(BaseModel):
    slug: str
    title: str
    summary: Optional[str] = None
    tags: List[str] = []
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    edited_at: Optional[datetime] = Field(default=None, alias="editedAt")


class PostCreate(BaseModel):
    slug: str
    title: str
    summary: Optional[str] = None
    content_markdown: str = Field(default="", alias="contentMarkdown")
    tags: List[str] = []
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    hero_media_url: Optional[str] = Field(default=None, alias="heroMediaUrl")
    is_video: bool = Field(default=False, alias="isVideo")
    status: str = "published"

    class Config:
        populate_by_name = True


class PostUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content_markdown: Optional[str] = Field(default=None, alias="contentMarkdown")
    tags: Optional[List[str]] = None
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    hero_media_url: Optional[str] = Field(default=None, alias="heroMediaUrl")
    is_video: Optional[bool] = Field(default=None, alias="isVideo")
    status: Optional[str] = None

    class Config:
        populate_by_name = True

