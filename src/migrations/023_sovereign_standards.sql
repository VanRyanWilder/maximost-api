-- Migration 023: Sovereign Standards (Drift Detection)
-- Defining the "Gold Standard" for metrics to trigger alerts.

CREATE TABLE IF NOT EXISTS sovereign_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id TEXT NOT NULL UNIQUE, -- 'weight_lbs', 'deep_sleep_min', 'zone_2_min'
    min_value NUMERIC,
    max_value NUMERIC,
    unit TEXT NOT NULL,
    drift_tolerance_pct NUMERIC DEFAULT 5.0, -- % deviation allowed before alerting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sovereign_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Standards" ON sovereign_standards FOR SELECT USING (true);

-- Seed Data (Example Standards)
INSERT INTO sovereign_standards (metric_id, min_value, max_value, unit, drift_tolerance_pct) VALUES
('body_fat_pct', 8.0, 15.0, '%', 10.0), -- Example male athlete range
('deep_sleep_min', 60.0, NULL, 'min', 15.0),
('zone_2_min_weekly', 150.0, NULL, 'min', 10.0)
ON CONFLICT (metric_id) DO NOTHING;
