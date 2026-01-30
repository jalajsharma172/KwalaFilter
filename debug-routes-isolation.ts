
// Import routes.ts which imports logListener.ts
// This simulates the import side-effect of index-dev.ts -> app.ts -> routes.ts
import { registerRoutes } from "./server/routes.js";
import express from "express";
import { config } from "./server/config.js";

console.log("Starting Debug Routes/Listeners...");
console.log("RPC_URL Configured:", config.RPC_URL ? "YES" : "NO");

try {
    const app = express();
    registerRoutes(app).then(() => {
        console.log("Routes registered. This should have triggered logListener imports.");

        // Keep alive for a bit
        setTimeout(() => {
            console.log("Test complete. No crash during import/setup.");
            process.exit(0);
        }, 10000);
    }).catch(e => {
        console.error("registerRoutes failed:", e);
    });

} catch (e) {
    console.error("Crash during startup:", e);
}

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection:", reason);
    process.exit(1);
});
