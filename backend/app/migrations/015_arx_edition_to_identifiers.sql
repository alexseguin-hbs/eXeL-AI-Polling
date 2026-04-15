-- Migration 015: Rename arx_items.edition (INTEGER) to identifiers (TEXT)
-- Supports free-text identifiers for unique items (no integer editions)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ppgfjplawtlrfqpnszyb/sql
-- Version: 2026.04.15

-- Step 1: Add new TEXT column
ALTER TABLE arx_items ADD COLUMN IF NOT EXISTS identifiers TEXT;

-- Step 2: Copy existing edition values as text
UPDATE arx_items SET identifiers = CASE
    WHEN edition IS NOT NULL AND edition > 0 THEN edition::TEXT
    ELSE NULL
END;

-- Step 3: Drop the old integer column
ALTER TABLE arx_items DROP COLUMN IF EXISTS edition;
