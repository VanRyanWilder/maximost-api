-- 1. UPGRADE HABITS FOR INTEL LAYER
-- Ensure metadata is JSONB (This is likely already true, but good practice for migration scripts)
-- ALTER TABLE habits ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;

-- Seed "Elite 5" Content

-- Intermittent Fasting
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Metabolic Switch: Autophagy triggers at hour 16.", "impact": "Cellular Repair / Insulin Sensitivity"}'::jsonb
)
WHERE title ILIKE '%Intermittent Fasting%';

-- Cold Plunge
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Norepinephrine Spike: 250% increase in baseline focus.", "impact": "Dopamine / Stress Resilience"}'::jsonb
)
WHERE title ILIKE '%Cold Plunge%';

-- Zone 2 Cardio
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Mitochondrial Density: Building the aerobic base.", "impact": "Lactate Clearance / Endurance"}'::jsonb
)
WHERE title ILIKE '%Zone 2 Cardio%';

-- Heavy Lifting
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Hormonal Baseline: Maximizing CNS and bone density.", "impact": "Testosterone / Structural Integrity"}'::jsonb
)
WHERE title ILIKE '%Heavy Lifting%';

-- Sauna
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Heat Shock Proteins: Mimics aerobic stress response.", "impact": "Cardiovascular Health / Recovery"}'::jsonb
)
WHERE title ILIKE '%Sauna%';


-- 2. IF TIMER PERSISTENCE
-- Add last_meal_at to the profiles table for the Fasting Timer
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_meal_at TIMESTAMP WITH TIME ZONE;

-- 3. FASTING CONFIG
-- Store target hours (e.g., 16, 18, 24)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fasting_target_hours INTEGER DEFAULT 16;
