-- PROTOCOL: THE FOUNDRY (Data Ingestion)
-- DESCRIPTION: Staging area for raw data before it is refined into user_metrics.

-- 1. THE BATCH LOG (Tracks the upload event)
CREATE TABLE IF NOT EXISTS foundry_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'apple_health', 'whoop_csv', 'strong_app_csv'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  record_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store filename, original size, upload date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 2. THE RAW ORE (Stores the unrefined lines/objects)
CREATE TABLE IF NOT EXISTS foundry_raw_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES foundry_batches(id) ON DELETE CASCADE,
  row_index INTEGER, -- Line number from CSV or index in JSON array
  raw_payload JSONB NOT NULL, -- The exact line/object from the source file
  error_log TEXT, -- If parsing fails, we write why here
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SECURITY (RLS)
ALTER TABLE foundry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundry_raw_data ENABLE ROW LEVEL SECURITY;

-- Users can only see their own batches
CREATE POLICY "Users view own batches" ON foundry_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users upload batches" ON foundry_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see raw data from their own batches
CREATE POLICY "Users view own raw data" ON foundry_raw_data
  FOR SELECT USING (
    batch_id IN (SELECT id FROM foundry_batches WHERE user_id = auth.uid())
  );

-- 4. INDEXES (Speed)
CREATE INDEX idx_foundry_batches_user ON foundry_batches(user_id);
CREATE INDEX idx_foundry_raw_batch ON foundry_raw_data(batch_id);
