from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.services.database import get_session

from .followups import due_followups

router = APIRouter(prefix="", tags=["cronobuilds"])


def _script_tier(follow_up_date: str, today: str) -> str:
    # simple tiers; older follow-ups get the more direct booking script
    if follow_up_date <= (date.fromisoformat(today).replace(day=1)).isoformat():
        return "direct"
    return "normal"


@router.get("/followups/priority")
async def priority_followups(limit: int = 10, db: Session = Depends(get_session)) -> dict[str, Any]:
    data = await due_followups(limit=limit, db=db)
    today = data["today"]
    followups = data.get("followups", [])

    # Sort oldest first
    followups_sorted = sorted(followups, key=lambda f: (f.get("follow_up_date") or "9999-99-99", f.get("business_name") or ""))

    lines: list[str] = []
    lines.append(f"Priority follow-ups (due <= {today}): {len(followups_sorted)}")

    for i, f in enumerate(followups_sorted, start=1):
        name = f.get("business_name")
        phone = f.get("phone_number")
        fud = f.get("follow_up_date")
        status = f.get("status")
        status_val = status.get("value") if isinstance(status, dict) else status
        lines.append(f"{i}. {name} — {phone} — due {fud} — {status_val}")

    lines.append("")
    lines.append("Tier-1 bump (book a call):")
    lines.append(
        "Hey — circling back. Still want help getting more leads coming in this month? If yes, I can show you a quick plan. Better for a 10‑min call today at 3:30 or 6:00?"
    )
    lines.append("")
    lines.append("Soft bump (send breakdown):")
    lines.append(
        "Quick bump — did you see my last message? Want me to put together a quick mockup + a 2‑minute breakdown of price/next steps?"
    )
    lines.append("")
    lines.append("Breakup / yes-no:")
    lines.append(
        "Last check‑in from me — should I close your file, or do you want pricing + next steps?"
    )

    return {"today": today, "count": len(followups_sorted), "followups": followups_sorted, "text": "\n".join(lines)}
