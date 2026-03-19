"""Database layer — asyncpg connection pool and helpers."""
import json
import os
from pathlib import Path

import asyncpg

from config import CHANNELS, DATABASE_URL

pool: asyncpg.Pool | None = None


# ── Pool lifecycle ────────────────────────────────────────────────────
async def init_pool():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=20)


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None


async def init_schema():
    """Run schema.sql and seed default channels."""
    schema_path = Path(__file__).parent / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")
    async with pool.acquire() as conn:
        await conn.execute(sql)
        # Seed channels
        for ch in CHANNELS:
            await conn.execute(
                """INSERT INTO channels (id, username, title, stars)
                   VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING""",
                ch["id"], ch["username"], ch["title"], ch["stars"],
            )


# ── JSON helpers ──────────────────────────────────────────────────────
def _json_loads(val, default=None):
    if default is None:
        default = []
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return default
    return val if val is not None else default


# ── User helpers ──────────────────────────────────────────────────────
async def get_user(uid: int) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        return dict(row) if row else None


async def get_or_create_user(uid: int, username="", first_name="", photo_url="") -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        if not row:
            await conn.execute(
                "INSERT INTO users (id, username, first_name, photo_url) VALUES ($1,$2,$3,$4)",
                uid, username, first_name, photo_url,
            )
            row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        else:
            updates, vals = [], [uid]
            if username:
                updates.append(f"username=${len(vals)+1}")
                vals.append(username)
            if first_name:
                updates.append(f"first_name=${len(vals)+1}")
                vals.append(first_name)
            if photo_url:
                updates.append(f"photo_url=${len(vals)+1}")
                vals.append(photo_url)
            if updates:
                await conn.execute(
                    f"UPDATE users SET {','.join(updates)} WHERE id=$1", *vals
                )
                row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        return dict(row)


async def update_user(uid: int, **kwargs):
    if not kwargs:
        return
    async with pool.acquire() as conn:
        sets, vals = [], [uid]
        for k, v in kwargs.items():
            if isinstance(v, (list, dict)):
                v = json.dumps(v)
            vals.append(v)
            sets.append(f"{k}=${len(vals)}")
        await conn.execute(f"UPDATE users SET {','.join(sets)} WHERE id=$1", *vals)


def display_name(first_name="", username="", uid=None) -> str:
    fn = (first_name or "").strip()
    un = (username or "").strip()
    if fn and fn.lower() != "user":
        return fn
    if un:
        return f"@{un}"
    return str(uid) if uid else "Пользователь"


async def get_channels() -> list:
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM channels ORDER BY stars")
        return [dict(r) for r in rows]


async def increment_global_stat(key: str, amount: int = 1):
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO global_stats (key, value) VALUES ($1, $2) "
            "ON CONFLICT (key) DO UPDATE SET value = global_stats.value + $2",
            key, amount
        )


async def get_global_stat(key: str) -> int:
    async with pool.acquire() as conn:
        val = await conn.fetchval("SELECT value FROM global_stats WHERE key=$1", key)
        return val or 0


async def get_total_tasks_completed() -> int:
    """Sum of all completed tasks across all users + global counter."""
    async with pool.acquire() as conn:
        # We also count manual increments if any
        global_val = await get_global_stat("total_tasks")
        # For small-medium apps, we can just count live data for accuracy
        # But global_stats is better for "all time" metrics
        return global_val


async def get_leaderboard(sort_by: str = "stars", limit: int = 10) -> list:
    """sort_by: 'stars', 'referrals', 'tasks'"""
    async with pool.acquire() as conn:
        if sort_by == "stars":
            rows = await conn.fetch("SELECT id, first_name, username, stars FROM users WHERE banned=FALSE ORDER BY stars DESC LIMIT $1", limit)
        elif sort_by == "referrals":
            rows = await conn.fetch("SELECT id, first_name, username, jsonb_array_length(referrals) as refs FROM users WHERE banned=FALSE ORDER BY refs DESC LIMIT $1", limit)
        elif sort_by == "tasks":
            rows = await conn.fetch("SELECT id, first_name, username, jsonb_array_length(completed_tasks) as tasks FROM users WHERE banned=FALSE ORDER BY tasks DESC LIMIT $1", limit)
        else:
            return []
        
        result = []
        for r in rows:
            d = dict(r)
            d["name"] = display_name(r["first_name"], r["username"], r["id"])
            if "stars" in d: d["stars"] = float(d["stars"])
            result.append(d)
        return result


async def get_user_data(user: dict) -> dict:
    """Build full user response with qualified refs count."""
    refs = _json_loads(user["referrals"], [])
    completed = _json_loads(user["completed_tasks"], [])

    qualified = 0
    ref_list = []
    if refs:
        async with pool.acquire() as conn:
            for ref_id in refs:
                ref_row = await conn.fetchrow(
                    "SELECT id, first_name, username, completed_tasks FROM users WHERE id=$1",
                    ref_id,
                )
                if ref_row:
                    ref_tasks = _json_loads(ref_row["completed_tasks"], [])
                    q = len(ref_tasks) >= 1
                    if q:
                        qualified += 1
                    ref_list.append({
                        "id": ref_id,
                        "name": display_name(ref_row["first_name"], ref_row["username"], ref_id),
                        "username": ref_row["username"] or "",
                        "qualified": q,
                        "tasks": len(ref_tasks),
                    })

    override = user.get("qualified_refs_override", 0) or 0
    total_q = qualified + override
    can_withdraw = bool(user.get("can_withdraw")) or (total_q >= 15 and len(completed) >= 1)

    from config import BOT_USERNAME
    return {
        "id": user["id"],
        "username": user.get("username", ""),
        "first_name": user.get("first_name", ""),
        "photo_url": user.get("photo_url", ""),
        "stars": float(user.get("stars", 0)),
        "completed_tasks": completed,
        "cooldowns": _json_loads(user["cooldowns"], {}),
        "referrals": refs,
        "referrer": user.get("referrer"),
        "can_withdraw": can_withdraw,
        "qualified_referrals": total_q,
        "ref_link": f"https://t.me/{BOT_USERNAME}?start=ref_{user['id']}",
        "ref_list": ref_list,
        "nft_username": user.get("nft_username", ""),
        "nft_data": _json_loads(user.get("nft_data", "{}"), {}),
        "ton_wallet": user.get("ton_wallet", ""),
        "last_wheel_spin": user.get("last_wheel_spin").isoformat() if user.get("last_wheel_spin") else None,
    }
