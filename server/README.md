# Maximost Backend Server

This directory contains the Node.js/Express backend server for the Maximost application. It provides API endpoints for managing user data, habits, and other application functionalities.

## Prerequisites

- Node.js (v18.x or later recommended)
- npm (usually comes with Node.js)
- Access to a Google Cloud Project with Firestore and Firebase Authentication enabled.

## Setup

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Configuration

The server requires Firebase Admin SDK credentials to interact with Firebase services (Authentication, Firestore).

There are a few ways to provide these credentials:

1.  **Using `GOOGLE_APPLICATION_CREDENTIALS` (Recommended for Cloud Run/Functions):**
    Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the absolute path of your Firebase service account key JSON file.
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
    ```
    This is the standard way Google Cloud services find credentials.

2.  **Using `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`:**
    Alternatively, you can set the `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` environment variable to the JSON content of your service account key.
    ```bash
    export FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type": "service_account", ...}'
    ```
    The `server/src/config/firebaseAdmin.ts` file is configured to attempt initialization using these environment variables.

3.  **Application Default Credentials (ADC) for Local Development:**
    If you are developing locally and have authenticated with Google Cloud CLI (`gcloud auth application-default login`), the Firebase Admin SDK might be able to pick up these credentials automatically if the above environment variables are not set.

**Important:** Do **not** commit your service account key JSON file directly to the repository. Use environment variables to supply credentials securely.

## Available Scripts

In the `server/` directory, you can run the following scripts:

-   **`npm run dev`**: Starts the server in development mode using `nodemon`. The server will automatically restart when file changes are detected. TypeScript files are compiled on the fly.
    ```bash
    npm run dev
    ```

-   **`npm run build`**: Compiles the TypeScript code from `src/` to JavaScript in `dist/`.
    ```bash
    npm run build
    ```

-   **`npm start`**: Starts the server from the compiled JavaScript code in `dist/`. You must run `npm run build` before this script can be used successfully.
    ```bash
    npm start
    ```

The server typically runs on port 8080, but this can be configured via the `PORT` environment variable.

## API Endpoints

Currently implemented habit-related endpoints (all require Firebase Authentication Bearer token):

-   `GET /api/habits`: Fetches active habits for the authenticated user.
-   `POST /api/habits`: Creates a new habit for the authenticated user.
-   `POST /api/habits/:habitId/complete`: Marks a specific habit as complete for the current day.
-   `DELETE /api/habits/:habitId`: Archives a specific habit (sets `isActive` to `false`).
