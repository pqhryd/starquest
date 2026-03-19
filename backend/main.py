"""StarQuest — FastAPI + Aiogram 3 main server."""
import asyncio
import json
import random
from contextlib import asynccontextmanager
from datetime import datetime, date

from fastapi import FastAPI, Request, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.fsm.storage.memory import MemoryStorage
from config import (
    BOT_TOKEN, WEBAPP_URL, BOT_USERNAME, API_PORT, APP_VERSION,
    ADMIN_IDS, PAY_ADMIN_IDS, CHANNELS, WHEEL_PRIZES, CORS_ORIGINS,
    MYSTERY_BOX_REWARDS,
)
import database as db
from auth import verify_init_data

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())


# ── LIFESPAN ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(application: FastAPI):
    await db.init_pool()
    await db.init_schema()
    print("✅ PostgreSQL connected!")
    polling_task = asyncio.create_task(dp.start_polling(bot))
    sub_check_task = asyncio.create_task(check_all_subscriptions())
    print("🤖 StarQuest Bot started!")
    yield
    polling_task.cancel()
    sub_check_task.cancel()
    await db.close_pool()


app = FastAPI(title="StarQuest API", version=APP_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── HELPERS ───────────────────────────────────────────────────────────
def _tg_user(request: Request, body: dict | None = None) -> dict | None:
    init_data = request.headers.get("X-Init-Data", "")
    tg_user = verify_init_data(init_data) if init_data else None
    if not tg_user:
        uid = (body or {}).get("user_id") or request.query_params.get("user_id")
        if uid:
            tg_user = {"id": int(uid), "first_name": "User", "username": ""}
    return tg_user


async def check_sub(user_id: int, channel_id: int) -> bool:
    try:
        m = await bot.get_chat_member(chat_id=channel_id, user_id=user_id)
        return m.status not in ("left", "kicked", "banned")
    except Exception:
        return False


def pick_wheel_prize() -> dict:
    r = random.random() * 100
    for p in WHEEL_PRIZES:
        r -= p["chance"]
        if r <= 0:
            return p
    return WHEEL_PRIZES[0]


# ── API ENDPOINTS ─────────────────────────────────────────────────────
@app.get("/api/version")
async def api_version():
    return {"version": APP_VERSION}


@app.get("/api/user")
async def api_get_user(request: Request, user_id: int | None = Query(None)):
    tg_user = _tg_user(request)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)

    uid = tg_user["id"]
    photo_url = ""
    try:
        photos = await bot.get_user_profile_photos(uid, limit=1)
        if photos.total_count > 0:
            file_id = photos.photos[0][-1].file_id
            f = await bot.get_file(file_id)
            photo_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{f.file_path}"
    except Exception:
        pass

    user = await db.get_or_create_user(
        uid, tg_user.get("username", ""), tg_user.get("first_name", ""), photo_url
    )
    if user.get("banned"):
        return JSONResponse({"ok": False, "error": "banned"}, 403)

    udata = await db.get_user_data(user)
    if udata["can_withdraw"] != bool(user.get("can_withdraw")):
        await db.update_user(uid, can_withdraw=udata["can_withdraw"])

    channels = await db.get_channels()
    return {"ok": True, "user": udata, "channels": channels, "version": APP_VERSION}


