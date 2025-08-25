import { KeyStorer, FirebaseIdToken } from 'firebase-auth-cloudflare-workers';
import { Context, MiddlewareHandler } from 'hono';

type VerifyFirebaseAuthEnv = {
    PUBLIC_JWK_CACHE_KEY?: string | undefined;
    PUBLIC_JWK_CACHE_KV?: KVNamespace | undefined;
    FIREBASE_AUTH_EMULATOR_HOST: string | undefined;
};
interface VerifyFirebaseAuthConfig {
    projectId: string;
    authorizationHeaderKey?: string;
    keyStore?: KeyStorer;
    keyStoreInitializer?: (c: Context) => KeyStorer;
    disableErrorLog?: boolean;
    firebaseEmulatorHost?: string;
}
declare const verifyFirebaseAuth: (userConfig: VerifyFirebaseAuthConfig) => MiddlewareHandler;
declare const getFirebaseToken: (c: Context) => FirebaseIdToken | null;
interface VerifySessionCookieFirebaseAuthConfig {
    projectId: string;
    cookieName?: string;
    keyStore?: KeyStorer;
    keyStoreInitializer?: (c: Context) => KeyStorer;
    firebaseEmulatorHost?: string;
    redirects: {
        signIn: string;
    };
}
declare const verifySessionCookieFirebaseAuth: (userConfig: VerifySessionCookieFirebaseAuthConfig) => MiddlewareHandler;

export { type VerifyFirebaseAuthConfig, type VerifyFirebaseAuthEnv, type VerifySessionCookieFirebaseAuthConfig, getFirebaseToken, verifyFirebaseAuth, verifySessionCookieFirebaseAuth };
