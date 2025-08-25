import { Hono } from 'hono';
import type { DecodedIdToken } from 'firebase-admin/auth';
type AppEnv = {
    Variables: {
        user: DecodedIdToken;
    };
};
declare const app: Hono<AppEnv, import("hono/types").BlankSchema, "/">;
export default app;
