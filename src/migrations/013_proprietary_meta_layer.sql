-- Migration 013: Proprietary Meta-Layer (Elite 5)
-- Injecting Sovereign definitions and SEO tags for the Core Habits

-- 1. Word Bank (The Hover Definitions)
-- "When a user hovers over a habit... pull the proprietary definition"

INSERT INTO word_bank (term, definition, category)
VALUES
(
    'Zone 2 Cardio',
    'Mitochondrial Efficiency Protocol. Sustained aerobic output at 60-70% MHR to maximize fat oxidation and lactate clearance.',
    'biological'
),
(
    'Cold Plunge',
    'Norepinephrine Deployment System. Acute thermal shock to trigger systemic inflammation reduction and dopamine baseline reset.',
    'biological'
),
(
    'Intermittent Fasting',
    'Metabolic Autophagy Trigger. Restricted feeding window (16h+) to induce cellular repair and insulin sensitivity.',
    'biological'
),
(
    'Heavy Lifting',
    'Structural Integrity Reinforcement. High-load mechanical tension to drive CNS adaptation and bone density.',
    'biological'
),
(
    'Sauna',
    'Heat Shock Adaptation. Cardiovascular mimetic stress to enhance vascular elasticity and toxin excretion.',
    'biological'
)
ON CONFLICT (term) DO UPDATE
SET definition = EXCLUDED.definition;


-- 2. SEO Metadata (The Hard-Wired Headers)
-- Assuming frontend routes follow /habits/[slug] pattern

INSERT INTO seo_metadata (route_path, title, description, keywords)
VALUES
(
    '/habits/zone-2-cardio',
    'Zone 2 Protocol | MAXIMOST',
    'The foundation of the aerobic engine. Optimize mitochondria.',
    ARRAY['cardio', 'endurance', 'mitochondria', 'zone 2', 'health']
),
(
    '/habits/cold-plunge',
    'Cold Plunge Protocol | MAXIMOST',
    'Embrace the shock. Reset the system.',
    ARRAY['cold plunge', 'ice bath', 'norepinephrine', 'recovery', 'mental toughness']
),
(
    '/habits/intermittent-fasting',
    'Fasting Protocol | MAXIMOST',
    'Discipline the hunger. Heal the cell.',
    ARRAY['fasting', 'autophagy', 'health', 'weight loss', 'metabolism']
),
(
    '/habits/heavy-lifting',
    'Strength Protocol | MAXIMOST',
    'Bear the load. Forge the frame.',
    ARRAY['lifting', 'strength', 'muscle', 'bone density', 'fitness']
),
(
    '/habits/sauna',
    'Heat Protocol | MAXIMOST',
    'Sweat the weakness. Adapt to heat.',
    ARRAY['sauna', 'heat shock', 'recovery', 'cardio', 'health']
)
ON CONFLICT (route_path) DO NOTHING;
