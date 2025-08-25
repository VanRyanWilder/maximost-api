// src/index.ts
import { Auth, WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
var defaultKVStoreJWKCacheKey = "verify-firebase-auth-cached-public-key";
var defaultKeyStoreInitializer = (c) => {
  if (c.env.PUBLIC_JWK_CACHE_KV === void 0) {
    const status = 501;
    throw new HTTPException(status, {
      res: new Response("Not Implemented", { status })
    });
  }
  return WorkersKVStoreSingle.getOrInitialize(
    c.env.PUBLIC_JWK_CACHE_KEY ?? defaultKVStoreJWKCacheKey,
    c.env.PUBLIC_JWK_CACHE_KV
  );
};
var verifyFirebaseAuth = (userConfig) => {
  const config = {
    projectId: userConfig.projectId,
    authorizationHeaderKey: userConfig.authorizationHeaderKey ?? "Authorization",
    keyStore: userConfig.keyStore,
    keyStoreInitializer: userConfig.keyStoreInitializer ?? defaultKeyStoreInitializer,
    disableErrorLog: userConfig.disableErrorLog,
    firebaseEmulatorHost: userConfig.firebaseEmulatorHost
  };
  const checkRevoked = false;
  return async (c, next) => {
    const authorization = c.req.raw.headers.get(config.authorizationHeaderKey);
    if (authorization === null) {
      const status = 400;
      throw new HTTPException(status, {
        res: new Response("Bad Request", { status }),
        message: "authorization header is empty"
      });
    }
    const jwt = authorization.replace(/Bearer\s+/i, "");
    const auth = Auth.getOrInitialize(
      config.projectId,
      config.keyStore ?? config.keyStoreInitializer(c)
    );
    try {
      const idToken = await auth.verifyIdToken(jwt, checkRevoked, {
        FIREBASE_AUTH_EMULATOR_HOST: config.firebaseEmulatorHost ?? c.env.FIREBASE_AUTH_EMULATOR_HOST
      });
      setFirebaseToken(c, idToken);
    } catch (err) {
      if (!userConfig.disableErrorLog) {
        console.error({
          message: "failed to verify the requested firebase token",
          err
        });
      }
      const status = 401;
      throw new HTTPException(status, {
        res: new Response("Unauthorized", { status }),
        message: `failed to verify the requested firebase token: ${String(err)}`,
        cause: err
      });
    }
    await next();
  };
};
var idTokenContextKey = "firebase-auth-cloudflare-id-token-key";
var setFirebaseToken = (c, idToken) => c.set(idTokenContextKey, idToken);
var getFirebaseToken = (c) => {
  const idToken = c.get(idTokenContextKey);
  if (!idToken) {
    return null;
  }
  return idToken;
};
var verifySessionCookieFirebaseAuth = (userConfig) => {
  const config = {
    projectId: userConfig.projectId,
    cookieName: userConfig.cookieName ?? "session",
    keyStore: userConfig.keyStore,
    keyStoreInitializer: userConfig.keyStoreInitializer ?? defaultKeyStoreInitializer,
    firebaseEmulatorHost: userConfig.firebaseEmulatorHost,
    redirects: userConfig.redirects
  };
  const checkRevoked = false;
  return async (c, next) => {
    const auth = Auth.getOrInitialize(
      config.projectId,
      config.keyStore ?? config.keyStoreInitializer(c)
    );
    const session = getCookie(c, config.cookieName);
    if (session === void 0) {
      const status = 302;
      const res = c.redirect(config.redirects.signIn, status);
      throw new HTTPException(status, { res, message: "session is empty" });
    }
    try {
      const idToken = await auth.verifySessionCookie(session, checkRevoked, {
        FIREBASE_AUTH_EMULATOR_HOST: config.firebaseEmulatorHost ?? c.env.FIREBASE_AUTH_EMULATOR_HOST
      });
      setFirebaseToken(c, idToken);
    } catch (err) {
      const status = 302;
      const res = c.redirect(config.redirects.signIn, status);
      throw new HTTPException(status, {
        res,
        message: `failed to verify the requested firebase token: ${String(err)}`,
        cause: err
      });
    }
    await next();
  };
};
export {
  getFirebaseToken,
  verifyFirebaseAuth,
  verifySessionCookieFirebaseAuth
};
