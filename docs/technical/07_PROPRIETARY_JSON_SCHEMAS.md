🧬 Proprietary Data Schemas
Objective: The "Airlock" Intelligence & Mapping Memory

To move beyond generic data syncing, we utilize a custom JSONB structure that allows the Rig to "learn" the Operator's preferences.

1. The Mapping Memory (Airlock Intelligence)
This JSONB object, stored in the user_data_mapping table, ensures you only have to map an external field once.

{
  "source": "Samsung_Health_CSV",
  "mappings": [
    {
      "external_key": "Mindfulness_Minutes",
      "target_slug": "shadow_audit",
      "transformation": "duration_to_minutes",
      "user_confirmed": true
    },
    {
      "external_key": "Step_Count",
      "target_slug": "daily_steps",
      "transformation": "absolute_value",
      "user_confirmed": true
    }
  ],
  "ignored_keys": ["Calories_Burned", "Sleep_Score_Generic"]
}

Transformation: Logic that converts raw data (e.g., seconds) into your preferred unit (e.g., minutes).

Ignored Keys: Prevents the "Body HUD" from being cluttered with data you don't care about.

2. The Source Trust Manifest
This defines the "Chain of Command" for data. If two devices report the same habit, the system follows this ranking.

Priority	Source Type	Rule
Rank 1	Manual Operator Entry	The Absolute Truth. Once a log is manually entered or "Challenged," it is locked and cannot be overwritten by any API.
Rank 2	Primary Hardware	Direct device logs (e.g., Oura for Sleep, Garmin for Runs).
Rank 3	Secondary Aggregators	Terra API, Samsung Health, or Loop CSV imports.

3. The Challenge Log (Self-Healing System)
When you "Contest" a data point (e.g., Samsung says 50k steps while you were at your desk), the system logs it here to improve future filters.

{
  "log_id": "step_count_2026_01_12",
  "original_value": 50000,
  "corrected_value": 4000,
  "operator_note": "Phone was on vibrating surface/lawnmower",
  "system_action": "Down-rank Samsung_Steps trust_score for 24h"
}