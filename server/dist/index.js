"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// bodyParser import removed, using express built-ins
const habitRoutes_1 = __importDefault(require("./routes/habitRoutes")); // Import habit routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Import user routes
// Initialize Firebase Admin SDK - Ensure this is done before routes that need it.
// This import will execute the firebaseAdmin.ts file.
require("./config/firebaseAdmin");
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)()); // Enable CORS for all routes - Already added, ensuring it is here.
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Routes
app.get("/", (req, res) => {
    res.send("Maximost Backend Server is running!");
});
// Mount the habit routes
app.use("/api/habits", habitRoutes_1.default);
// Mount the user routes
app.use("/api/users", userRoutes_1.default);
// Basic 404 handler for routes not found
app.use((req, res, next) => {
    res.status(404).json({ message: "Not Found - The requested resource could not be found on this server." });
});
// Basic Error Handling Middleware (should be last middleware)
// This will catch errors passed by next(error) or unhandled synchronous errors in route handlers
// (though async errors need to be caught and passed to next() explicitly in older Express versions without Express 5 auto async error handling)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack || err); // Log the error stack for debugging
    // Avoid sending stack trace to client in production for security
    const errorResponse = {
        message: err.message || "An unexpected error occurred.",
        // ...(process.env.NODE_ENV === "development" && { stack: err.stack }) // Optionally include stack in dev
    };
    // If headers have already been sent, delegate to the default Express error handler.
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json(errorResponse);
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
//# sourceMappingURL=index.js.map