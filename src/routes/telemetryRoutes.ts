import { Hono } from 'hono';
import { AppEnv } from '../hono';

const telemetryRoutes = new Hono<AppEnv>();

// Generic Delete Helper
const deleteTelemetry = async (c: any, table: string) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return c.json({ error: 'Delete failed' }, 500);
    return c.json({ message: 'Deleted' });
};

// DELETE Routes
telemetryRoutes.delete('/hr/:id', (c) => deleteTelemetry(c, 'telemetry_heart_rate'));
telemetryRoutes.delete('/steps/:id', (c) => deleteTelemetry(c, 'telemetry_steps'));
telemetryRoutes.delete('/sleep/:id', (c) => deleteTelemetry(c, 'telemetry_sleep'));
telemetryRoutes.delete('/body-comp/:id', (c) => deleteTelemetry(c, 'telemetry_body_composition'));
telemetryRoutes.delete('/prs/:id', (c) => deleteTelemetry(c, 'telemetry_prs'));

// PUT Routes (Edit)
const updateTelemetry = async (c: any, table: string, allowedFields: string[]) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { id } = c.req.param();
    const body = await c.req.json();

    // Filter fields
    const updates: any = {};
    allowedFields.forEach(f => {
        if (body[f] !== undefined) updates[f] = body[f];
    });

    if (Object.keys(updates).length === 0) return c.json({ error: 'No valid fields' }, 400);

    const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return c.json({ error: 'Update failed' }, 500);
    return c.json({ message: 'Updated' });
};

telemetryRoutes.put('/hr/:id', (c) => updateTelemetry(c, 'telemetry_heart_rate', ['bpm', 'recorded_at']));
telemetryRoutes.put('/steps/:id', (c) => updateTelemetry(c, 'telemetry_steps', ['count', 'calories_burned']));
telemetryRoutes.put('/sleep/:id', (c) => updateTelemetry(c, 'telemetry_sleep', ['start_time', 'end_time', 'efficiency_score']));
telemetryRoutes.put('/body-comp/:id', (c) => updateTelemetry(c, 'telemetry_body_composition', ['weight_lbs', 'body_fat_pct', 'recorded_at']));
telemetryRoutes.put('/prs/:id', (c) => updateTelemetry(c, 'telemetry_prs', ['exercise', 'weight_lbs', 'recorded_at']));

// POST Routes (Manual Override / Creation)
const createTelemetry = async (c: any, table: string, requiredFields: string[]) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const body = await c.req.json();

    // Basic Validation
    for (const field of requiredFields) {
        if (body[field] === undefined) return c.json({ error: `Missing field: ${field}` }, 400);
    }

    const { data, error } = await supabase
        .from(table)
        .insert({
            ...body,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Create Error:', error);
        return c.json({ error: 'Creation failed' }, 500);
    }
    return c.json(data);
};

telemetryRoutes.post('/hr', (c) => createTelemetry(c, 'telemetry_heart_rate', ['bpm', 'recorded_at']));
telemetryRoutes.post('/steps', (c) => createTelemetry(c, 'telemetry_steps', ['count', 'day']));
telemetryRoutes.post('/sleep', (c) => createTelemetry(c, 'telemetry_sleep', ['start_time', 'end_time']));
telemetryRoutes.post('/body-comp', (c) => createTelemetry(c, 'telemetry_body_composition', ['weight_lbs', 'recorded_at']));
telemetryRoutes.post('/prs', (c) => createTelemetry(c, 'telemetry_prs', ['exercise', 'weight_lbs', 'recorded_at']));

export default telemetryRoutes;
