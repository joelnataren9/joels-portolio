from fastapi import FastAPI

from app.api.routes import health, posts, projects


def create_app() -> FastAPI:
    app = FastAPI(
        title="Portfolio Backend",
        version="0.1.0",
        description="FastAPI backend for the AI-futuristic personal portfolio.",
    )

    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(posts.router, prefix="/posts", tags=["posts"])
    app.include_router(projects.router, prefix="/projects", tags=["projects"])

    return app


app = create_app()

