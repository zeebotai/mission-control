from __future__ import annotations

import urllib.parse
from typing import Any

import httpx


class BaserowClient:
    def __init__(self, *, token: str, base_url: str = "https://api.baserow.io"):
        self._token = token
        self._base_url = base_url.rstrip("/")

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Token {self._token}"}

    async def list_rows(
        self,
        *,
        table_id: int,
        page: int = 1,
        page_size: int = 200,
        user_field_names: bool = True,
    ) -> dict[str, Any]:
        params = {
            "page": page,
            "size": page_size,
            "user_field_names": "true" if user_field_names else "false",
        }
        url = f"{self._base_url}/api/database/rows/table/{table_id}/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url, params=params, headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def create_row(
        self,
        *,
        table_id: int,
        data: dict[str, Any],
        user_field_names: bool = True,
    ) -> dict[str, Any]:
        params = {
            "user_field_names": "true" if user_field_names else "false",
        }
        url = f"{self._base_url}/api/database/rows/table/{table_id}/"
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, params=params, headers=self.headers, json=data)
            r.raise_for_status()
            return r.json()


def normalize_phone(s: str) -> str:
    return "".join(ch for ch in s if ch.isdigit())


def normalize_name(s: str) -> str:
    return " ".join(s.strip().lower().split())
