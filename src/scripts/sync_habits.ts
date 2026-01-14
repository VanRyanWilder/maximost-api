import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Load env
dotenv.config();

// Validation Schema
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const config = envSchema.parse(process.env);
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Define High-IQ Metadata for the Elite 5
const ELITE_5_METADATA: Record<string, { why: string; impact: string }> = {
    "intermittent_fasting": {
        why: "Metabolic Switch: Autophagy triggers at hour 16.",
        impact: "Cellular Repair / Insulin Sensitivity"
    },
    "cold_plunge": {
        why: "Norepinephrine Spike: 250% increase in baseline focus.",
        impact: "Dopamine / Stress Resilience"
    },
    "zone_2_cardio": {
        why: "Mitochondrial Density: Building the aerobic base.",
        impact: "Lactate Clearance / Endurance"
    },
    "heavy_lifting": {
        why: "Hormonal Baseline: Maximizing CNS and bone density.",
        impact: "Testosterone / Structural Integrity"
    },
    "sauna": {
        why: "Heat Shock Proteins: Mimics aerobic stress response.",
        impact: "Cardiovascular Health / Recovery"
    }
};

async function syncHabits() {
    console.log("Reading Master Seed...");
    const habitsPath = path.resolve(__dirname, '../config/seeds/habits_master.json');

    if (!fs.existsSync(habitsPath)) {
        console.error("Master seed file not found at:", habitsPath);
        process.exit(1);
    }

    const habitsData = JSON.parse(fs.readFileSync(habitsPath, 'utf-8'));
    console.log(`Found ${habitsData.length} Atoms to sync.`);

    const updates = habitsData.map((h: any) => {
        // 1. Prepare Base Metadata
        const baseMetadata = h.metadata || {};

        // 2. Inject High-IQ Data if applicable
        // Slug format in JSON is like "cold_plunge", keys in ELITE_5_METADATA match this.
        let intelData = baseMetadata.intel || {};

        // Check if this habit is one of the Elite 5
        // We match by slug (exact match)
        if (ELITE_5_METADATA[h.slug]) {
            console.log(`Injecting High-IQ Intel for: ${h.title}`);
            intelData = {
                ...intelData,
                ...ELITE_5_METADATA[h.slug]
            };
        } else if (h.slug === 'fasting') {
            // Handle edge case where slug might be 'fasting' vs 'intermittent_fasting'
            // The JSON has "fasting" for "Intermittent Fasting"
            console.log(`Injecting High-IQ Intel for: ${h.title} (Mapped from 'fasting')`);
            intelData = {
                ...intelData,
                ...ELITE_5_METADATA['intermittent_fasting']
            };
        }

        // 3. Construct Final Object
        return {
            slug: h.slug,
            title: h.title,
            category: h.category,
            type: h.type,
            target_value: h.target_value,
            unit: h.unit,
            description: h.description || baseMetadata.compiler?.why || baseMetadata.compiler?.atom || 'No description available.',
            // Fallback for older schema requirements
            icon: baseMetadata.visuals?.icon || 'Circle',
            theme: baseMetadata.visuals?.theme || 'slate_steel',
            // The Payload
            metadata: {
                ...baseMetadata,
                intel: intelData
            }
        };
    });

    console.log("Upserting to library_habits...");

    const { data, error } = await supabase
        .from('library_habits')
        .upsert(updates, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error("SYNC FAILED:", error);
        process.exit(1);
    }

    console.log(`SYNC COMPLETE. ${data?.length} Atoms verified.`);
}

syncHabits().catch(err => {
    console.error("Unexpected Error:", err);
    process.exit(1);
});
