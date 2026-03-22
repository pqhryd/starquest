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
    {"id": -1002883988325, "username": "Te1egramPODAROK", "title": "Telegram ПОДАРОК", "stars": 3.0},
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

# ── Mystery Box Rewards (tiered by cost) ──────────────────────────────
MYSTERY_BOX_REWARDS = {
    10.0: [ # Bronze
        {"type": "stars", "amount": 0.5, "chance": 70},
        {"type": "stars", "amount": 1,   "chance": 20},
        {"type": "stars", "amount": 3,   "chance": 7},
        {"type": "stars", "amount": 10,  "chance": 2},
        {"type": "stars", "amount": 30,  "chance": 0.9},
        {"type": "stars", "amount": 100, "chance": 0.1},
    ],
    25.0: [ # Silver
        {"type": "stars", "amount": 1,   "chance": 70},
        {"type": "stars", "amount": 3,   "chance": 19},
        {"type": "stars", "amount": 8,   "chance": 7.5},
        {"type": "stars", "amount": 25,  "chance": 2.5},
        {"type": "stars", "amount": 80,  "chance": 0.95},
        {"type": "stars", "amount": 250, "chance": 0.05},
    ],
    50.0: [ # Gold
        {"type": "stars", "amount": 2,   "chance": 70},
        {"type": "stars", "amount": 5,   "chance": 18},
        {"type": "stars", "amount": 15,  "chance": 8},
        {"type": "stars", "amount": 50,  "chance": 3},
        {"type": "stars", "amount": 200, "chance": 0.99},
        {"type": "stars", "amount": 500, "chance": 0.01},
    ],
}

# ── CORS ──────────────────────────────────────────────────────────────
CORS_ORIGINS = ["*"]
