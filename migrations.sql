-- Migration to optimize Context Orchestrator queries

-- Index 1: Optimize fetching habit logs by user and completion date
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_completed
ON habit_logs (user_id, completed_at);

-- Index 2: Optimize fetching journal entries by user and creation date
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created
ON journal_entries (user_id, created_at);

-- Index 3: Optimize fetching habits by user
CREATE INDEX IF NOT EXISTS idx_habits_user
ON habits (user_id);
