from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services import memory_files

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/daily")
def list_daily():
    files = memory_files.list_daily()
    return [{"date": f.date} for f in files]


@router.get("/daily/{date}")
def get_daily(date: str):
    try:
        content = memory_files.read_daily(date)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="not_found")
    return {"date": date, "content": content}


@router.get("/longterm")
def get_longterm():
    return {"content": memory_files.read_longterm()}
