from typing import List

from fastapi import APIRouter

from app.db.data import list_projects
from app.models.project import Project

router = APIRouter()


@router.get("/", response_model=List[Project], summary="List projects")
async def list_projects_route() -> List[Project]:
    items = list_projects()
    return [Project.model_validate(d) for d in items]
