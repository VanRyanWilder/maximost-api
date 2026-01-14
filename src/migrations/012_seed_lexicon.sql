-- Migration 012: Seed Lexicon (The Word Bank)
-- Populating the proprietary vocabulary for dynamic frontend tooltips

-- 1. The 40% Rule
INSERT INTO word_bank (term, definition, category)
VALUES (
    '40% Rule',
    'When your mind tells you you''re done, you''re only 40% done. It is a psychological barrier, not a physiological one.',
    'tactical'
) ON CONFLICT (term) DO NOTHING;

-- 2. Limbic Friction
INSERT INTO word_bank (term, definition, category)
VALUES (
    'Limbic Friction',
    'The neurological resistance required to overcome the initial impulse of comfort or inaction. It is the cost of entry for growth.',
    'biological'
) ON CONFLICT (term) DO NOTHING;

-- 3. Zone 2 Protocol
INSERT INTO word_bank (term, definition, category)
VALUES (
    'Zone 2 Protocol',
    'Sustained aerobic output at 60-70% of max heart rate. Optimizes mitochondrial density and fat oxidation without accumulating significant lactate.',
    'biological'
) ON CONFLICT (term) DO NOTHING;

-- 4. Sovereign
INSERT INTO word_bank (term, definition, category)
VALUES (
    'Sovereign',
    'Total ownership of one''s physical, mental, and digital state. The rejection of external dependencies for validation or control.',
    'philosophy'
) ON CONFLICT (term) DO NOTHING;