@app.post("/api/check_task")
async def api_check_task(request: Request):
    body = await request.json()
    tg_user = _tg_user(request, body)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)

    uid = tg_user["id"]
    channel_id = body.get("channel_id")
    user = await db.get_or_create_user(uid)
    if user.get("banned"):
        return JSONResponse({"ok": False, "error": "banned"}, 403)

    completed = db._json_loads(user["completed_tasks"], [])
    cooldowns = db._json_loads(user["cooldowns"], {})

    channels = await db.get_channels()
    channel = next((c for c in channels if c["id"] == channel_id), None)
    if not channel:
        return {"ok": False, "error": "Channel not found"}

    # Check cooldown
    last_done = cooldowns.get(str(channel_id))
    now = datetime.now()
    if last_done:
        last_dt = datetime.fromisoformat(last_done)
        diff = (now - last_dt).total_seconds()
        if diff < 86400:
            remaining = int(86400 - diff)
            h, m = remaining // 3600, (remaining % 3600) // 60
            return {"ok": True, "cooldown": True, "remaining_seconds": remaining,
                    "remaining_text": f"{h}ч {m}мин"}

    subscribed = await check_sub(uid, channel_id)
    if subscribed:
        new_stars = round(float(user["stars"]) + float(channel["stars"]), 1)
        is_first = channel_id not in completed
        if is_first:
            completed.append(channel_id)
        cooldowns[str(channel_id)] = now.isoformat()
        await db.update_user(uid, stars=new_stars, completed_tasks=completed, cooldowns=cooldowns)

        # Notify referrer on first task
        referrer_id = user.get("referrer")
        if referrer_id and is_first and len(completed) == 1:
            try:
                name = db.display_name(tg_user.get("first_name", ""), tg_user.get("username", ""), uid)
                await bot.send_message(
                    referrer_id,
                    f"🎉 Твой реферал <b>{name}</b> выполнил первое задание!\nОн теперь засчитан ✅",
                    parse_mode="HTML",
                )
            except Exception:
                pass

        return {"ok": True, "subscribed": True, "stars_earned": channel["stars"], "total_stars": new_stars}
    else:
        return {"ok": True, "subscribed": False}


@app.get("/api/withdrawals")
async def api_withdrawals(request: Request, user_id: int | None = Query(None)):
    tg_user = _tg_user(request)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)
    uid = tg_user["id"]
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, amount, wallet, status, created_at FROM withdrawals "
            "WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20", uid
        )
    result = [
        {"id": r["id"], "amount": float(r["amount"]), "wallet": r["wallet"],
         "status": r["status"], "date": str(r["created_at"])[:10]}
        for r in rows
    ]
    return {"ok": True, "withdrawals": result}


@app.post("/api/withdraw")
async def api_withdraw(request: Request):
    body = await request.json()
    tg_user = _tg_user(request, body)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)

    uid = tg_user["id"]
    amount = float(body.get("amount", 0))
    wallet = body.get("wallet", "").strip()
    method = body.get("method", "stars")

    user = await db.get_or_create_user(uid)
    udata = await db.get_user_data(user)
    if not udata["can_withdraw"]:
        return {"ok": False, "error": "Not eligible"}
    if amount < 50 or amount > float(user["stars"]):
        return {"ok": False, "error": "Invalid amount"}
    if not wallet:
        return {"ok": False, "error": "No wallet"}

    req_id = f"w_{uid}_{int(datetime.now().timestamp())}"
    async with db.pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO withdrawals (id,user_id,user_name,username,amount,wallet,method) "
            "VALUES ($1,$2,$3,$4,$5,$6,$7)",
            req_id, uid,
            db.display_name(tg_user.get("first_name", ""), tg_user.get("username", ""), uid),
            tg_user.get("username", ""), amount, wallet, method,
        )

    # Admin notification
    channels = await db.get_channels()
    sub_lines, all_subbed = "", True
    for ch in channels:
        if ch["id"] == 0:
            continue
        is_sub = await check_sub(uid, ch["id"])
        sub_lines += f"  {'✅' if is_sub else '❌'} {ch['title']}{'' if is_sub else ' — ОТПИСАН'}\n"
        if not is_sub:
            all_subbed = False

    name = db.display_name(tg_user.get("first_name", ""), tg_user.get("username", ""), uid)
    uname = tg_user.get("username", "")
    method_label = "TON" if method == "ton" else "Telegram Stars"
    admin_text = (
        f"💸 <b>Новая заявка на вывод</b>\n\n"
        f"👤 <b>{name}</b>{f' (@{uname})' if uname else ''}\n"
        f"🆔 ID: <code>{uid}</code>\n"
        f"⭐ Сумма: <b>{amount} звёзд</b>\n"
        f"💎 Метод: <b>{method_label}</b>\n"
        f"💳 Получатель: <code>{wallet}</code>\n"
        f"🕐 {datetime.now().strftime('%d.%m.%Y %H:%M')}\n\n"
        f"📢 <b>Подписки сейчас:</b>\n{sub_lines}\n"
        f"<b>{'✅ Подписан на все каналы' if all_subbed else '⚠️ НЕ подписан на некоторые!'}</b>"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="✅ Одобрить", callback_data=f"approve_{req_id}"),
        InlineKeyboardButton(text="❌ Отклонить", callback_data=f"reject_{req_id}"),
    ]])
    for admin_id in PAY_ADMIN_IDS:
        try:
            await bot.send_message(admin_id, admin_text, reply_markup=kb, parse_mode="HTML")
        except Exception:
            pass

    return {"ok": True, "req_id": req_id}


