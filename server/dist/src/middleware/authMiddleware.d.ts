import type { DecodedIdToken } from "firebase-admin/auth";
import { Context as HonoCtx } from 'hono';
export type AuthEnv = {
    Variables: {
        user: DecodedIdToken;
    };
};
export declare const honoProtectWithFirebase: (c: HonoCtx<AuthEnv>, next: Function) => Promise<(Response & import("hono").TypedResponse<{
    message: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    message: string;
    errorDetail: any;
}, 403, "json">) | undefined>;
