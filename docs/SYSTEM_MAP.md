# MAXIMOST SYSTEM MAP (V12.5)
# STATUS: PHASE 2 (TACTICAL LOADING)

## 1. DATABASE SCHEMA (Supabase/Postgres)
*   `auth.users`: Identity Root.
*   `public.profiles`:
    *   `role`: 'USER' | 'ROOT_ADMIN'
    *   `last_meal_at`: TIMESTAMP (For IF Timer)
    *   `fasting_target_hours`: INT (Default 16)
*   `public.habits`:
    *   `metadata`: JSONB (V12 Spec)
        *   `intel`: { `why`: string, `impact`: string }
        *   `tactical`: { `description`: string }
*   `public.foundry_batches`: Data Ingestion Logs.
*   `public.foundry_raw_data`: Raw JSON/CSV storage.
*   `public.mirror_logs`: Roast history.
*   `public.mirror_session_telemetry`:
    *   `recovery_score`: INT
    *   `governor_status`: TEXT

## 2. API ROUTES (The Iron Skeleton)
*   `POST /api/mirror/roast`: Accepts `{ excuse }`. Returns `{ roast, telemetry }`.
*   `GET /api/body/telemetry`: Returns `{ weight, sleep, hrv }` (Ghost Protocol active).
*   `GET /api/admin/system-settings`: Returns Global Config.

## 3. UI ROUTES (The Lens)
*   `/dashboard`: Main Command Center.
*   `/body-hud`: Bio-Telemetry Gauges.
*   `/mirror`: Accountability Mirror (Tactical Glass).
*   `/admin`: The War Room (Guarded: ROOT_ADMIN).
*   `/archive`: Historical Data.