@app.post("/api/wheel_spin")
async def api_wheel_spin(request: Request):
    body = await request.json()
    tg_user = _tg_user(request, body)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)

    uid = tg_user["id"]
    user = await db.get_or_create_user(uid)
    if user.get("banned"):
        return JSONResponse({"ok": False, "error": "banned"}, 403)

    # Server picks the prize
    prize = pick_wheel_prize()
    new_stars = round(float(user["stars"]) + prize["stars"], 1)
    await db.update_user(uid, stars=new_stars)

    return {
        "ok": True,
        "prize_index": WHEEL_PRIZES.index(prize),
        "stars_won": prize["stars"],
        "total_stars": new_stars,
    }


@app.post("/api/nft/mystery_box")
async def api_mystery_box(request: Request):
    body = await request.json()
    tg_user = _tg_user(request, body)
    if not tg_user:
        return JSONResponse({"ok": False, "error": "Unauthorized"}, 401)

    uid = tg_user["id"]
    cost = float(body.get("cost", 10))
    user = await db.get_or_create_user(uid)

    if float(user["stars"]) < cost:
        return {"ok": False, "error": "Not enough stars"}

    # Random reward based on cost
    rewards = MYSTERY_BOX_REWARDS.get(cost, MYSTERY_BOX_REWARDS[10.0])
    r = random.random() * 100
    reward = rewards[0]
    for rw in rewards:
        r -= rw["chance"]
        if r <= 0:
            reward = rw
            break

    net = reward["amount"] - cost
    new_stars = round(float(user["stars"]) + net, 1)
    await db.update_user(uid, stars=max(0, new_stars))

    async with db.pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO nft_mystery_boxes (user_id, cost, reward, opened, opened_at) "
            "VALUES ($1, $2, $3, TRUE, NOW())",
            uid, cost, json.dumps(reward),
        )

    return {"ok": True, "reward": reward, "total_stars": max(0, new_stars)}


# ═══════════════════════════════════════════════════════════════════════
#  TELEGRAM BOT HANDLERS
# ═══════════════════════════════════════════════════════════════════════

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    uid = message.from_user.id
    args = message.text.split()
    ref_param = args[1] if len(args) > 1 else None

    user = await db.get_or_create_user(uid, message.from_user.username or "", message.from_user.first_name or "")
    if user.get("banned"):
        await message.answer("🚫 Ваш аккаунт заблокирован.")
        return

    if ref_param and ref_param.startswith("ref_"):
        try:
            ref_id = int(ref_param[4:])
            if ref_id != uid and not user.get("referrer"):
                referrer = await db.get_user(ref_id)
                if referrer:
                    async with db.pool.acquire() as conn:
                        refs = db._json_loads(referrer["referrals"], [])
                        if uid not in refs:
                            refs.append(uid)
                            ref_stars = round(float(referrer["stars"]) + 1, 1)
                            await conn.execute(
                                "UPDATE users SET referrals=$1, stars=$2 WHERE id=$3",
                                json.dumps(refs), ref_stars, ref_id,
                            )
                        await conn.execute("UPDATE users SET referrer=$1 WHERE id=$2", ref_id, uid)
                    try:
                        name = db.display_name(message.from_user.first_name, message.from_user.username, uid)
                        await bot.send_message(
                            ref_id,
                            f"👥 По твоей ссылке зашёл <b>{name}</b>!\n"
                            f"⭐ +1 звезда за реферала!\nКак только он выполнит задание — реферал засчитается ✅",
                            parse_mode="HTML",
                        )
                    except Exception:
                        pass
        except Exception as e:
            print(f"Referral error: {e}")

    user = await db.get_user(uid)
    completed = db._json_loads(user["completed_tasks"], [])
    refs = db._json_loads(user["referrals"], [])
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🌟 Открыть StarQuest", web_app=WebAppInfo(url=WEBAPP_URL))
    ]])
    await message.answer(
        f"👋 Привет, <b>{db.display_name(message.from_user.first_name, message.from_user.username, uid)}</b>!\n\n"
        f"⭐ Звёзд: <b>{user['stars']}</b>\n"
        f"✅ Заданий: <b>{len(completed)}</b>\n"
        f"👥 Рефералов: <b>{len(refs)}/15</b>\n\n"
        f"Выполняй задания, приглашай друзей и копи звёзды! 🚀",
        reply_markup=kb, parse_mode="HTML",
    )


