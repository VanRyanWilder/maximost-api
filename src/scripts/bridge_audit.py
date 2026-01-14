# MaxiMost Neural Bridge Auditor (bridge_audit.py)
import os
import requests
from google import generativeai as genai

# CONFIGURATION
# Ensure these environment variables are set before running the script
GITHUB_PAT = os.getenv('GITHUB_PAT') # Your Private GitHub Key
GEMINI_KEY = os.getenv('MASTER_ARCHITECT_KEY') # Your New Master Architect Key
REPOS = ["VanRyanWilder/maximost-frontend", "VanRyanWilder/maximost-api"]

# Initialize Gemini
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    print("WARNING: MASTER_ARCHITECT_KEY not set. Neural Audit will fail.")
    model = None

def fetch_repo_content(repo_name):
    # This function pulls the core Skeleton and Lens files via GitHub API
    # Cyrus: Focus on /src/routes/aiRoutes.ts and supabase/migrations/*.sql

    if not GITHUB_PAT:
        print(f"Skipping {repo_name}: GITHUB_PAT missing. Ensure .env is loaded.")
        return ""

    headers = {
        "Authorization": f"token {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }

    print(f"Fetching Surgical Payload for {repo_name}...")

    # Surgical Payload: Prioritize AI Routes and Migrations
    # In a real implementation, we would list specific files:
    # 1. src/routes/aiRoutes.ts
    # 2. supabase/migrations/*.sql
    # 3. shared/types/v12_spec.ts (if exists)

    # Mock return reflecting the prioritized payload
    payload = f"\n[Surgical Payload for {repo_name}]\n"
    payload += "Files Targeted:\n"
    payload += "- src/routes/aiRoutes.ts\n"
    payload += "- supabase/migrations/*.sql (Last 5)\n"
    payload += "- shared/types/v12_spec.ts\n"

    return payload

def run_neural_audit():
    if not model:
        print("Neural Audit aborted: Missing Gemini Key.")
        return

    context = ""
    for repo in REPOS:
        context += f"\n--- REPO: {repo} ---\n"
        context += fetch_repo_content(repo)

    prompt = "SYSTEM: You are the MaxiMost Master Architect. Perform a Neural Bridge Audit. Find every mismatch between the API endpoints and the Frontend calls. Check v12 Metadata keys."

    try:
        response = model.generate_content([prompt, context])
        print("\n--- NEURAL AUDIT REPORT ---")
        print(response.text)
    except Exception as e:
        print(f"Audit Error: {e}")

if __name__ == "__main__":
    run_neural_audit()
