-- Migration 017: Habit Color Stacks (Intensity & Recovery)
-- Assigning specific color logic for the Elite habits to ensure UI pop.

-- Red (Intensity)
UPDATE library_habits SET color = '#EF4444' WHERE slug IN ('heavy-lifting', 'zone-2-cardio', 'cold-plunge');

-- Green (Recovery)
UPDATE library_habits SET color = '#10B981' WHERE slug IN ('sauna', 'intermittent-fasting', 'meditation', 'sleep-protocol');

-- Ensure User Habits inherit these colors if they haven't been customized
-- This is a one-time sync for existing users who might have the default blue.
UPDATE habits h
SET color = lh.color
FROM library_habits lh
WHERE h.slug = lh.slug
AND h.color != lh.color
AND (h.color IS NULL OR h.color = '#3B82F6'); -- Only overwrite default blue or null
