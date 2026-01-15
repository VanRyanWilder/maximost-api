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

export default telemetryRoutes;
