from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.api.routes import api_router
from app.models.db import Agent, Job
from app.services.activity import log_event
from app.services.database import engine, init_db


def create_app() -> FastAPI:
    app = FastAPI(title="Mission Control", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"] ,
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.on_event("startup")
    def _startup():
        init_db()
        # Seed minimal fake-but-stored data so the UI is alive.
        with Session(engine) as db:
            if not db.exec(select(Agent)).first():
                db.add_all(
                    [
                        Agent(name="main", role="orchestrator", status="idle", current_task=""),
                        Agent(name="cron", role="scheduler", status="running", current_task="Polling jobs"),
                    ]
                )
                db.commit()
                log_event(db, source="system", event_type="boot", human_summary="Mission Control backend started")

            if not db.exec(select(Job)).first():
                db.add_all(
                    [
                        Job(name="Daily lead list", schedule="0 7 * * *", status="idle", owner_agent="cron"),
                        Job(name="Nightly health check", schedule="0 2 * * *", status="idle", owner_agent="cron"),
                    ]
                )
                db.commit()

    return app


app = create_app()
