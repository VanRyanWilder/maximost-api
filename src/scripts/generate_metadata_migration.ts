import fs from 'fs';
import path from 'path';

const habitsPath = path.resolve(__dirname, '../config/seeds/habits_master.json');
const habitsData = JSON.parse(fs.readFileSync(habitsPath, 'utf-8'));

let sql = '-- Metadata Master Load: Hydrating the Lens (v12)\n\n';

habitsData.forEach((h: any) => {
    // Construct the new metadata object merging existing structure with hoisted tactical/identity
    const newMetadata = {
        ...h.metadata,
        tactical: h.metadata?.compiler?.step || 'Execute protocol.',
        identity: h.metadata?.compiler?.why || 'Forge your sovereign path.',
        // Ensure visuals/compiler are preserved
        visuals: h.metadata?.visuals,
        compiler: h.metadata?.compiler,
        telemetry: h.metadata?.telemetry
    };

    // Escape single quotes for SQL
    const metadataJson = JSON.stringify(newMetadata).replace(/'/g, "''");

    sql += `UPDATE public.library_habits SET metadata = '${metadataJson}'::jsonb WHERE slug = '${h.slug}';\n`;
});

// Also force update target_value/unit/type if they differ from master (Schema Healing)
habitsData.forEach((h: any) => {
    sql += `UPDATE public.library_habits SET target_value = ${h.target_value}, unit = '${h.unit}', type = '${h.type}' WHERE slug = '${h.slug}';\n`;
});

fs.writeFileSync(path.resolve(__dirname, '../../migrations_metadata_master_load.sql'), sql);
console.log('Migration file generated successfully.');
