import { Context } from 'hono';

export const jsonWithCors = (c: Context, data: any, status = 200) => {
    return c.json(data, status, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
};
