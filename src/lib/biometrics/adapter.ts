// The "Airlock" Interface
// Decouples internal logic from external vendors (Terra, Apple, Garmin)

export interface BiometricData {
    source: 'terra' | 'apple' | 'garmin' | 'manual';
    metric_type: 'steps' | 'sleep' | 'hrv' | 'zone2' | 'unknown';
    value: number;
    unit: string;
    timestamp: string; // ISO 8601
    metadata?: Record<string, any>; // Vendor specific raw data if needed for debugging
}

// Mapper Function
export function normalizeTerraData(terraPayload: any): BiometricData[] {
    const normalized: BiometricData[] = [];

    // Example Terra Payload Structure (Simplified assumption based on typical webhook)
    // terraPayload.type = 'activity' | 'sleep' | ...
    // terraPayload.data = { ... }

    // 1. Steps
    if (terraPayload.type === 'activity' && terraPayload.data?.steps) {
        normalized.push({
            source: 'terra',
            metric_type: 'steps',
            value: terraPayload.data.steps,
            unit: 'count',
            timestamp: terraPayload.timestamp || new Date().toISOString()
        });
    }

    // 2. Sleep
    if (terraPayload.type === 'sleep' && terraPayload.data?.total_sleep_seconds) {
        normalized.push({
            source: 'terra',
            metric_type: 'sleep',
            value: terraPayload.data.total_sleep_seconds / 3600, // Convert to Hours
            unit: 'hours',
            timestamp: terraPayload.timestamp || new Date().toISOString()
        });
    }

    // 3. HRV (Heart Rate Variability) - RMSSD
    if (terraPayload.data?.heart_rate_data?.summary?.rmssd) {
         normalized.push({
            source: 'terra',
            metric_type: 'hrv',
            value: terraPayload.data.heart_rate_data.summary.rmssd,
            unit: 'ms',
            timestamp: terraPayload.timestamp || new Date().toISOString()
        });
    }

    return normalized;
}
