🛰️ The Airlock Protocol
Objective: High-Fidelity Data Ingestion & Mapping Memory

1. The Handshake (First-Time Import)
When the Operator (Josh) imports a CSV from Loop or Samsung, the system must present a mapping interface:

User Option: "Sync" or "Don't Sync" for every incoming field.

Mapping: User must link external keys (e.g., "Mindfulness_Duration") to internal slugs (e.g., shadow_audit).

2. The Memory Table
Cyrus to implement user_data_mapping to save these choices.

Fields: user_id, source_name, external_slug, internal_slug.

Result: Future imports are zero-friction and 100% automated.

3. The Trust Hierarchy
If data conflicts arise (e.g., Samsung steps vs. Oura steps), follow the Source Trust Manifest:

Manual User Entry (Absolute Truth - Locks the record).

Primary Hardware (e.g., Apple Watch for Runs).

Secondary Service (e.g., Terra API/Samsung).

The Triple-Gate System

This defines how we handle AI, Data, and External API costs without sacrificing the user experience.

Airlock 1: AI Coach (Compute Gate)
Access: All authenticated users can access the AI Coach interface.

Logic: The LLM will only process new "Messages" if the account is authorized (Admin) or has active tokens.

Neural Standby: Non-authorized users can still view their existing Neural Archive (Memory Bricks) locally, but the AI remains in "Standby".

Airlock 2: Supabase (Security Gate)
RLS Mastery: Every table (habits, logs, memories) must have FOR ALL Row-Level Security policies set to auth.uid() = user_id.

Validation: Every "Save" must pass a Zod schema validation on the backend before the "Skeleton" accepts the data.

Airlock 3: Terra/Manual (Cost Gate)
Manual-First: To keep costs low, the Rig prioritizes manual data entry and CSV "Infiltration" over live API streams.

Infiltration Module: Users are presented with a checklist/flag HUD after a successful import to verify data before it enters the Master Ledger.