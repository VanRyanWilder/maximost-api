import { Context } from 'hono';

export function jsonWithCors(c: Context, data: any, status: number = 200) {
  return c.json(data, status, {
    'Access-Control-Allow-Origin': '*', // Or your Vercel URL in production
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, cache-control, x-client-info',
  });
}