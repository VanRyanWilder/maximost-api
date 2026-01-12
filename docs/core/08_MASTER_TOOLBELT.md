🎨 The Master Toolbelt
Objective: Standardizing the Visual & Metadata Handshake

To maintain the high-performance "Console" aesthetic, all UI components must adhere to these data mapping and styling rules.

1. The v12 Metadata Handshake
Developers must stop using the legacy description column. All habit rationale is now stored in the JSONB metadata object.

UI Field	Database Key	Context
Tactical (How)	metadata.tactical	Precise steps for execution.
Identity (Why)	metadata.identity	The "Identity Reason" or rationale.
Absolute/Freq	is_absolute	Boolean to determine if it's a "Check" or a "Counter".

2. Color Rendering Protocol
The "Blue UI" error occurs when components fail to fetch the color column.

Dynamic Hex Mapping: Vance must map the CSS border or icon color directly to the library_habits.color hex string (e.g., #DC2626 for Physical Training).

No Defaulting: If a hex code is present in the database, the UI must render it. Defaulting to blue is a failed hydration.

3. The Expert DNA Icons
Icons are not decorative; they are functional pips for the Operator.

Centenarian Pips: Habits belonging to the Attia stack must show the "Centenarian" tag and pull the expert motivation rationale from the metadata.identity field.

Starting 5: Icons tagged with is_starting_5 = true must be reflected in the 1% Dashboard Header.