"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.honoProtectWithFirebase = exports.protectWithFirebase = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const protectWithFirebase = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided or invalid format." });
    }
    const idToken = authorizationHeader.split("Bearer ")[1];
    if (!idToken) {
        return res.status(401).json({ message: "Unauthorized: Token is missing after Bearer prefix." });
    }
    try {
        const decodedToken = yield firebaseAdmin_1.auth.verifyIdToken(idToken);
        req.user = decodedToken; // Attach user payload to request
        next(); // Token is valid, proceed to the next middleware or route handler
    }
    catch (error) { // Cast error to any to access properties like 'code'
        console.error("Error verifying Firebase ID token:", error);
        if (error.code === "auth/id-token-expired") {
            return res.status(401).json({ message: "Unauthorized: Token expired." });
        }
        return res.status(403).json({ message: "Forbidden: Invalid token." });
    }
});
exports.protectWithFirebase = protectWithFirebase;
// Use HonoCtx<AuthEnv> for typed context
const honoProtectWithFirebase = (c, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Unauthorized: No token provided or invalid format.' }, 401);
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        return c.json({ message: 'Unauthorized: Token is missing after Bearer prefix.' }, 401);
    }
    try {
        const decodedToken = yield firebaseAdmin_1.auth.verifyIdToken(idToken); // Use 'auth' from the top of the file
        c.set('user', decodedToken);
        yield next();
    }
    catch (error) { // Cast error to any to access .code and .message
        console.error('Error verifying Firebase ID token for Hono:', error);
        if (error.code === 'auth/id-token-expired') {
            return c.json({ message: 'Unauthorized: Token expired.' }, 401);
        }
        return c.json({ message: 'Forbidden: Invalid token.', errorDetail: error.message }, 403);
    }
});
exports.honoProtectWithFirebase = honoProtectWithFirebase;
//# sourceMappingURL=authMiddleware.js.map