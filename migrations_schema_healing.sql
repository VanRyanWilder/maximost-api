-- Schema Healing: Hydrate the Lens
-- Adding color and metadata to ensure UI consistency
-- Restoring Iron Skeleton Integrity (ID Restoration)

-- 1. Library Habits (The Atoms)
-- A. ID Restoration & Primary Key Logic
-- Ensure ID column exists
ALTER TABLE public.library_habits ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Backfill UUIDs for any null entries (Safety Net)
UPDATE public.library_habits SET id = gen_random_uuid() WHERE id IS NULL;

-- Demote Slug if it was PK (Handshake) and Promote ID
DO $$
BEGIN
    -- Check if PK is NOT on 'id'
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'library_habits'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name != 'id'
    ) THEN
        -- Drop existing PK
        EXECUTE 'ALTER TABLE public.library_habits DROP CONSTRAINT ' || (
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_name = 'library_habits' AND constraint_type = 'PRIMARY KEY' LIMIT 1
        );
        -- Add PK on ID
        ALTER TABLE public.library_habits ADD PRIMARY KEY (id);
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'library_habits' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- No PK exists, add it on ID
        ALTER TABLE public.library_habits ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Ensure Slug is Unique (Secondary Identifier)
ALTER TABLE public.library_habits ADD CONSTRAINT library_habits_slug_key UNIQUE (slug);


-- B. Visuals & Metadata
-- Adding explicit color column for high-performance CSS mapping
ALTER TABLE public.library_habits ADD COLUMN IF NOT EXISTS color TEXT;
-- Ensure metadata exists (v12 requirement)
ALTER TABLE public.library_habits ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- C. Legacy DNA Sync (The Final Inch)
-- If metadata is empty, try to backfill from legacy instruction columns
UPDATE public.library_habits
SET metadata = jsonb_set(
    jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{tactical}',
        to_jsonb(coalesce(how_instruction, 'Execute protocol.'))
    ),
    '{identity}',
    to_jsonb(coalesce(why_instruction, description, 'Forge your sovereign path.'))
)
WHERE (metadata IS NULL OR metadata = '{}'::jsonb)
AND (how_instruction IS NOT NULL OR why_instruction IS NOT NULL OR description IS NOT NULL);

-- 2. User Habits (The Active Rig)
-- Adding color and metadata to support "Blank Motivation" fix and UI theming
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
