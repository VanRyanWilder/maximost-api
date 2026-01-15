-- Migration 016: Temporal Sync & Telemetry CRUD
-- 1. Add Timezone to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- 2. Telemetry CRUD Policies (Ensure Delete/Update is enabled)
-- We already enabled RLS and Owner Select/Insert in 011.
-- Adding Update/Delete policies for 'Glass Box' editing.

-- Heart Rate
CREATE POLICY "Owner Update HR" ON telemetry_heart_rate FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Delete HR" ON telemetry_heart_rate FOR DELETE USING (auth.uid() = user_id);

-- Steps
CREATE POLICY "Owner Update Steps" ON telemetry_steps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Delete Steps" ON telemetry_steps FOR DELETE USING (auth.uid() = user_id);

-- Sleep
CREATE POLICY "Owner Update Sleep" ON telemetry_sleep FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner Delete Sleep" ON telemetry_sleep FOR DELETE USING (auth.uid() = user_id);
