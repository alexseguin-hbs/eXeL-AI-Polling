-- Migration 014: Cube 11 (Blockchain) + Cube 12 (Divinity/NFT) tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ppgfjplawtlrfqpnszyb/sql
-- Version: 2026.04.14_v024

-- ═══ CUBE 11: Blockchain Records (Survey on-chain proofs) ═══
CREATE TABLE IF NOT EXISTS blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_hash TEXT NOT NULL UNIQUE,
    governance_proof TEXT NOT NULL,
    winning_theme TEXT NOT NULL,
    voter_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    quai_tx_hash TEXT,
    chain_status TEXT DEFAULT 'pending',  -- pending, recorded, failed
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_blockchain_records_status ON blockchain_records(chain_status);
CREATE INDEX IF NOT EXISTS ix_blockchain_records_session ON blockchain_records(session_hash);

-- ═══ CUBE 12: ARX Items (Physically-backed NFTs) ═══
CREATE TABLE IF NOT EXISTS arx_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id INTEGER,
    chip_key_hash TEXT,
    item_name TEXT NOT NULL,
    serial_number TEXT,
    edition INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    current_owner TEXT,
    purchase_price_usd NUMERIC(10,2),
    quai_tx_hash TEXT,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_transfer_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_arx_items_owner ON arx_items(current_owner);
CREATE INDEX IF NOT EXISTS ix_arx_items_token ON arx_items(token_id);

-- ═══ CUBE 12: ARX Transactions (buy/sell/transfer log) ═══
CREATE TABLE IF NOT EXISTS arx_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arx_tx_id TEXT UNIQUE NOT NULL,       -- "ARX-2026-000001"
    token_id INTEGER NOT NULL,
    from_address TEXT,
    to_address TEXT NOT NULL,
    price_usd NUMERIC(10,2),
    transaction_type TEXT NOT NULL,        -- mint, transfer, sale
    quai_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_arx_tx_token ON arx_transactions(token_id);
CREATE INDEX IF NOT EXISTS ix_arx_tx_type ON arx_transactions(transaction_type);

-- ═══ CUBE 8+11: Deferred Claim Tokens (anonymous poller rewards) ═══
CREATE TABLE IF NOT EXISTS deferred_claim_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT NOT NULL,
    session_code TEXT NOT NULL,
    heart_earned NUMERIC(10,3) DEFAULT 0,
    claim_code TEXT UNIQUE NOT NULL,       -- "CLM-7X9K2M"
    claimed BOOLEAN DEFAULT false,
    claimed_by TEXT,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_claim_code ON deferred_claim_tokens(claim_code);
CREATE INDEX IF NOT EXISTS ix_claim_session ON deferred_claim_tokens(session_code);

-- Enable RLS (Row Level Security) on all new tables
ALTER TABLE blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE arx_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE arx_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deferred_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for backend)
CREATE POLICY "service_role_all" ON blockchain_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON arx_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON arx_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON deferred_claim_tokens FOR ALL USING (true) WITH CHECK (true);
