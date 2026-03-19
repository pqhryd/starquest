import os

# ── Bot & App ─────────────────────────────────────────────────────────
BOT_TOKEN    = os.getenv("BOT_TOKEN", "")
WEBAPP_URL   = os.getenv("WEBAPP_URL", "https://pqhryd.github.io/starquest/")
BOT_USERNAME = os.getenv("BOT_USERNAME", "starquesttbot")
DATABASE_URL = os.getenv("DATABASE_URL", "")
API_PORT     = int(os.getenv("PORT", 8080))
APP_VERSION  = os.getenv("APP_VERSION", "3.0")

# ── Admin ─────────────────────────────────────────────────────────────
ADMIN_IDS    = list(map(int, os.getenv("ADMIN_IDS", "1206238888").split(",")))
PAY_ADMIN_IDS = list(map(int, os.getenv("PAY_ADMIN_IDS", "1206238888,5464821958").split(",")))

# ── Default channels (seeded on first run) ────────────────────────────
CHANNELS = [
    {"id": -1002869326663, "username": "crypto_watch_tg", "title": "Crypto Watch", "stars": 1.0},
    {"id": -1003527886249, "username": "nft_watch_tg",    "title": "NFT Watch",    "stars": 1.5},
    {"id": -1003487958413, "username": "starquest_tg",    "title": "StarQuest",    "stars": 1.0},
]

# ── Wheel prizes (server-authoritative) ───────────────────────────────
WHEEL_PRIZES = [
    {"stars": 0.5,  "label": "0.5 ⭐", "chance": 60},
    {"stars": 1.0,  "label": "1 ⭐",   "chance": 32},
    {"stars": 1.5,  "label": "1.5 ⭐", "chance": 5},
    {"stars": 2.0,  "label": "2 ⭐",   "chance": 1.8},
    {"stars": 3.0,  "label": "3 ⭐",   "chance": 0.6},
    {"stars": 5.0,  "label": "5 ⭐",   "chance": 0.4},
    {"stars": 10.0, "label": "10 ⭐",  "chance": 0.2},
]

# ── CORS ──────────────────────────────────────────────────────────────
CORS_ORIGINS = ["*"]
