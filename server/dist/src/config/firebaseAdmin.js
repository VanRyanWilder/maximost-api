import * as admin from "firebase-admin";
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
export const auth = admin.auth();
export const db = admin.firestore();
export { admin }; // Export the admin namespace itself
// Optional: Log Firestore settings if needed
// try {
//   db.settings({ ignoreUndefinedProperties: true });
//   console.log("Firestore ignoreUndefinedProperties set to true.");
// } catch (error) {
//   console.error("Error setting Firestore settings:", error);
// }
