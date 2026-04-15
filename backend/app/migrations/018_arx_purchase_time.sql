-- Migration 018: Add purchase_time column to arx_items
-- Run in Supabase SQL Editor
-- Version: 2026.04.15

ALTER TABLE arx_items ADD COLUMN IF NOT EXISTS purchase_time TEXT;

-- Set the hardback purchase time
UPDATE arx_items SET purchase_time = '03:33 CST', identifiers = NULL WHERE token_id = 214274013;
