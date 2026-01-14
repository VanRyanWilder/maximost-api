(The Sovereign Developer Protocol)
This document is the mandatory Quality Assurance standard. No code merges to main without these checks.

1. The Persistence Rule

No task is "Done" until the feature survives a Hard Refresh (Ctrl+F5) on the live production site.

Developers must verify that data is committed to the database, not just held in local browser state.

2. The Table-to-Lens Audit

For every Archive or Library item, the developer must manually change a value in the Supabase Table Editor.

They must then confirm the frontend HUD reflects that specific change instantly to prove the "Sync" is live.

3. The Zero-Placeholder Standard

Hard-coded strings like "No description" or "No rationale" are prohibited.

If data is missing from the database, the API must fail gracefully or the Migration must be re-run to hydrate the metadata.

4. The Cache-Bust Requirement

Deployments involving metadata changes must include a version increment in the fetch header to bypass stale browser caches.