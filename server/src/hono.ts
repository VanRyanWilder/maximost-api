import { Hono } from 'hono'

type AppEnv = {
    Bindings: {
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
        SUPABASE_SERVICE_ROLE_KEY: string;
        SUPABASE_JWT_SECRET: string;
    },
    Variables: {}
}

export type App = Hono<AppEnv>
export type AppContext = Hono<AppEnv>['context']
