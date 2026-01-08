import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const ARCHIVE_DATA = {
  "archive_version": "6.0",
  "library_habits": [
    {"slug": "morning_sun", "title": "Morning Sun", "theme": "bio_emerald", "icon": "Sun", "category": "bio_rig", "type": "absolute", "target_value": 15, "unit": "minutes", "description": "Anchor your circadian clock with outdoor light.", "how_instruction": "THE ATOM: Photon Anchoring. THE STEP: View outdoor light within 30m of waking. No sunglasses.", "why_instruction": "Resets the central clock (SCN), triggers morning cortisol, and sets the sleep timer. [Panda]"},
    {"slug": "fasting", "title": "Intermittent Fasting", "theme": "asset_lime", "icon": "Timer", "category": "bio_rig", "type": "frequency", "target_value": 16, "unit": "hours", "description": "Trigger cellular repair and stabilize energy.", "how_instruction": "THE ATOM: Metabolic Switching. THE STEP: 16-hour fast. Water and black coffee only.", "why_instruction": "Triggers autophagy (cellular cleaning) and stabilizes insulin sensitivity. [Attia]"},
    {"slug": "sauna", "title": "Sauna / Heat", "theme": "combat_red", "icon": "Flame", "category": "bio_rig", "type": "frequency", "target_value": 20, "unit": "minutes", "description": "Use heat stress to protect the brain and heart.", "how_instruction": "THE ATOM: Hormetic Heat. THE STEP: Dry sauna at 174°F minimum. No mid-session water.", "why_instruction": "Activates Heat Shock Proteins (HSP) to prevent protein misfolding. [Patrick]"},
    {"slug": "cold_plunge", "title": "Cold Exposure", "theme": "oxygen_cyan", "icon": "Snowflake", "category": "bio_rig", "type": "frequency", "target_value": 3, "unit": "minutes", "description": "Control neurochemistry through thermal shock.", "how_instruction": "THE ATOM: Cold Shock. THE STEP: Neck-deep submersion in <50°F water. Minimize movement.", "why_instruction": "Triggers 250% dopamine increase and builds mental callousing. [Huberman]"},
    {"slug": "heavy_lifting", "title": "Heavy Lifting", "theme": "slate_steel", "icon": "Dumbbell", "category": "kinetic_core", "type": "frequency", "target_value": 1, "unit": "session", "description": "Train the nervous system to generate force.", "how_instruction": "THE ATOM: Neural Drive. THE STEP: Compound movements (Squat/Press). 3-5 Reps, 3-5 Sets.", "why_instruction": "Muscular strength is the primary predictor of healthspan and skeletal integrity. [Galpin]"},
    {"slug": "deep_work", "title": "Deep Work Block", "theme": "neural_violet", "icon": "Zap", "category": "kinetic_core", "type": "frequency", "target_value": 90, "unit": "minutes", "description": "Compound cognitive returns via intense focus.", "how_instruction": "THE ATOM: Cognitive Isolation. THE STEP: No phone. No internet. Single-task focus.", "why_instruction": "High-quality work produced = (Time Spent) x (Intensity of Focus). [Newport]"},
    {"slug": "shadow_audit", "title": "Shadow Audit", "theme": "warning_amber", "icon": "PenTool", "category": "black_box", "type": "absolute", "target_value": 1, "unit": "audit", "description": "Nightly review of today's drift and deception.", "how_instruction": "THE ATOM: Radical Honesty. THE STEP: 5m review of failures and lies told today. Zero excuses.", "why_instruction": "You cannot fix what you refuse to look at. Data truth is the only path to growth."},
    {"slug": "ready_state", "title": "Ready State", "theme": "bio_emerald", "icon": "RefreshCw", "category": "bio_rig", "type": "absolute", "target_value": 10, "unit": "minutes", "description": "Maintain mechanical range of motion.", "how_instruction": "THE ATOM: Tissue Maintenance. THE STEP: Couch stretch and deep squat hold.", "why_instruction": "Offset the hip flexion contractures caused by 21st-century sitting. [Starrett]"},
    {"slug": "nasal_breathing", "title": "Nasal Breathing", "theme": "oxygen_cyan", "icon": "Wind", "category": "bio_rig", "type": "absolute", "target_value": 1, "unit": "compliance", "description": "Improve oxygen delivery via the Bohr Effect.", "how_instruction": "THE ATOM: Carbon Tolerance. THE STEP: Breathe only through nose during exercise and sleep.", "why_instruction": "Increases CO2 tolerance, signaling hemoglobin to release oxygen to tissues. [McKeown]"},
    {"slug": "protein_loading", "title": "Protein Loading", "theme": "asset_lime", "icon": "Dna", "category": "bio_rig", "type": "absolute", "target_value": 30, "unit": "grams", "description": "Trigger muscle synthesis and morning energy.", "how_instruction": "THE ATOM: Leucine Trigger. THE STEP: 30g+ protein in the first meal.", "why_instruction": "Required threshold to initiate Muscle Protein Synthesis. [Layman]"},
    {"slug": "sleep_hygiene", "title": "Sleep Hygiene", "theme": "bio_rig", "icon": "Moon", "category": "bio_rig", "type": "frequency", "target_value": 8, "unit": "hours", "description": "Prioritize the brain's cleaning cycle.", "how_instruction": "THE ATOM: Glymphatic Clearance. THE STEP: Cool room (65°F). Total darkness.", "why_instruction": "Clears amyloid beta waste (neurotoxins) from the brain. [Walker]"},
    {"slug": "vo2_max", "title": "VO2 Max Training", "theme": "telemetry", "icon": "Activity", "category": "telemetry", "type": "frequency", "target_value": 1, "unit": "session", "description": "Expand the ceiling of aerobic capacity.", "how_instruction": "THE ATOM: Aerobic Power. THE STEP: 4 mins Max Effort, 4 mins Rest. Repeat 4x.", "why_instruction": "Cardiorespiratory fitness is the strongest correlate to lifespan. [Attia]"},
    {"slug": "make_bed", "title": "Make Bed", "theme": "slate_steel", "icon": "Shield", "category": "kinetic_core", "type": "absolute", "target_value": 1, "unit": "mission", "description": "Secure your first victory immediately.", "how_instruction": "THE ATOM: Discipline Baseline. THE STEP: Precision bed-make upon waking.", "why_instruction": "Small victories establish the standard of excellence for the day. [Jocko]"},
    {"slug": "prayer_stillness", "title": "Prayer / Stillness", "theme": "ghost_white", "icon": "Heart", "category": "nav_computer", "type": "absolute", "target_value": 10, "unit": "minutes", "description": "Center your mind and align values.", "how_instruction": "THE ATOM: Narrative Control. THE STEP: 10m of prayer or meditation for others.", "why_instruction": "Interrupts the selfish ego and resets Internal Force for service. [Aurelius]"},
    {"slug": "good_deed", "title": "Secret Good Deed", "theme": "neural_violet", "icon": "Heart", "category": "armor_plating", "type": "absolute", "target_value": 1, "unit": "act", "description": "Build virtue by helping others in secret.", "how_instruction": "THE ATOM: Character Forge. THE STEP: One helpful act. They must never know it was you.", "why_instruction": "Removes the dopamine hit of praise to build intrinsic integrity. [Aurelius]"},
    {"slug": "memento_mori", "title": "Remember Death", "theme": "ghost_white", "icon": "Lock", "category": "armor_plating", "type": "absolute", "target_value": 1, "unit": "session", "description": "Clarify priorities by remembering finitude.", "how_instruction": "THE ATOM: Perspective Strike. THE STEP: Reflect for 2m: 'This could be my last day.'", "why_instruction": "Kills procrastination instantly. Realizing time is limited is the High Ground. [Seneca]"},
    {"slug": "digital_sunset", "title": "Digital Sunset", "theme": "sunset_indigo", "icon": "Moon", "category": "black_box", "type": "absolute", "target_value": 1, "unit": "sunset", "description": "Protect recovery chemicals from blue light.", "how_instruction": "THE ATOM: Melatonin Protection. THE STEP: Screens off 60m before bed.", "why_instruction": "Ensures deep REM and hormonal reset. One hour of darkness is armor. [Walker]"},
    {"slug": "no_sugar", "title": "Glycemic Defense", "theme": "combat_red", "icon": "Lock", "category": "bio_rig", "type": "absolute", "target_value": 1, "unit": "day", "description": "Protect energy from insulin spikes.", "how_instruction": "THE ATOM: Metabolic Shield. THE STEP: Zero refined sugar or liquid calories for 24h.", "why_instruction": "Reduces systemic inflammation and energy crashes. [Lustig]"},
    {"slug": "social_sync", "title": "Social Sync", "theme": "maxi_blue", "icon": "Users", "category": "the_ally", "type": "absolute", "target_value": 1, "unit": "call", "description": "Maintain social infrastructure.", "how_instruction": "THE ATOM: Tribe Connection. THE STEP: Connect with one person for 10+ mins.", "why_instruction": "Social isolation is a primary biological stressor. [Conti]"},
    {"slug": "new_skill", "title": "Skill Acquisition", "theme": "neural_violet", "icon": "BookOpen", "category": "nav_computer", "type": "frequency", "target_value": 30, "unit": "minutes", "description": "Expand specific knowledge and leverage.", "how_instruction": "THE ATOM: Neural Plasticity. THE STEP: 30m focused practice on a high-leverage skill.", "why_instruction": "Focus + Novelty = Growth. The mind is for training, not just storage. [Huberman]"},
    {"slug": "daily_shutdown", "title": "Daily Shutdown", "theme": "sunset_indigo", "icon": "RotateCcw", "category": "black_box", "type": "absolute", "target_value": 1, "unit": "ritual", "description": "Close all open cognitive loops before disconnecting.", "how_instruction": "THE ATOM: Cognitive Closure. THE STEP: Review tomorrow's Big 3. Say 'Shutdown Complete'.", "why_instruction": "Clears attention residue and protects the evening window. [Newport]"},
    {"slug": "grip_strength", "title": "Dead Hang", "theme": "telemetry", "icon": "Anchor", "category": "telemetry", "type": "absolute", "target_value": 120, "unit": "seconds", "description": "Test systemic strength and decompress spine.", "how_instruction": "THE ATOM: Force Output. THE STEP: Hang from a bar. Active shoulders. Total of 120s.", "why_instruction": "Grip strength is the #1 physical biomarker of all-cause mortality. [Bohannon]"},
    {"slug": "box_breathing", "title": "Box Breathing", "theme": "oxygen_cyan", "icon": "Wind", "category": "armor_plating", "type": "absolute", "target_value": 5, "unit": "minutes", "description": "Tactical autonomic nervous system regulation.", "how_instruction": "THE ATOM: Vagus Nerve Stim. THE STEP: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.", "why_instruction": "Instantly lowers heart rate and restores cognitive control. [McKeown]"},
    {"slug": "nature_fractals", "title": "Touch Grass", "theme": "bio_emerald", "icon": "Trees", "category": "bio_rig", "type": "absolute", "target_value": 15, "unit": "minutes", "description": "Lower stress via environmental fractals.", "how_instruction": "THE ATOM: Panoramic Vision. THE STEP: 15m outside. Look at the horizon. No phone.", "why_instruction": "Viewing natural fractals reduces rumination and lowers blood pressure. [Bratman]"},
    {"slug": "inbox_zero", "title": "Inbox Zero", "theme": "slate_steel", "icon": "Mail", "category": "kinetic_core", "type": "absolute", "target_value": 1, "unit": "process", "description": "Clear the mental static of digital business.", "how_instruction": "THE ATOM: Open Loop Closure. THE STEP: Process inbox until empty. Archive or Task.", "why_instruction": "Unfinished tasks in your inbox act as a leak in your cognitive armor. [Ferriss]"},
    {"slug": "digital_air_gap", "title": "Digital Air Gap", "theme": "black_box", "icon": "Lock", "category": "black_box", "type": "absolute", "target_value": 60, "unit": "minutes", "description": "Sever the connection to the digital hive mind.", "how_instruction": "THE ATOM: Dopamine Reset. THE STEP: Phone in a separate room for 1 hour of deep work.", "why_instruction": "Constant notifications downregulate dopamine receptors. [Lembke]"},
    {"slug": "agency_audit", "title": "Agency Audit", "theme": "nav_computer", "icon": "Brain", "category": "black_box", "type": "boolean", "target_value": 1, "unit": "entry", "description": "Map the internal terrain of the mind.", "how_instruction": "THE ATOM: Narrative Control. THE STEP: Journal to identify 'Defense' vs 'Generative' drive.", "why_instruction": "Identifying internal 'spies' allows you to regain agency over your life. [Conti]"},
    {"slug": "leverage_audit", "title": "Leverage Audit", "theme": "kinetic_core", "icon": "TrendingUp", "category": "kinetic_core", "type": "boolean", "target_value": 1, "unit": "review", "description": "Ensure effort is multiplied by leverage.", "how_instruction": "THE ATOM: Input/Output Disconnection. THE STEP: Audit tasks: Code, Media, or Capital?", "why_instruction": "Wealth is the product of Leverage x Judgment. Stop trading time for money. [Ravikant]"},
    {"slug": "fasted_walk", "title": "Fasted Walk", "theme": "bio_rig", "icon": "Activity", "category": "bio_rig", "type": "absolute", "target_value": 20, "unit": "minutes", "description": "Mobilize fatty acids immediately upon waking.", "how_instruction": "THE ATOM: Lipolysis. THE STEP: 20m walk before first calorie. Low intensity.", "why_instruction": "Increases fat burning during low-intensity movement. [Horowitz]"},
    {"slug": "thermoregulation", "title": "Cold Bedroom", "theme": "bio_rig", "icon": "Thermometer", "category": "bio_rig", "type": "boolean", "target_value": 1, "unit": "check", "description": "Trigger the core temp drop for deep sleep.", "how_instruction": "THE ATOM: Core Temp Drop. THE STEP: Bedroom at 65°F (18°C) one hour before sleep.", "why_instruction": "Biological trigger for sleep onset and quality maintenance. [Walker]"}
  ],
  "protocol_stacks": [
    {
      "id": "stack_atlas", "name": "Atlas Golden Set", "expert_voice": "The Founder", "theme_override": "maxi_blue", "description": "The foundation for Rig stability.",
      "habits": ["morning_sun", "deep_work", "zone_2_cardio", "shadow_audit", "digital_sunset"]
    },
    {
      "id": "stack_huberman", "name": "Neuro-Rig Stack", "expert_voice": "Andrew Huberman", "theme_override": "oxygen_cyan", "description": "Biological hardware optimization.",
      "habits": ["morning_sun", "cold_plunge", "nsdr_reset", "digital_sunset"]
    },
    {
      "id": "stack_goggins", "name": "Iron Mind", "expert_voice": "David Goggins", "theme_override": "combat_red", "description": "Callous the mind through suffering.",
      "overrides": [
        { "slug": "heavy_lifting", "title": "Taking Souls (Lift)", "description": "Enter the room of suffering. Do not leave until you've taken a soul.", "how_instruction": "THE ATOM: Mental Callousing. THE STEP: Train until the mind wants to quit.", "why_instruction": "Trains the brain to override the 'Safety Governor'. [Goggins]" }
      ],
      "habits": ["accountability_mirror", "heavy_lifting", "taking_souls", "cookie_jar"]
    },
    {
      "id": "stack_jocko", "name": "Discipline Stack", "expert_voice": "Jocko Willink", "theme_override": "slate_steel", "description": "The military standard for daily execution.",
      "overrides": [
        { "slug": "make_bed", "title": "Secure the Perimeter", "description": "Discipline starts the moment you leave the sheets.", "how_instruction": "Precision bed-make. No loose corners.", "why_instruction": "Do not let the first mission fail. Establish the standard." }
      ],
      "habits": ["make_bed", "deep_work", "shadow_audit", "no_sugar"]
    },
    {
      "id": "stack_stoic", "name": "The Citadel", "expert_voice": "Marcus Aurelius", "theme_override": "ghost_white", "description": "Impervious to external fortune.",
      "habits": ["memento_mori", "amor_fati", "prayer_stillness", "good_deed"]
    },
    {
      "id": "stack_attia", "name": "Centenarian", "expert_voice": "Peter Attia", "theme_override": "bio_emerald", "description": "Training for the Marginal Decade.",
      "habits": ["zone_2_cardio", "heavy_lifting", "fasting", "vo2_max"]
    },
    {
      "id": "stack_war", "name": "The War Phase", "expert_voice": "The Operator", "theme_override": "warning_amber", "description": "High-output optimization for crisis.",
      "habits": ["sauna", "digital_air_gap", "thermoregulation", "deep_work"]
    },
    {
      "id": "stack_deep", "name": "Deep Stack", "expert_voice": "Cal Newport", "theme_override": "neural_violet", "description": "Unlocking the cognitive superpower.",
      "habits": ["deep_work", "shutdown_cipher", "nature_fractals"]
    },
    {
      "id": "stack_athlete", "name": "Athlete Standard", "expert_voice": "Performance Coach", "theme_override": "combat_red", "description": "Explosive power and rapid recovery.",
      "habits": ["neural_drive", "protein_loading", "ready_state", "nsdr_reset"]
    }
  ]
};

