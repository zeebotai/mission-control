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

    # Your paste format reliably contains the delimiter "Add a label" between businesses.
    # So: split into blocks, then parse each block's header.
    blocks = [b.strip() for b in text.split("Add a label") if b.strip()]

    header_re = re.compile(
        r"^(?P<name>.+?)\s+(?P<rating>\d\.\d)\s*\((?P<reviews>\d+)\)\s+(?P<category>.*?\bservice\b)",
        re.IGNORECASE,
    )

    leads: list[LeadCandidate] = []
    skipped: list[dict[str, Any]] = []

    for block in blocks:
        # Normalize whitespace so the regex can anchor at start.
        normalized = " ".join(block.split())

        m = header_re.search(normalized)
        if not m:
            skipped.append({"reason": "no_header_in_block", "raw": normalized[:200]})
            continue

        name = m.group("name").strip()
        rating = float(m.group("rating"))
        reviews = int(m.group("reviews"))
        category = m.group("category").strip()

        phone_m = PHONE_RE.search(normalized)
        phone = phone_m.group(0) if phone_m else None

        industry = _guess_industry(normalized) or category

        leads.append(
            LeadCandidate(
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
        )

    if not leads:
        skipped.append({"reason": "no_leads_parsed", "raw": text[:200]})

    return {"leads": leads, "skipped": skipped}
