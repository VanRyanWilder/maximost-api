-- Migration: Scholarship Redemption RPC
-- Atomic Transaction for Scholarship Redemption

CREATE OR REPLACE FUNCTION redeem_scholarship(
    p_code TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
    v_scholarship_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Lock and Check Scholarship
    SELECT id, expires_at INTO v_scholarship_id, v_expires_at
    FROM scholarships
    WHERE code = p_code
      AND is_redeemed = false
    FOR UPDATE; -- Lock row to prevent race conditions

    IF v_scholarship_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or already redeemed code');
    END IF;

    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Code expired');
    END IF;

    -- 2. Mark as Redeemed
    UPDATE scholarships
    SET is_redeemed = true,
        redeemed_by = p_user_id,
        expires_at = NOW() -- Burn immediately
    WHERE id = v_scholarship_id;

    -- 3. Update User Profile
    v_new_expiry := NOW() + INTERVAL '1 year';

    UPDATE profiles
    SET membership_tier = 'operator',
        membership_expires_at = v_new_expiry
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Scholarship redeemed successfully',
        'tier', 'operator',
        'expires_at', v_new_expiry
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
