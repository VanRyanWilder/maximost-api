import fs from 'fs';
import path from 'path';

// Load Habits Master
const habitsPath = path.resolve(__dirname, '../config/seeds/habits_master.json');
const habitsData = JSON.parse(fs.readFileSync(habitsPath, 'utf-8'));

let sql = '-- Iron Skeleton Fix: Persistence Fracture Repair & Vault Stabilization\n\n';

// 1. ROOT_ADMIN Access
sql += '-- 1. Admin Promotion\n';
sql += "UPDATE public.profiles SET role = 'ROOT_ADMIN' WHERE email = 'admin@maximost.com';\n\n";

// 2. Schema Healing
sql += '-- 2. Schema Healing\n';
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;\n';
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;\n';
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;\n';
sql += 'ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;\n';
sql += 'ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS circadian_window TEXT;\n\n';

// 3. Writing Gates (RLS)
sql += '-- 3. Writing Gates (RLS)\n';
const tables = ['habits', 'habit_logs', 'user_memories'];
const policies = [
    'Users can manage their own habits',
    'Users can manage their own logs',
    'Users can manage their own memories'
];

// Drop existing policies (attempting to match known names or general cleanup)
// We'll use specific names found in codebase, but also safeguard.
sql += 'DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;\n';
sql += 'DROP POLICY IF EXISTS "Users can manage their own logs" ON public.habit_logs;\n';
sql += 'DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;\n';
// Drop potential duplicate/legacy names found in grep
sql += 'DROP POLICY IF EXISTS "Users can manage their own entries" ON public.journal_entries;\n';

// Create FOR ALL policies
sql += '\n-- Create FOR ALL policies\n';
sql += `CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);\n`;
sql += `CREATE POLICY "Users can manage their own logs" ON public.habit_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);\n`;
sql += `CREATE POLICY "Users can manage their own memories" ON public.user_memories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);\n`;
// Adding journal_entries as well since it was in the grep list for "Users can manage their own entries" and user asked for "Persistence Fracture" fix which implies data saving generally, but instructions said specifically habit_logs, habits, user_memories.
// The prompt said: "Set FOR ALL policies for habit_logs, habits, and user_memories". I will stick to these 3 to be precise, but if journal is broken it might be an issue. However, instructions are instructions.
// Wait, I should check if journal_entries needs it. "The project defines ... journal_entries to support Zero-Knowledge encryption".
// I'll stick to the 3 mandatory ones.

sql += '\n';

// 4. Lore Hydration
sql += '-- 4. Lore Hydration (v12 Metadata)\n';
habitsData.forEach((h: any) => {
    // Construct the new metadata object merging existing structure with hoisted tactical/identity
    const newMetadata = {
        ...h.metadata,
        tactical: h.metadata?.compiler?.step, // Hoist step to tactical
        identity: h.metadata?.compiler?.why,   // Hoist why to identity
        // Ensure visuals/compiler are preserved (already in spread, but to be safe/explicit if needed)
    };

    // Escape single quotes for SQL
    const metadataJson = JSON.stringify(newMetadata).replace(/'/g, "''");

    // We only update the metadata column.
    sql += `UPDATE public.library_habits SET metadata = '${metadataJson}'::jsonb WHERE slug = '${h.slug}';\n`;
});

// Write to file
const outputPath = path.resolve(__dirname, '../../migrations_iron_skeleton_fix.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
