-- Migration 009: Intel Layer Fix (The Handshake)
-- Injecting Biological Why/Impact metadata for the Elite 5 Habits

-- 1. Cold Plunge (User Override)
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Norepinephrine Spike: 250%", "impact": "Alertness"}'::jsonb
)
WHERE title ILIKE '%Cold Plunge%';

UPDATE library_habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Norepinephrine Spike: 250%", "impact": "Alertness"}'::jsonb
)
WHERE title ILIKE '%Cold Plunge%';


-- 2. Intermittent Fasting (User Override)
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Autophagy Induction (Hour 16)", "impact": "Cellular Repair"}'::jsonb
)
WHERE title ILIKE '%Intermittent Fasting%';

UPDATE library_habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Autophagy Induction (Hour 16)", "impact": "Cellular Repair"}'::jsonb
)
WHERE title ILIKE '%Intermittent Fasting%';


-- 3. Zone 2 Cardio (Re-asserting 006 data for safety)
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Mitochondrial Density: Building the aerobic base.", "impact": "Lactate Clearance / Endurance"}'::jsonb
)
WHERE title ILIKE '%Zone 2 Cardio%';

UPDATE library_habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Mitochondrial Density: Building the aerobic base.", "impact": "Lactate Clearance / Endurance"}'::jsonb
)
WHERE title ILIKE '%Zone 2 Cardio%';


-- 4. Heavy Lifting (Re-asserting 006 data for safety)
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Hormonal Baseline: Maximizing CNS and bone density.", "impact": "Testosterone / Structural Integrity"}'::jsonb
)
WHERE title ILIKE '%Heavy Lifting%';

UPDATE library_habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Hormonal Baseline: Maximizing CNS and bone density.", "impact": "Testosterone / Structural Integrity"}'::jsonb
)
WHERE title ILIKE '%Heavy Lifting%';


-- 5. Sauna (Re-asserting 006 data for safety)
UPDATE habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Heat Shock Proteins: Mimics aerobic stress response.", "impact": "Cardiovascular Health / Recovery"}'::jsonb
)
WHERE title ILIKE '%Sauna%';

UPDATE library_habits
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{intel}',
    '{"why": "Heat Shock Proteins: Mimics aerobic stress response.", "impact": "Cardiovascular Health / Recovery"}'::jsonb
)
WHERE title ILIKE '%Sauna%';
