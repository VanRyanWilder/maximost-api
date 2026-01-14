import fs from 'fs';
import path from 'path';

let sql = '-- Sovereign Vault: Cached Roasts (Pre-Seed Data)\n\n';

// 1. Cached Roasts Table
sql += `CREATE TABLE IF NOT EXISTS public.cached_roasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    excuse_pattern TEXT NOT NULL, -- Text pattern to match (e.g., "tired", "later")
    response_text TEXT NOT NULL,
    category TEXT, -- 'procrastination', 'comparison', 'overwhelmed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;

// 2. Indexes
sql += `CREATE INDEX idx_cached_excuse ON public.cached_roasts(excuse_pattern);\n`;

// 3. RLS
sql += `ALTER TABLE public.cached_roasts ENABLE ROW LEVEL SECURITY;\n`;
sql += `CREATE POLICY "Service Role Full Access" ON public.cached_roasts FOR ALL TO service_role USING (true) WITH CHECK (true);\n`;
sql += `CREATE POLICY "Public Read Access" ON public.cached_roasts FOR SELECT TO authenticated USING (true);\n\n`;

// 4. Seed Data (The Sovereign 5)
const seeds = [
    {
        category: 'procrastination',
        pattern: 'later',
        response: "Later is a f*cking lie. You're just negotiating with your own comfort so you can feel better about being a loser for the next five minutes. Goggins doesn't have a 'later' and neither does the version of you that actually wins. Do it now or admit you're a b*tch."
    },
    {
        category: 'comparison',
        pattern: 'everyone else',
        response: "Stop looking at other people's highlight reels and look in the f*cking mirror. You're losing because you're focused on the finish line instead of the dirt under your fingernails. Focus on your own soul. Everyone else is irrelevant. Get back to work."
    },
    {
        category: 'overwhelmed',
        pattern: 'too much',
        response: "Your brain is panicking because it’s looking at the whole mountain. Look at the f*cking dirt in front of your boots. One step. Then another. You’re only at 40%—your brain is just trying to get you to quit before it gets painful. Embrace the suck."
    },
    {
        category: 'fatigue',
        pattern: 'tired',
        response: "Your fatigue is a lie told by your limbic system to save energy. You are not tired; you are unconditioned. Lace up your shoes now."
    }
];

sql += `-- Seed Data\n`;
seeds.forEach(s => {
    // Upsert logic based on pattern to avoid duplicates
    // Using ON CONFLICT requires a unique constraint, but excuse_pattern is just indexed.
    // We'll use a simple INSERT WHERE NOT EXISTS logic block for migration safety.
    const resp = s.response.replace(/'/g, "''");
    sql += `
    INSERT INTO public.cached_roasts (excuse_pattern, response_text, category)
    SELECT '${s.pattern}', '${resp}', '${s.category}'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.cached_roasts WHERE excuse_pattern = '${s.pattern}'
    );\n`;
});

const outputPath = path.resolve(__dirname, '../../migrations_cached_roasts.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
