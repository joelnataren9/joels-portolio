from contextlib import asynccontextmanager

from dotenv import load_dotenv

from fastapi import FastAPI

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, health, posts, projects
from app.db.data import init_firebase


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        lifespan=lifespan,
        title="Portfolio Backend",
        version="0.1.0",
        description="FastAPI backend for the AI-futuristic personal portfolio.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(admin.router, prefix="/admin", tags=["admin"])
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(posts.router, prefix="/posts", tags=["posts"])
    app.include_router(projects.router, prefix="/projects", tags=["projects"])

    return app


app = create_app()

