🏗️ Phoenix Protocol Architecture
Objective: Backend Hardening & Data Integrity

The Phoenix Protocol represents a total re-initialization of the MAXIMOST backend to resolve build conflicts and establish a secure, scalable environment for biometric ingestion.

1. Environment & Core Standards
Strict CommonJS: Switched from Hybrid/ESM to resolve deployment conflicts and ensure predictable module loading.

Zod Validation: All core environment variables (ADMIN_EMAIL, SUPABASE_KEYS) are strictly validated at runtime to prevent "silent" failures.

Auth Middleware: Implemented an enriched user profile system (Role/Tier/Neural Config) that exposes a safe client to the frontend while using Service Role power for background operations.

2. The "Bio-Rig" & Airlock Integration
The backend is now architected to handle high-frequency data from the Terra API and bulk CSV imports.

BiometricData Interface: A decoupled interface that translates raw vendor data (Samsung, Apple, Terra) into the proprietary MAXIMOST schema.

Airlock Deployment: Protocols and habits are now hydrated with full v12 JSONB metadata during deployment, ensuring the "Identity" and "Tactical" DNA is never lost.

3. Telemetry & Security
RLS "Bio-Seals": Row Level Security is active on all habit and biometric tables. The system utilizes migrations_telemetry.sql to create secure views for the AI Orchestrator to consume without exposing raw personal data.

Static Brain: Implemented a deterministic rule engine (staticBrain.ts) to provide zero-cost, high-speed insights for standard users without requiring a full AI handshake.