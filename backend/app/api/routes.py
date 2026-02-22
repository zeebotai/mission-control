from fastapi import APIRouter

from app.api.routers import agents, jobs, system

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(agents.router)
api_router.include_router(jobs.router)