# ── Admin Callbacks ───────────────────────────────────────────────────
@dp.callback_query(F.data.startswith("approve_"))
async def approve_cb(callback: types.CallbackQuery):
    if callback.from_user.id not in PAY_ADMIN_IDS:
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    req_id = callback.data[8:]
    async with db.pool.acquire() as conn:
        req = await conn.fetchrow("SELECT * FROM withdrawals WHERE id=$1", req_id)
        if not req:
            await callback.answer("Не найдена", show_alert=True)
            return
        if req["status"] != "pending":
            await callback.answer(f"Уже: {req['status']}", show_alert=True)
            return
        await conn.execute(
            "UPDATE withdrawals SET status='approved', approved_by=$1 WHERE id=$2",
            callback.from_user.id, req_id,
        )
        user = await conn.fetchrow("SELECT stars FROM users WHERE id=$1", req["user_id"])
        if user:
            new_s = max(0, round(float(user["stars"]) - float(req["amount"]), 1))
            await conn.execute("UPDATE users SET stars=$1 WHERE id=$2", new_s, req["user_id"])

    adm = callback.from_user.username or str(callback.from_user.id)
    try:
        await callback.message.edit_text(callback.message.text + f"\n\n✅ ОДОБРЕНО @{adm}", parse_mode="HTML")
    except Exception:
        pass
    wallet = req["wallet"].lstrip("@")
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="👤 Открыть профиль", url=f"https://t.me/{wallet}")
    ]])
    await bot.send_message(
        callback.from_user.id,
        f"<b>💸 Выплати {req['amount']} ⭐ звёзд</b>\n\nПолучатель: <code>{req['wallet']}</code>\n\n"
        f"Открой профиль → нажми Подарить подарок на сумму {int(req['amount'])} ⭐",
        reply_markup=kb, parse_mode="HTML",
    )
    try:
        await bot.send_message(
            req["user_id"],
            f"✅ <b>Заявка одобрена!</b>\n⭐ {req['amount']} звёзд\nСредства будут переведены в ближайшее время.",
            parse_mode="HTML",
        )
    except Exception:
        pass
    await callback.answer("✅ Одобрено!")


@dp.callback_query(F.data.startswith("reject_"))
async def reject_cb(callback: types.CallbackQuery):
    if callback.from_user.id not in PAY_ADMIN_IDS:
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    req_id = callback.data[7:]
    async with db.pool.acquire() as conn:
        req = await conn.fetchrow("SELECT * FROM withdrawals WHERE id=$1", req_id)
        if not req:
            await callback.answer("Не найдена", show_alert=True)
            return
        if req["status"] != "pending":
            await callback.answer(f"Уже: {req['status']}", show_alert=True)
            return
        await conn.execute(
            "UPDATE withdrawals SET status='rejected', rejected_by=$1 WHERE id=$2",
            callback.from_user.id, req_id,
        )
    adm = callback.from_user.username or str(callback.from_user.id)
    try:
        await callback.message.edit_text(callback.message.text + f"\n\n❌ ОТКЛОНЕНО @{adm}", parse_mode="HTML")
    except Exception:
        pass
    try:
        await bot.send_message(
            req["user_id"],
            f"❌ <b>Заявка отклонена.</b>\n⭐ {req['amount']} звёзд\nПо вопросам обратитесь в поддержку.",
            parse_mode="HTML",
        )
    except Exception:
        pass
    await callback.answer("❌ Отклонено")


