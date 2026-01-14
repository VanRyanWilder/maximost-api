# API HANDSHAKE: IRON SKELETON (V12.5)
# STATUS: READY FOR FRONTEND INTEGRATION

## 1. Proprietary Meta-Layer (SEO & Lexicon)
*   **Word Bank (Tooltips):**
    *   `GET /api/public/lexicon` -> Returns array of `{ term, definition, category }`.
    *   **Usage:** Frontend `HabitCard.tsx` should call this to populate hover tooltips for terms like "Limbic Friction" or "Zone 2 Protocol".
*   **SEO Meta-Management:**
    *   `GET /api/public/seo?path=/some/path` -> Returns `{ title, description, keywords }`.
    *   **Usage:** Frontend router should fetch this to dynamically update `<head>` tags for "Elite 5" pages.

## 2. The Vault (Samsung Health Ingestion)
*   **Ingestion Route:**
    *   `POST /api/import/samsung`
    *   **Payload:** JSON body (or file upload) containing the Samsung Health export structure (`com.samsung.shealth...`).
    *   **Behavior:** Parses Steps, Sleep, and HR data and inserts into `telemetry_*` tables.
*   **Telemetry Retrieval:**
    *   `GET /api/body/telemetry` -> Returns `{ weight, sleep, calories, hrv, steps }`.
    *   **Logic:** Attempts to read real data from the ingested tables. Falls back to "Ghost Protocol" (safe defaults) if data is missing to prevent UI crashes.

## 3. The Mirror (Unfiltered V2.2)
*   **Route:** `POST /api/mirror/roast`
*   **Persona:** Hardcoded "Unfiltered Goggins v2.2". Temperature `0.85`.
*   **Logic:** Includes "Savage Filter" intercept to block civilian terminology ("Journaling") before calling AI.

## 4. Master Toolbelt (Admin Only)
*   **Management Routes:**
    *   `GET/POST /api/admin/seo` -> Manage SEO tags.
    *   `POST /api/admin/lexicon` -> Add new proprietary terms.
    *   `GET /api/admin/toolbelt` -> Returns tool status.
*   **Access:** Restricted to `role = 'admin'` or `ROOT_ADMIN`.

## 5. Security & Persistence
*   **RLS:** `archive` and `telemetry_*` tables allow Owner-Write access (`auth.uid() = user_id`), confirming the Vault is fully de-restricted for user sync.
*   **Public Access:** `/lexicon` and `/seo` use `ANON_KEY` to respect RLS policies (Public Read).
