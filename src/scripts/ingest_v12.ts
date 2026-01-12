import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const config = envSchema.parse(process.env);

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

async function ingestHabits() {
    const habitsPath = path.resolve(__dirname, '../config/seeds/habits_master.json');
    const habitsData = JSON.parse(fs.readFileSync(habitsPath, 'utf-8'));

    const protocolsPath = path.resolve(__dirname, '../config/seeds/protocols_master.json');
    const protocolsData = JSON.parse(fs.readFileSync(protocolsPath, 'utf-8'));

    // Identify Quick Start Habits
    const quickStart = protocolsData.find((p: any) => p.name === 'Quick Start');
    const startingFiveSlugs = quickStart ? quickStart.habits : [];

    console.log(`Ingesting ${habitsData.length} habits...`);

    // Map description from metadata if missing AND set is_starting_5
    const mappedHabits = habitsData.map((h: any) => ({
        ...h,
        description: h.description || h.metadata?.compiler?.why || h.metadata?.compiler?.atom || 'No description available.',
        is_starting_5: startingFiveSlugs.includes(h.slug)
    }));

    const { error } = await supabase
        .from('library_habits')
        .upsert(mappedHabits, { onConflict: 'slug' });

    if (error) {
        console.error('Error ingesting habits:', error);
        process.exit(1);
    }
    console.log('Habits ingestion successful.');
}

async function ingestProtocols() {
    const protocolsPath = path.resolve(__dirname, '../config/seeds/protocols_master.json');
    const protocolsData = JSON.parse(fs.readFileSync(protocolsPath, 'utf-8'));

    console.log(`Ingesting ${protocolsData.length} protocols...`);

    // Map JSON fields to Schema fields if necessary.
    // JSON: name, expert_voice, theme_override, description, habits
    // Schema Assumption: library_protocols uses stack_id as PK?
    // Let's assume the schema expects: stack_id, title (from name), description, habits (jsonb or array), theme (from theme_override?), expert (from expert_voice?)
    // Wait, the prompt says: "protocol_stacks: Uses habits (array of slugs) and overrides (custom JSON)".
    // But previous `protocolRoutes` used `library_protocols`.
    // I'll assume `library_protocols` is the target table.
    // I will try to map `name` -> `stack_id` (slugified) and `title`.

    const mappedProtocols = protocolsData.map((p: any) => ({
        stack_id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''), // slugify
        title: p.name,
        description: p.description,
        habits: p.habits,
        theme: p.theme_override,
        expert: p.expert_voice
        // We might need to map 'overrides' if that column exists, but for now we map flat fields.
        // If the table is `protocol_stacks` and has different columns, this might fail.
        // But `protocolRoutes` used `library_protocols`.
    }));

    // Target `protocol_stacks` as the master table
    const { error } = await supabase
        .from('protocol_stacks')
        .upsert(mappedProtocols, { onConflict: 'stack_id' });

    if (error) {
        console.error('Error ingesting protocols to protocol_stacks:', error);
        process.exit(1);
    }
    console.log('Protocols ingestion successful.');
}

async function main() {
    await ingestHabits();
    await ingestProtocols();
}

main();