# ── Admin Commands ────────────────────────────────────────────────────
@dp.message(Command("addstars"))
async def cmd_addstars(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        parts = msg.text.split()
        uid, amt = int(parts[1]), float(parts[2])
        async with db.pool.acquire() as conn:
            u = await conn.fetchrow("SELECT stars FROM users WHERE id=$1", uid)
            if not u: await msg.answer("❌ Не найден"); return
            ns = round(float(u["stars"]) + amt, 1)
            await conn.execute("UPDATE users SET stars=$1 WHERE id=$2", ns, uid)
        await msg.answer(f"✅ +{amt} звёзд для {uid}. Теперь: {ns}")
    except Exception:
        await msg.answer("❌ /addstars <id> <кол-во>")

@dp.message(Command("setstars"))
async def cmd_setstars(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        parts = msg.text.split()
        uid, amt = int(parts[1]), float(parts[2])
        async with db.pool.acquire() as conn:
            if not await conn.fetchrow("SELECT id FROM users WHERE id=$1", uid):
                await msg.answer("❌ Не найден"); return
            await conn.execute("UPDATE users SET stars=$1 WHERE id=$2", round(amt, 1), uid)
        await msg.answer(f"✅ Установлено {amt} звёзд для {uid}")
    except Exception:
        await msg.answer("❌ /setstars <id> <кол-во>")

@dp.message(Command("removestars"))
async def cmd_removestars(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        parts = msg.text.split()
        uid, amt = int(parts[1]), float(parts[2])
        async with db.pool.acquire() as conn:
            u = await conn.fetchrow("SELECT stars FROM users WHERE id=$1", uid)
            if not u: await msg.answer("❌ Не найден"); return
            ns = max(0, round(float(u["stars"]) - amt, 1))
            await conn.execute("UPDATE users SET stars=$1 WHERE id=$2", ns, uid)
        await msg.answer(f"✅ -{amt} звёзд у {uid}. Теперь: {ns}")
    except Exception:
        await msg.answer("❌ /removestars <id> <кол-во>")

@dp.message(Command("addrefs"))
async def cmd_addrefs(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        parts = msg.text.split()
        uid, amt = int(parts[1]), int(parts[2])
        async with db.pool.acquire() as conn:
            u = await conn.fetchrow("SELECT qualified_refs_override, completed_tasks FROM users WHERE id=$1", uid)
            if not u: await msg.answer("❌ Не найден"); return
            total = (u["qualified_refs_override"] or 0) + amt
            ct = db._json_loads(u["completed_tasks"], [])
            cw = total >= 15 and len(ct) >= 1
            await conn.execute("UPDATE users SET qualified_refs_override=$1, can_withdraw=$2 WHERE id=$3", total, cw, uid)
        await msg.answer(f"✅ +{amt} рефералов для {uid}. Всего: {total}/15")
    except Exception as e:
        await msg.answer(f"❌ /addrefs <id> <кол-во>\n{e}")

@dp.message(Command("setrefs"))
async def cmd_setrefs(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        parts = msg.text.split()
        uid, amt = int(parts[1]), int(parts[2])
        async with db.pool.acquire() as conn:
            u = await conn.fetchrow("SELECT completed_tasks FROM users WHERE id=$1", uid)
            if not u: await msg.answer("❌ Не найден"); return
            ct = db._json_loads(u["completed_tasks"], [])
            cw = amt >= 15 and len(ct) >= 1
            await conn.execute("UPDATE users SET qualified_refs_override=$1, can_withdraw=$2 WHERE id=$3", amt, cw, uid)
        await msg.answer(f"✅ Установлено {amt} рефералов для {uid}")
    except Exception:
        await msg.answer("❌ /setrefs <id> <кол-во>")

@dp.message(Command("unlock"))
async def cmd_unlock(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            if not await conn.fetchrow("SELECT id FROM users WHERE id=$1", uid):
                await msg.answer("❌ Не найден"); return
            await conn.execute("UPDATE users SET can_withdraw=TRUE, qualified_refs_override=15 WHERE id=$1", uid)
        await msg.answer(f"✅ Вывод разблокирован для {uid}")
    except Exception:
        await msg.answer("❌ /unlock <id>")

@dp.message(Command("lock"))
async def cmd_lock(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            await conn.execute("UPDATE users SET can_withdraw=FALSE WHERE id=$1", uid)
        await msg.answer(f"✅ Вывод заблокирован для {uid}")
    except Exception:
        await msg.answer("❌ /lock <id>")

@dp.message(Command("resettasks"))
async def cmd_resettasks(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            await conn.execute("UPDATE users SET completed_tasks='[]', cooldowns='{}' WHERE id=$1", uid)
        await msg.answer(f"✅ Задания и КД сброшены для {uid}")
    except Exception:
        await msg.answer("❌ /resettasks <id>")

@dp.message(Command("resetcd"))
async def cmd_resetcd(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            await conn.execute("UPDATE users SET cooldowns='{}', completed_tasks='[]' WHERE id=$1", uid)
        await msg.answer(f"✅ КД сброшен для {uid}")
    except Exception:
        await msg.answer("❌ /resetcd <id>")

@dp.message(Command("ban"))
async def cmd_ban(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            await conn.execute("UPDATE users SET banned=TRUE, stars=0, can_withdraw=FALSE WHERE id=$1", uid)
        await msg.answer(f"✅ Пользователь {uid} забанен")
    except Exception:
        await msg.answer("❌ /ban <id>")

@dp.message(Command("unban"))
async def cmd_unban(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        async with db.pool.acquire() as conn:
            await conn.execute("UPDATE users SET banned=FALSE WHERE id=$1", uid)
        await msg.answer(f"✅ Пользователь {uid} разбанен")
    except Exception:
        await msg.answer("❌ /unban <id>")

@dp.message(Command("userinfo"))
async def cmd_userinfo(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    try:
        uid = int(msg.text.split()[1])
        user = await db.get_user(uid)
        if not user: await msg.answer("❌ Не найден"); return
        ct = db._json_loads(user["completed_tasks"], [])
        refs = db._json_loads(user["referrals"], [])
        cds = db._json_loads(user["cooldowns"], {})
        cd_info = ""
        now = datetime.now()
        for ch_id, ts in cds.items():
            diff = (now - datetime.fromisoformat(ts)).total_seconds()
            if diff < 86400:
                cd_info += f"  КД {ch_id}: {int((86400 - diff) // 3600)}ч\n"
        override = user.get("qualified_refs_override") or 0
        uname = user.get("username") or ""
        fname = user.get("first_name") or ""
        referrer_id = user.get("referrer")
        dname = db.display_name(fname, uname, uid)
        tg_link = f'<a href="https://t.me/{uname}">@{uname}</a>' if uname else "нет username"
        referrer_str = f'<code>{referrer_id}</code>' if referrer_id else "нет"
        await msg.answer(
            f'👤 <a href="tg://user?id={uid}">{dname}</a> | {tg_link}\n'
            f"🆔 ID: <code>{uid}</code>\n"
            f"⭐ Звёзд: {user['stars']}\n"
            f"✅ Заданий: {len(ct)}\n"
            f"👥 Рефералов: {len(refs)} (ручных: {override})\n"
            f"🔗 Пришёл от: {referrer_str}\n"
            f"📋 Список рефов: {refs if refs else 'пусто'}\n"
            f"💸 Вывод: {'✅' if user.get('can_withdraw') else '❌'}\n"
            f"🚫 Бан: {'Да' if user.get('banned') else 'Нет'}\n"
            f"📅 Рег: {str(user.get('joined_at', '—'))[:10]}\n"
            + (f"⏳ КД:\n{cd_info}" if cd_info else ""),
            parse_mode="HTML",
        )
    except Exception:
        await msg.answer("❌ /userinfo <id>")

@dp.message(Command("stats"))
async def cmd_stats(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    async with db.pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM users")
        active = await conn.fetchval("SELECT COUNT(*) FROM users WHERE completed_tasks!='[]'")
        total_stars = await conn.fetchval("SELECT COALESCE(SUM(stars),0) FROM users")
        can_w = await conn.fetchval("SELECT COUNT(*) FROM users WHERE can_withdraw=TRUE")
        banned = await conn.fetchval("SELECT COUNT(*) FROM users WHERE banned=TRUE")
        today_new = await conn.fetchval("SELECT COUNT(*) FROM users WHERE DATE(joined_at)=$1", date.today())
        pending = await conn.fetchval("SELECT COUNT(*) FROM withdrawals WHERE status='pending'")
        approved = await conn.fetchval("SELECT COUNT(*) FROM withdrawals WHERE status='approved'")
        channels = await db.get_channels()
        ch_lines = ""
        for ch in channels:
            subs = await conn.fetchval(
                f"SELECT COUNT(*) FROM users WHERE completed_tasks::text LIKE '%{ch['id']}%'"
            )
            ch_lines += f"  {ch['title']}: {subs} чел.\n"
    await msg.answer(
        f"📊 <b>Статистика</b>\n\n"
        f"👥 Всего: <b>{total}</b> | Сегодня: <b>{today_new}</b>\n"
        f"✅ Выполнили задание: <b>{active}</b>\n"
        f"⭐ Всего звёзд: <b>{round(total_stars, 1)}</b>\n"
        f"💸 Могут вывести: <b>{can_w}</b>\n"
        f"🚫 Забанено: <b>{banned}</b>\n\n"
        f"📢 Каналы:\n{ch_lines}\n"
        f"💸 Заявки: ожидают <b>{pending}</b> | одобрено <b>{approved}</b>",
        parse_mode="HTML",
    )

@dp.message(Command("allusers"))
async def cmd_allusers(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, first_name, username, stars, can_withdraw FROM users ORDER BY stars DESC LIMIT 30"
        )
    lines = []
    for r in rows:
        fname = r["first_name"] or ""
        uname = r["username"] or ""
        display = fname if (fname and fname.lower() != "user") else (uname or str(r["id"]))
        link = f'<a href="tg://user?id={r["id"]}">{display}</a>'
        ulink = f' <a href="https://t.me/{uname}">@{uname}</a>' if uname else ""
        lines.append(f"{link}{ulink} | ⭐{r['stars']} | {'✅' if r['can_withdraw'] else '❌'}")
    await msg.answer("👥 Топ пользователи:\n" + "\n".join(lines), parse_mode="HTML")

@dp.message(Command("pending"))
async def cmd_pending(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    async with db.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM withdrawals WHERE status='pending' ORDER BY created_at LIMIT 10")
    if not rows:
        await msg.answer("✅ Нет ожидающих заявок"); return
    for req in rows:
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="✅ Одобрить", callback_data=f"approve_{req['id']}"),
            InlineKeyboardButton(text="❌ Отклонить", callback_data=f"reject_{req['id']}"),
        ]])
        uname_req = req["username"] or ""
        ulink_req = f' <a href="https://t.me/{uname_req}">@{uname_req}</a>' if uname_req else ""
        await msg.answer(
            f'👤 <a href="tg://user?id={req["user_id"]}">{req["user_name"]}</a>{ulink_req}\n'
            f"🆔 ID: <code>{req['user_id']}</code>\n"
            f"⭐ {req['amount']} → <code>{req['wallet']}</code>\n"
            f"💸 <code>{req['id']}</code>",
            reply_markup=kb, parse_mode="HTML",
        )

@dp.message(Command("broadcast"))
async def cmd_broadcast(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    text = msg.text[len("/broadcast "):].strip()
    if not text: await msg.answer("❌ /broadcast <текст>"); return
    async with db.pool.acquire() as conn:
        rows = await conn.fetch("SELECT id FROM users WHERE banned=FALSE")
    sent = failed = 0
    await msg.answer(f"📤 Рассылка {len(rows)} пользователям...")
    for row in rows:
        try:
            await bot.send_message(row["id"], text, parse_mode="HTML")
            sent += 1
            await asyncio.sleep(0.05)
        except Exception:
            failed += 1
    await msg.answer(f"✅ Готово! Отправлено: {sent} | Ошибок: {failed}")

@dp.message(Command("global"))
async def cmd_global(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    parts = msg.text.split()
    if len(parts) < 2:
        await msg.answer(
            "⚙️ <b>Глобальные действия</b>\n\n"
            "/global resetcd — сбросить КД\n"
            "/global resettasks — сбросить задания + КД\n"
            "/global resetrefs — обнулить рефералов\n"
            "/global resetstars — обнулить звёзды\n"
            "/global addstars N — добавить звёзды\n"
            "/global unlocall — разблокировать вывод\n"
            "/global lockall — заблокировать вывод",
            parse_mode="HTML",
        )
        return
    action = parts[1].lower()
    async with db.pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM users WHERE banned=FALSE")
        if action == "resetcd":
            await conn.execute("UPDATE users SET cooldowns='{}' WHERE banned=FALSE")
        elif action == "resettasks":
            await conn.execute("UPDATE users SET completed_tasks='[]', cooldowns='{}' WHERE banned=FALSE")
        elif action == "resetrefs":
            await conn.execute("UPDATE users SET referrals='[]', qualified_refs_override=0 WHERE banned=FALSE")
        elif action == "resetstars":
            await conn.execute("UPDATE users SET stars=0 WHERE banned=FALSE")
        elif action == "addstars":
            if len(parts) < 3: await msg.answer("❌ /global addstars <N>"); return
            amt = float(parts[2])
            await conn.execute("UPDATE users SET stars=ROUND((stars+$1)::numeric,1) WHERE banned=FALSE", amt)
        elif action == "unlocall":
            await conn.execute("UPDATE users SET can_withdraw=TRUE, qualified_refs_override=15 WHERE banned=FALSE")
        elif action == "lockall":
            await conn.execute("UPDATE users SET can_withdraw=FALSE WHERE banned=FALSE")
        else:
            await msg.answer(f"❌ Неизвестное действие: {action}"); return
    await msg.answer(f"✅ {action} применено для {total} пользователей")

@dp.message(Command("updatechannels"))
async def cmd_updatechannels(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    async with db.pool.acquire() as conn:
        for ch in CHANNELS:
            await conn.execute(
                "INSERT INTO channels (id,username,title,stars) VALUES ($1,$2,$3,$4) "
                "ON CONFLICT (id) DO UPDATE SET username=$2, title=$3, stars=$4",
                ch["id"], ch["username"], ch["title"], ch["stars"],
            )
    await msg.answer("✅ Каналы обновлены!")

@dp.message(Command("myid"))
async def cmd_myid(msg: types.Message):
    await msg.answer(f"🆔 Твой ID: {msg.from_user.id}")

@dp.message(Command("adminhelp"))
async def cmd_adminhelp(msg: types.Message):
    if msg.from_user.id not in ADMIN_IDS: return
    await msg.answer(
        "🛠 <b>ПОЛНЫЙ СПИСОК КОМАНД</b>\n\n"
        "⭐ <b>Звёзды:</b>\n/addstars · /setstars · /removestars\n\n"
        "👥 <b>Рефералы:</b>\n/addrefs · /setrefs\n\n"
        "🔓 <b>Вывод:</b>\n/unlock · /lock · /pending\n\n"
        "🎯 <b>Задания:</b>\n/resettasks · /resetcd\n\n"
        "👤 <b>Инфо:</b>\n/userinfo · /allusers · /stats\n\n"
        "🚫 <b>Бан:</b>\n/ban · /unban\n\n"
        "⚙️ <b>Прочее:</b>\n/broadcast · /global · /updatechannels · /myid",
        parse_mode="HTML",
    )


# ── Background subscription check ────────────────────────────────────
async def check_all_subscriptions():
    await asyncio.sleep(60)
    while True:
        try:
            channels = await db.get_channels()
            async with db.pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT id, stars, completed_tasks, cooldowns FROM users "
                    "WHERE banned=FALSE AND completed_tasks!='[]'"
                )
            for row in rows:
                uid = row["id"]
                completed = db._json_loads(row["completed_tasks"], [])
                cooldowns = db._json_loads(row["cooldowns"], {})
                changed = False
                stars = float(row["stars"])
                for ch in channels:
                    if ch["id"] not in completed or ch["id"] == 0:
                        continue
                    if not await check_sub(uid, ch["id"]):
                        stars = max(0, round(stars - float(ch["stars"]), 1))
                        completed = [t for t in completed if t != ch["id"]]
                        cooldowns.pop(str(ch["id"]), None)
                        changed = True
                        try:
                            await bot.send_message(
                                uid,
                                f"⚠️ Ты отписался от <b>{ch['title']}</b>!\n⭐ -{ch['stars']} звёзд списано.",
                                parse_mode="HTML",
                            )
                        except Exception:
                            pass
                if changed:
                    await db.update_user(uid, stars=stars, completed_tasks=completed, cooldowns=cooldowns)
        except Exception as e:
            print(f"Sub check error: {e}")
        await asyncio.sleep(6 * 3600)


# ── Entrypoint ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=API_PORT, log_level="info")
