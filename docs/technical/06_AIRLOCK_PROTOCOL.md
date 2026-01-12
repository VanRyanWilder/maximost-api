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