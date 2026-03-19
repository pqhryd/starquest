"""Telegram WebApp initData validation & FastAPI dependency."""
import hashlib
import hmac
import json
from urllib.parse import unquote

from fastapi import Header, HTTPException

from config import BOT_TOKEN


def verify_init_data(init_data: str) -> dict | None:
    """Validate Telegram WebApp initData and return the user dict, or None."""
    try:
        params: dict[str, str] = {}
        for part in init_data.split("&"):
            k, _, v = part.partition("=")
            params[k] = v

        hash_val = params.pop("hash", "")
        if not hash_val:
            return None

        data_check = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(computed, hash_val):
            return None

        user_raw = params.get("user", "{}")
        return json.loads(unquote(user_raw))
    except Exception:
        return None


async def get_current_user(
    x_init_data: str = Header("", alias="X-Init-Data"),
    user_id: int | None = None,
) -> dict:
    """FastAPI dependency: extract authenticated Telegram user.

    Tries initData first; falls back to user_id query param for dev.
    """
    if x_init_data:
        tg_user = verify_init_data(x_init_data)
        if tg_user:
            return tg_user

    # Fallback for development / direct calls
    if user_id:
        return {"id": int(user_id), "first_name": "User", "username": ""}

    raise HTTPException(status_code=401, detail="Unauthorized")
