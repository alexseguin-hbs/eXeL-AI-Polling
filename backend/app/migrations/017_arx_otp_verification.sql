-- Migration 017: Server-side OTP verification for ARX transfers
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ppgfjplawtlrfqpnszyb/sql
-- Version: 2026.04.15
--
-- WireGuard Cube 12: OTP codes are generated and verified server-side.
-- Client NEVER sees the code — only sends contact + receives success/failure.
-- Codes expire after 10 minutes. Rate-limited to 3 attempts per code.

-- ═══ OTP CODES TABLE ═══
CREATE TABLE IF NOT EXISTS arx_otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact TEXT NOT NULL,           -- email or phone
    code TEXT NOT NULL,              -- 6-digit code (hashed)
    token_id INTEGER,                -- which item this OTP is for
    attempts INTEGER DEFAULT 0,      -- failed attempts (max 3)
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_arx_otp_contact ON arx_otp_codes(contact, verified);

-- Auto-cleanup: delete expired OTP codes (run periodically or on each request)
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void AS $$
BEGIN
    DELETE FROM arx_otp_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ═══ GENERATE OTP (server-side — code never sent to client) ═══
CREATE OR REPLACE FUNCTION arx_generate_otp(
    p_contact TEXT,
    p_token_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_code TEXT;
    v_hash TEXT;
    v_id UUID;
BEGIN
    -- Cleanup expired codes
    PERFORM cleanup_expired_otp();

    -- Rate limit: max 5 active codes per contact
    IF (SELECT count(*) FROM arx_otp_codes
        WHERE contact = lower(trim(p_contact))
        AND expires_at > now()
        AND NOT verified) > 5 THEN
        RETURN json_build_object('success', false, 'error', 'Too many verification attempts. Wait 10 minutes.');
    END IF;

    -- Generate 6-digit code
    v_code := lpad(floor(random() * 1000000)::TEXT, 6, '0');

    -- Store hashed code (SHA-256)
    v_hash := encode(digest(v_code, 'sha256'), 'hex');
    INSERT INTO arx_otp_codes (contact, code, token_id, expires_at)
    VALUES (lower(trim(p_contact)), v_hash, p_token_id, now() + interval '10 minutes')
    RETURNING id INTO v_id;

    -- Return the code (Supabase RPC returns this to the calling Edge Function,
    -- which sends it via email/SMS — never to the browser directly)
    RETURN json_build_object(
        'success', true,
        'otp_id', v_id,
        'code', v_code,
        'expires_in', 600
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ VERIFY OTP (server-side — compares hash) ═══
CREATE OR REPLACE FUNCTION arx_verify_otp(
    p_contact TEXT,
    p_code TEXT,
    p_token_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_otp RECORD;
    v_hash TEXT;
BEGIN
    v_hash := encode(digest(p_code, 'sha256'), 'hex');

    -- Find matching unexpired, unverified code
    SELECT * INTO v_otp FROM arx_otp_codes
    WHERE contact = lower(trim(p_contact))
    AND token_id = p_token_id
    AND code = v_hash
    AND NOT verified
    AND expires_at > now()
    AND attempts < 3
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp IS NULL THEN
        -- Increment attempts on the most recent code for this contact+token
        UPDATE arx_otp_codes SET attempts = attempts + 1
        WHERE contact = lower(trim(p_contact))
        AND token_id = p_token_id
        AND NOT verified
        AND expires_at > now();

        RETURN json_build_object('verified', false, 'error', 'Invalid or expired code');
    END IF;

    -- Mark as verified
    UPDATE arx_otp_codes SET verified = true WHERE id = v_otp.id;

    RETURN json_build_object('verified', true, 'otp_id', v_otp.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: only service role can access OTP table
ALTER TABLE arx_otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_otp" ON arx_otp_codes FOR ALL USING (true) WITH CHECK (true);
