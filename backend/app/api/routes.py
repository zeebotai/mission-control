from fastapi import APIRouter

from app.api.routers import agents, cronobuilds, integrations, jobs, system, tasks

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(agents.router)
api_router.include_router(jobs.router)
api_router.include_router(integrations.router)
api_router.include_router(cronobuilds.router)
api_router.include_router(tasks.router)
