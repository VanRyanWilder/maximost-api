-- Migration 015: Lexicon 6x6 Matrix (The 36 Atoms)
-- Restoring the full Proprietary Meta-Logic for the Master Toolbelt

-- 1. Biological Rig (Bio)
INSERT INTO word_bank (term, definition, category) VALUES
('Limbic Friction', 'The neurological resistance required to overcome the initial impulse of comfort. The cost of entry for growth.', 'bio'),
('Metabolic Flexibility', 'The ability of the body to seamlessly switch between burning glucose and ketones for fuel.', 'bio'),
('Zone 2 Protocol', 'Sustained aerobic output at 60-70% MHR to maximize mitochondrial density and lactate clearance.', 'bio'),
('Norepinephrine Shock', 'Acute cold exposure triggering a 250% increase in focus and anti-inflammatory response.', 'bio'),
('Circadian Anchor', 'Using sunlight and timing to lock the biological clock, optimizing sleep pressure and wakefulness.', 'bio'),
('Hormetic Stress', 'Controlled, acute stressors (heat, cold, fast) that trigger adaptive cellular resilience.', 'bio')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'bio';

-- 2. Cognitive Architecture (Mind)
INSERT INTO word_bank (term, definition, category) VALUES
('40% Rule', 'When your mind tells you you are done, you are only 40% done. A psychological barrier, not physiological.', 'mind'),
('The Governor', 'The internal safety mechanism of the brain that limits performance to preserve energy. It must be overridden.', 'mind'),
('Dopamine Baseline', 'The resting level of motivation. Controlled by avoiding cheap spikes and embracing effort.', 'mind'),
('Callus Your Mind', 'Repeated exposure to discomfort to build psychological armor against future adversity.', 'mind'),
('Cookie Jar', 'A mental repository of past victories used to fuel resilience during dark moments.', 'mind'),
('Visualization', 'Tactical mental rehearsal of both success and potential failure points to prepare the nervous system.', 'mind')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'mind';

-- 3. Operational Cadence (Flow)
INSERT INTO word_bank (term, definition, category) VALUES
('The Rig', 'The non-negotiable daily sequence that automates high performance and eliminates decision fatigue.', 'flow'),
('Time Boxing', 'Allocating strict, immutable blocks of time for specific objectives to force efficiency.', 'flow'),
('Deep Work', 'Distraction-free concentration that pushes cognitive capabilities to their limit.', 'flow'),
('Task Triage', 'The ruthless prioritization of objectives. Eliminate, Automate, Delegate, or Execute.', 'flow'),
('Feedback Loop', 'The cycle of Action -> Measurement -> Adjustment. The core of rapid iteration.', 'flow'),
('Momentum Stacking', 'Leveraging small, early wins to build kinetic energy for larger, harder tasks.', 'flow')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'flow';

-- 4. Environmental Shield (Space)
INSERT INTO word_bank (term, definition, category) VALUES
('Friction Design', 'Optimizing the environment to increase friction for bad habits and reduce it for good ones.', 'space'),
('Digital Airgap', 'Physically separating oneself from network connectivity to ensure absolute focus.', 'space'),
('The Dojo', 'A dedicated physical space anchored solely to work and creation. No leisure allowed.', 'space'),
('Visual Cues', 'Strategic placement of triggers (gear, notes) to prompt desired behaviors automatically.', 'space'),
('Noise Discipline', 'The elimination of auditory and informational clutter to preserve cognitive bandwidth.', 'space'),
('Minimalist Reset', 'The periodic purging of physical possessions to reduce mental load and decision fatigue.', 'space')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'space';

-- 5. Social Dynamics (Network)
INSERT INTO word_bank (term, definition, category) VALUES
('The Council', 'A curated circle of peers who hold you to a standard higher than you hold yourself.', 'network'),
('Radical Candor', 'The obligation to speak the truth directly, without the softening filter of politeness.', 'network'),
('Status Games', 'The civilian pursuit of validation and rank. The Operator rejects this for internal scorecards.', 'network'),
('Value Exchange', 'Relationships defined by mutual elevation and tactical support, not just shared history.', 'network'),
('The Standard', 'The minimum acceptable level of performance. You become the average of your network.', 'network'),
('Mission Alignment', 'Ensuring those closest to you understand and support the strategic objective.', 'network')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'network';

-- 6. Legacy Projection (Future)
INSERT INTO word_bank (term, definition, category) VALUES
('Sovereignty', 'Total ownership of one''s physical, mental, and digital state. The rejection of external dependencies.', 'future'),
('The Archive', 'The immutable record of actions taken. Your legacy is data, not intent.', 'future'),
('Infinite Game', 'Playing for the sustainability of the effort, not just the winning of a single quarter.', 'future'),
('Anti-Fragile', 'Systems and mindsets that get stronger, not just survive, under chaos and stress.', 'future'),
('Second Mountain', 'The shift from self-aggrandizement (career) to contribution and legacy building.', 'future'),
('Memento Mori', 'Remember death. The ultimate deadline that gives urgency and meaning to the present.', 'future')
ON CONFLICT (term) DO UPDATE SET definition = EXCLUDED.definition, category = 'future';
