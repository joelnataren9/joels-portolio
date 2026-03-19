from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Project(BaseModel):
    id: str
    slug: str
    name: str
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list, alias="techStack")
    github_url: Optional[str] = Field(default=None, alias="githubUrl")
    live_url: Optional[str] = Field(default=None, alias="liveUrl")
    highlighted: bool = False
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True

