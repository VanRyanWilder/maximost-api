INSERT INTO system_configs (key, value) VALUES
('lexicon_full', '{
  "dash_protocol": {
    "title": "The D.A.S.H. Protocol",
    "subtitle": "The Hierarchy of Execution",
    "description": "We don''t just \"do things.\" We execute through the D.A.S.H. layers, moving from the macro to the microscopic.",
    "layers": {
      "D": "Day: The primary temporal window of engagement.",
      "A": "Atom: The smallest possible unit of action (e.g., \"Put on your shoes\").",
      "S": "Step: The immediate physical movement required to initiate momentum.",
      "H": "Habit: The permanent \"firmware\" of your identity once a task becomes automatic."
    },
    "slogan": "One DASH at a time."
  },
  "word_replacement": {
    "title": "Word Replacement Protocol",
    "subtitle": "The \"Savage\" Filter",
    "description": "The system explicitly kills \"soft\" terminology in favor of \"tactical\" language to harden the user''s psychology.",
    "mappings": [
      { "soft": "Journaling", "tactical": "AAR (After-Action Report)", "context": "Performance audit, not feelings." },
      { "soft": "Habit Tracker", "tactical": "Tactical Protocol", "context": "Biological operating procedure." },
      { "soft": "To-Do List", "tactical": "Mission Orders", "context": "Strategic, non-negotiable objectives." },
      { "soft": "Routine", "tactical": "The Rig", "context": "The mechanical structure of your day." },
      { "soft": "Goals", "tactical": "Objectives", "context": "Specific tactical targets." },
      { "soft": "Failed", "tactical": "Data Point", "context": "Analyze and adjust; no room for shame." },
      { "soft": "Motivation", "tactical": "Momentum / Discipline", "context": "Physical state vs. fleeting emotion." },
      { "soft": "Preferences", "tactical": "Neural Bridge Config", "context": "System-level configuration." }
    ]
  },
  "core_metrics": {
    "title": "Core Metrics & Metaphors",
    "items": [
      { "term": "The Willpower Battery", "definition": "Our core metaphor; willpower is a finite resource that drains like a battery. The OS exists to automate your life so you don''t waste \"juice\" on trivial decisions." },
      { "term": "The Force Indicator", "definition": "A visual dashboard metric that tracks total daily momentum (Force = Mass x Acceleration). It measures output across Kinetic, Creation, and Restoration." },
      { "term": "The Iron Mind Metric", "definition": "A \"Stress Score\" tracking how many times you chose the \"Hard Path\" over the path of least resistance." },
      { "term": "Taking Souls", "definition": "A status indicator triggered when exceeding a target goal by a significant margin (e.g., 200% completion)." }
    ]
  },
  "infrastructure": {
    "title": "System Infrastructure",
    "subtitle": "The Map",
    "items": [
      { "term": "The Dash", "definition": "The primary Command Dashboard designed for \"at-a-glance\" situational awareness." },
      { "term": "The Ledger", "definition": "The consolidated historical record merging the Journal (AARs) and Progress (Charts) into one timeline." },
      { "term": "The Vault", "definition": "Encrypted storage for Neural Archives and Telemetry Uplinks (Whoop/Oura); the \"engine room\"." },
      { "term": "The Archive", "definition": "The \"Armory\" containing all Habit Atoms and Protocol Molecules (Stacks)." },
      { "term": "The Ghost Protocol", "definition": "Backend fail-safe logic that returns safe \"Zero\" values if external APIs fail to sync." }
    ]
  },
  "categories": {
    "title": "The Category Spectrum",
    "items": [
      { "term": "Kinetic", "color": "Emerald", "definition": "Physical/biological movement habits (e.g., Cold Plunge, Lifting)." },
      { "term": "Creation", "color": "Violet", "definition": "Deep work and building habits (e.g., Coding, Writing)." },
      { "term": "Restoration", "color": "Amber", "definition": "Recovery, sleep, and mental maintenance (e.g., IF, Sauna)." }
    ]
  }
}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
