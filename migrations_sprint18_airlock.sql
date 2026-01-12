-- Sprint 18: Airlock & Privacy Paradox

-- 1. Metadata Hardening (Library Habits)
-- Ensure we have the JSONB column for the new v12 schema (Compiler/Visuals)
ALTER TABLE library_habits
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Encryption Bridge (Journal Entries)
-- Preparing for Zero-Knowledge Architecture
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS encrypted_blob TEXT,
ADD COLUMN IF NOT EXISTS iv TEXT; -- Initialization Vector for AES-GCM

-- 3. Biometric Normalization (Optional prep)
-- If we store normalized data, we might need a table, but usually we map to 'habit_logs'.
-- 'habit_logs' already exists. We will use that.
