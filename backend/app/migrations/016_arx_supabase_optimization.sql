-- Migration 016: Supabase optimization for Cube 12 ARX tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ppgfjplawtlrfqpnszyb/sql
-- Version: 2026.04.15
--
-- Fixes from 12 Ascended Masters SSSES audit:
--   Thor:  chip_key_hash index, unique constraints
--   Thoth: Serial # uniqueness, created_at index
--   Enlil: Delete protection policy

-- ═══ INDEXES (Thor: prevent full table scans on public endpoints) ═══

-- Chip address lookup (public verify endpoint — most critical)
CREATE INDEX IF NOT EXISTS ix_arx_items_chip_key_hash ON arx_items(chip_key_hash);

-- Marketplace listing (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS ix_arx_items_created_at_desc ON arx_items(created_at DESC);

-- ═══ UNIQUE CONSTRAINTS (Thoth: prevent duplicate registrations) ═══

-- Token ID must be unique — prevents collision from timestamp-based generation
CREATE UNIQUE INDEX IF NOT EXISTS ux_arx_items_token_id ON arx_items(token_id);

-- Serial number must be unique when present — same physical item cannot be registered twice
-- Uses partial index: only enforced when serial_number IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS ux_arx_items_serial_number
  ON arx_items(serial_number) WHERE serial_number IS NOT NULL;

-- Chip key hash must be unique when present — one chip per item, one item per chip
CREATE UNIQUE INDEX IF NOT EXISTS ux_arx_items_chip_key_hash
  ON arx_items(chip_key_hash) WHERE chip_key_hash IS NOT NULL;

-- ═══ DELETE PROTECTION (Enlil: registered items must NEVER be deleted) ═══

-- Prevent ANY deletion from arx_items — ownership chain must be permanent
CREATE OR REPLACE FUNCTION prevent_arx_item_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ARX items cannot be deleted — ownership records are permanent';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_delete_arx_items ON arx_items;
CREATE TRIGGER no_delete_arx_items
  BEFORE DELETE ON arx_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_arx_item_delete();

-- Prevent deletion of transaction history — provenance chain is immutable
CREATE OR REPLACE FUNCTION prevent_arx_tx_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ARX transactions cannot be deleted — provenance history is permanent';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_delete_arx_transactions ON arx_transactions;
CREATE TRIGGER no_delete_arx_transactions
  BEFORE DELETE ON arx_transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_arx_tx_delete();
