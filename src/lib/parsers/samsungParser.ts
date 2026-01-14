// Samsung Health JSON Parser (Draft Design)
// Intended to handle the large JSON export structure from Samsung Health

/**
 * Parses a raw JSON object from a Samsung Health export file.
 * Returns normalized arrays ready for database insertion.
 */
export const parseSamsungHealthExport = (jsonData: any) => {
    const results = {
        heartRate: [] as any[],
        steps: [] as any[],
        sleep: [] as any[],
        errors: [] as string[]
    };

    try {
        // 1. Heart Rate
        // Expected Source: com.samsung.shealth.tracker.heart_rate
        // Or generic export structure
        const hrData = jsonData.heart_rate || jsonData.com_samsung_health_heart_rate;
        if (hrData && Array.isArray(hrData)) {
            results.heartRate = hrData.map((record: any) => ({
                bpm: record.heart_rate || record.bpm,
                recorded_at: record.start_time || record.recorded_at,
                source_file_id: null // To be filled if we track batch IDs
            })).filter(r => r.bpm && r.recorded_at);
        }

        // 2. Steps
        // Expected Source: com.samsung.shealth.tracker.pedometer_step_count
        const stepData = jsonData.step_count || jsonData.com_samsung_health_step_count;
        if (stepData && Array.isArray(stepData)) {
             results.steps = stepData.map((record: any) => ({
                 day: record.day_time ? record.day_time.substring(0, 10) : record.day, // Extract YYYY-MM-DD
                 count: record.count || record.step_count,
                 distance_meters: record.distance || 0,
                 calories_burned: record.calorie || 0
             })).filter(r => r.day && r.count);
        }

        // 3. Sleep
        // Expected Source: com.samsung.shealth.tracker.sleep
        const sleepData = jsonData.sleep || jsonData.com_samsung_health_sleep;
        if (sleepData && Array.isArray(sleepData)) {
            results.sleep = sleepData.map((record: any) => ({
                start_time: record.start_time,
                end_time: record.end_time,
                efficiency_score: record.efficiency || 0,
                // Simple duration calc if missing
                duration_minutes: record.duration_minutes || (new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 60000
            })).filter(r => r.start_time && r.end_time);
        }

    } catch (error: any) {
        results.errors.push(`Parser Failure: ${error.message}`);
    }

    return results;
};
