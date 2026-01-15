-- Migration 022: Rebuttal Engine (The Savage & The Stoic)
-- Mapping habits to specific persona responses.

CREATE TABLE IF NOT EXISTS habit_rebuttals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_slug TEXT NOT NULL, -- e.g., 'zone-2-cardio', 'cold-plunge'
    persona TEXT NOT NULL, -- 'Goggins' or 'Stoic'
    trigger_type TEXT NOT NULL, -- 'missed', 'streak_broken', 'complaint'
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_slug, persona, trigger_type)
);

ALTER TABLE habit_rebuttals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Rebuttals" ON habit_rebuttals FOR SELECT USING (true);

-- Seed Data
INSERT INTO habit_rebuttals (habit_slug, persona, trigger_type, response_text) VALUES
('cold-plunge', 'Goggins', 'missed', 'You skipped the cold because you wanted warmth. That warmth is weakness leaving a stain on your soul. Get in the ice.'),
('cold-plunge', 'Stoic', 'missed', 'The cold is indifferent to your comfort. By avoiding it, you choose to be ruled by sensation rather than will.'),
('zone-2-cardio', 'Goggins', 'missed', 'Your heart is a muscle, and you are letting it atrophy. Do you want to be a statistic? Lace up.'),
('zone-2-cardio', 'Stoic', 'missed', 'The body requires movement to function according to its nature. To deny it is to deny your design.');
