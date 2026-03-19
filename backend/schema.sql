-- StarQuest PostgreSQL Schema v3.0
-- Enhanced from original bot.py with NFT/Web3 fields

CREATE TABLE IF NOT EXISTS users (
    id                     BIGINT PRIMARY KEY,
    username               TEXT DEFAULT '',
    first_name             TEXT DEFAULT '',
    photo_url              TEXT DEFAULT '',
    stars                  REAL DEFAULT 0,
    completed_tasks        JSONB DEFAULT '[]',
    cooldowns              JSONB DEFAULT '{}',
    referrals              JSONB DEFAULT '[]',
    referrer               BIGINT DEFAULT NULL,
    qualified_refs_override INT DEFAULT 0,
    can_withdraw           BOOLEAN DEFAULT FALSE,
    banned                 BOOLEAN DEFAULT FALSE,
    -- NFT / Web3 fields
    nft_username           TEXT DEFAULT '',          -- Telegram collectible username
    nft_data               JSONB DEFAULT '{}',       -- NFT metadata cache
    ton_wallet             TEXT DEFAULT '',           -- TON wallet for crypto withdrawals
    -- Timestamps
    joined_at              TIMESTAMP DEFAULT NOW(),
    updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id          TEXT PRIMARY KEY,
    user_id     BIGINT,
    user_name   TEXT DEFAULT '',
    username    TEXT DEFAULT '',
    amount      REAL,
    wallet      TEXT DEFAULT '',
    method      TEXT DEFAULT 'stars',   -- 'stars' or 'ton'
    status      TEXT DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT NOW(),
    approved_by BIGINT DEFAULT NULL,
    rejected_by BIGINT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS channels (
    id       BIGINT PRIMARY KEY,
    username TEXT DEFAULT '',
    title    TEXT DEFAULT '',
    stars    REAL DEFAULT 1.0,
    nft_required BOOLEAN DEFAULT FALSE,  -- requires NFT to unlock
    nft_type     TEXT DEFAULT ''          -- type of NFT required
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS nft_mystery_boxes (
    id         SERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    cost       REAL DEFAULT 10.0,
    reward     JSONB DEFAULT '{}',      -- {"type": "stars", "amount": 25} etc.
    opened     BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    opened_at  TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned);
CREATE INDEX IF NOT EXISTS idx_users_can_withdraw ON users(can_withdraw);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_mystery_boxes_user ON nft_mystery_boxes(user_id);
