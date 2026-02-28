from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from app.services.database import get_session

router = APIRouter(prefix="/cronobuilds", tags=["cronobuilds"])

PHONE_RE = re.compile(r"\(\d{3}\)\s*\d{3}-\d{4}")
REVIEWS_RE = re.compile(r"\((\d+)\)")
RATING_RE = re.compile(r"\b(\d\.\d)\b")


class LeadCandidate(BaseModel):
    business_name: str
    phone_number: str | None = None
    industry: str | None = None
    rating: float | None = None
    reviews: int | None = None
    website: str = "none"  # per Trevor rule: missing website => none

    status: str = "lead"
    contact_method: str = "Text"
    date_contacted: date | None = None
    follow_up_date: date | None = None

    notes: str = ""


class ParseRequest(BaseModel):
    raw: str


class ParseResponse(BaseModel):
    leads: list[LeadCandidate]
    skipped: list[dict[str, Any]]


def _guess_industry(chunk: str) -> str | None:
    # crude mapping for now
    for key in [
        "Pressure washing",
        "Pest control",
        "Window cleaning",
        "Wildlife",
        "Junk removal",
        "Roofing",
        "Landscaping",
        "Tree",
        "Auto",
        "Plumbing",
    ]:
        if key.lower() in chunk.lower():
            return key
    return None


@router.post("/parse", response_model=ParseResponse)
def parse_leads(req: ParseRequest, db: Session = Depends(get_session)):
    # Split into chunks starting at what looks like a business name (line beginning)
    text = req.raw.strip()
    if not text:
        return {"leads": [], "skipped": []}

    # Naive split: new lead starts when we see a line that contains a rating like "4.7 (38)"
    # or a category (service) on the same line.
    parts = re.split(r"(?=\b\d\.\d\s*\(\d+\)\b)", text)
    leads: list[LeadCandidate] = []
    skipped: list[dict[str, Any]] = []

    for part in parts:
        chunk = part.strip()
        if not chunk:
            continue

        # Name: assume first line up to rating/category
        first_line = chunk.splitlines()[0].strip()
        # Business name likely precedes the rating token
        name = first_line
        m_rating = RATING_RE.search(first_line)
        if m_rating:
            name = first_line[: m_rating.start()].strip()

        phone_m = PHONE_RE.search(chunk)
        phone = phone_m.group(0) if phone_m else None

        rating_m = RATING_RE.search(chunk)
        rating = float(rating_m.group(1)) if rating_m else None

        reviews_m = REVIEWS_RE.search(chunk)
        reviews = int(reviews_m.group(1)) if reviews_m else None

        industry = _guess_industry(chunk)

        if not name and not phone:
            skipped.append({"reason": "unparseable", "raw": chunk[:200]})
            continue

        cand = LeadCandidate(
            business_name=name or "(unknown)",
            phone_number=phone,
            industry=industry,
            rating=rating,
            reviews=reviews,
            website="none",
            status="lead",
            contact_method="Text",
            date_contacted=None,
            follow_up_date=(date.today() + timedelta(days=1)),
        )
        leads.append(cand)

    return {"leads": leads, "skipped": skipped}
