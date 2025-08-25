"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.db = exports.auth = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
// IMPORTANT: In a real environment, the service account key should be loaded
// from an environment variable (e.g., GOOGLE_APPLICATION_CREDENTIALS)
// or another secure mechanism. It should NOT be hardcoded or committed.
// const serviceAccount = require("/path/to/your/serviceAccountKey.json"); // Example path
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log("Firebase Admin SDK initialized with GOOGLE_APPLICATION_CREDENTIALS.");
    }
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
        // Alternative: Load from a JSON string in an environment variable
        const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
        });
        console.log("Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_KEY_JSON.");
    }
    else {
        // Fallback for local development if no specific env var is set,
        // though GOOGLE_APPLICATION_CREDENTIALS is standard for Cloud Functions/Run.
        // This will likely only work if the local environment is already authenticated
        // via gcloud CLI with appropriate ADC.
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized with default credentials (ADC or emulators).");
        console.warn("WARN: For production, ensure GOOGLE_APPLICATION_CREDENTIALS or equivalent is set for Firebase Admin SDK.");
    }
}
catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    // Depending on the desired behavior, you might want to exit the process
    // if Firebase Admin SDK cannot be initialized, as it is critical for auth.
    // process.exit(1);
}
exports.auth = admin.auth();
exports.db = admin.firestore();
// Optional: Log Firestore settings if needed
// try {
//   db.settings({ ignoreUndefinedProperties: true });
//   console.log("Firestore ignoreUndefinedProperties set to true.");
// } catch (error) {
//   console.error("Error setting Firestore settings:", error);
// }
//# sourceMappingURL=firebaseAdmin.js.map