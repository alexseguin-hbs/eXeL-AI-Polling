-- 031_hi_settlement_stamp.sql
--
-- 웃 (HI) is minted currency-free: 웃 = hours × (9,999 ÷ 2,080) = hours × 4.807…
-- so one full-time year lands exactly on the annual ceiling for every natural
-- person, in every jurisdiction.
--
-- The local minimum wage is not removed — it is DEFERRED to settlement, and
-- frozen at mint by these two columns. Settlement must read the stamp, never
-- the holder's current location; that is what closes the cross-border spread
-- (0.34/hr Nigeria .. 16.28/hr Washington State = 47.9×).
--
-- Both columns are nullable so historical rows remain valid and readable. A
-- NULL stamp means "minted before release 35" and must be resolved by hand
-- before those entries settle — it must NOT silently fall back to a live rate.

ALTER TABLE token_ledger
  ADD COLUMN IF NOT EXISTS settlement_jurisdiction VARCHAR(80),
  ADD COLUMN IF NOT EXISTS settlement_rate DOUBLE PRECISION;

COMMENT ON COLUMN token_ledger.settlement_jurisdiction IS
  'Earner jurisdiction resolved at mint (e.g. "United States/Texas"). Frozen.';
COMMENT ON COLUMN token_ledger.settlement_rate IS
  'Local minimum wage per hour, resolved at mint. Settlement reads this, never a live lookup.';

CREATE INDEX IF NOT EXISTS ix_token_ledger_settlement
  ON token_ledger (settlement_jurisdiction)
  WHERE settlement_jurisdiction IS NOT NULL;
