from __future__ import annotations

from sqlmodel import Session, SQLModel, create_engine

from app.settings import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)

    # Lightweight SQLite migrations (create_all won't alter existing tables).
    if settings.database_url.startswith("sqlite"):
        _sqlite_migrate()


def _sqlite_has_column(conn, table: str, col: str) -> bool:
    rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
    return any(r[1] == col for r in rows)


def _sqlite_migrate() -> None:
    with engine.connect() as conn:
        # tasks: add project_slug
        try:
            if not _sqlite_has_column(conn, "task", "project_slug"):
                conn.exec_driver_sql("ALTER TABLE task ADD COLUMN project_slug VARCHAR DEFAULT ''")
        except Exception:
            pass

        # docs: add category
        try:
            if not _sqlite_has_column(conn, "doc", "category"):
                conn.exec_driver_sql("ALTER TABLE doc ADD COLUMN category VARCHAR DEFAULT 'general'")
        except Exception:
            pass


def get_session():
    with Session(engine) as session:
        yield session
