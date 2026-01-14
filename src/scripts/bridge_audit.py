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
    # Cyrus: Focus on /src/api, /src/routes, and /shared/types

    if not GITHUB_PAT:
        print(f"Skipping {repo_name}: GITHUB_PAT missing.")
        return ""

    headers = {
        "Authorization": f"token {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }

    # Placeholder logic for fetching tree/files
    # In a real scenario, we'd recursively fetch or get specific paths
    print(f"Fetching content for {repo_name}...")

    # Mock return for auditing purposes if we can't really call GitHub
    return f"\n[Mock Content for {repo_name}]\n(Files scanned: src/api/*, src/routes/*)\n"

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
