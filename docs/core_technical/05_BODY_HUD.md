(The Console Lens)
Objective: Standardizing the Mobile-First HUD, Navigation, and Mission Telemetry.

1. Mission Telemetry (The Top-Row Pips)
This is the "Primary Directive" of the Rig. It must be dynamic and responsive to the Operator's current focus.

Contextual Header:

Level 1: If a Protocol Stack is deployed, display "MISSION: [PROTOCOL_NAME]".

Level 2: If no Protocol is active, display "DAILY ROSTER".

The Pip Stack (Top 5):

The HUD renders exactly 5 pips based on the current dashboard order.

Sorting: The pips must reflect the top 5 habits in the user's display_order.

Visual State: Pips are circular progress rings using the habit's unique color hex code.

Completion State: Solid fill + Checkmark only when current_value >= target_value.

2. Slide-In HUD Architecture
Initialization/Edit: All habit interactions must happen via a right-side slide-in drawer.

Zero-G View: The background dashboard must remain fixed and blurred/darkened but visible to preserve context.

3. Persistent Navigation
Sidebar: Fixed width on desktop with red "Console Active" indicators for the current page.

Mobile Rail: On small screens, the sidebar must collapse into a minimal bottom rail to maximize vertical space for the "Starting 5" telemetry.