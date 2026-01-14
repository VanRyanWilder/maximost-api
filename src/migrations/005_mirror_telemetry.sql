-- PROTOCOL: MIRROR TELEMETRY (The Gauges)
-- DESCRIPTION: Stores the biometric state during a Mirror Session.

CREATE TABLE IF NOT EXISTS mirror_session_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES mirror_logs(id), -- Links to the specific roast

  -- LIMBIC REGULATOR (Recovery State)
  recovery_score INTEGER, -- 0-100 (From Terra/Whoop)
  limbic_friction_index INTEGER, -- Calculated: (100 - recovery_score)

  -- GOVERNOR STATUS (Consistency State)
  consistency_streak INTEGER, -- From Ledger
  governor_status TEXT, -- 'ACTIVE' (Drifting) or 'OFFLINE' (Locked In)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE mirror_session_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own telemetry" ON mirror_session_telemetry
  FOR SELECT USING (auth.uid() = user_id);
