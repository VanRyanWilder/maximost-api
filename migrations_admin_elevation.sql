-- Admin Elevation: Establish Root Identity
-- Promotes admin@maximost.com to Root Admin Architecture

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Find the User UUID by Email (Safe Lookup)
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@maximost.com';

    -- 2. If User Exists, Elevate Profile
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET
            role = 'admin',
            membership_tier = 'architect',
            updated_at = now()
        WHERE id = target_user_id;

        RAISE NOTICE 'Admin Elevation Complete for: %', target_user_id;
    ELSE
        RAISE NOTICE 'Target user admin@maximost.com not found. Elevation skipped pending sign-up.';
    END IF;
END $$;
