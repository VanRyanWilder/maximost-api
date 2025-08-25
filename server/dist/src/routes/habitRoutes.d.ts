import { Hono } from 'hono';
import { AuthEnv } from "@/middleware/authMiddleware";
declare const app: Hono<AuthEnv, import("hono/types").BlankSchema, "/">;
export default app;