async function seed() {
    console.log("🌱 Seeding Archive v6.0...");

    // 1. Seed Habits
    for (const habit of ARCHIVE_DATA.library_habits) {
        // Map JSON 'title' to DB 'name' column
        const payload = { ...habit, name: habit.title };
        // 'title' key in payload will be ignored or stored if schema allows extra columns,
        // but typically upsert aligns with schema. We ensure 'name' is present.

        const { error } = await supabase
            .from('library_habits')
            .upsert(payload, { onConflict: 'slug' });

        if (error) console.error(`Error seeding habit ${habit.slug}:`, error.message);
    }
    console.log("✅ Library Habits synced.");

    // 2. Seed Protocols
    for (const stack of ARCHIVE_DATA.protocol_stacks) {
        const payload = {
            stack_id: stack.id,
            title: stack.name,
            description: stack.description,
            expert_voice: stack.expert_voice,
            theme_override: stack.theme_override,
            habit_slugs: stack.habits,
            overrides: stack.overrides || []
        };

        const { error } = await supabase
            .from('library_protocols')
            .upsert(payload, { onConflict: 'stack_id' });

        if (error) console.error(`Error seeding protocol ${stack.id}:`, error.message);
    }
    console.log("✅ Protocol Stacks synced.");
}

seed();
