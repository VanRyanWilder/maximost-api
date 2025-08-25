"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getFirebaseToken: () => getFirebaseToken,
  verifyFirebaseAuth: () => verifyFirebaseAuth,
  verifySessionCookieFirebaseAuth: () => verifySessionCookieFirebaseAuth
});
module.exports = __toCommonJS(src_exports);
var import_firebase_auth_cloudflare_workers = require("firebase-auth-cloudflare-workers");
var import_cookie = require("hono/cookie");
var import_http_exception = require("hono/http-exception");
var defaultKVStoreJWKCacheKey = "verify-firebase-auth-cached-public-key";
var defaultKeyStoreInitializer = (c) => {
  if (c.env.PUBLIC_JWK_CACHE_KV === void 0) {
    const status = 501;
    throw new import_http_exception.HTTPException(status, {
      res: new Response("Not Implemented", { status })
    });
  }
  return import_firebase_auth_cloudflare_workers.WorkersKVStoreSingle.getOrInitialize(
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
      throw new import_http_exception.HTTPException(status, {
        res: new Response("Bad Request", { status }),
        message: "authorization header is empty"
      });
    }
    const jwt = authorization.replace(/Bearer\s+/i, "");
    const auth = import_firebase_auth_cloudflare_workers.Auth.getOrInitialize(
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
      throw new import_http_exception.HTTPException(status, {
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
    const auth = import_firebase_auth_cloudflare_workers.Auth.getOrInitialize(
      config.projectId,
      config.keyStore ?? config.keyStoreInitializer(c)
    );
    const session = (0, import_cookie.getCookie)(c, config.cookieName);
    if (session === void 0) {
      const status = 302;
      const res = c.redirect(config.redirects.signIn, status);
      throw new import_http_exception.HTTPException(status, { res, message: "session is empty" });
    }
    try {
      const idToken = await auth.verifySessionCookie(session, checkRevoked, {
        FIREBASE_AUTH_EMULATOR_HOST: config.firebaseEmulatorHost ?? c.env.FIREBASE_AUTH_EMULATOR_HOST
      });
      setFirebaseToken(c, idToken);
    } catch (err) {
      const status = 302;
      const res = c.redirect(config.redirects.signIn, status);
      throw new import_http_exception.HTTPException(status, {
        res,
        message: `failed to verify the requested firebase token: ${String(err)}`,
        cause: err
      });
    }
    await next();
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getFirebaseToken,
  verifyFirebaseAuth,
  verifySessionCookieFirebaseAuth
});
