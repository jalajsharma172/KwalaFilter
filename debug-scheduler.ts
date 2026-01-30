
import { startScheduler } from "./server/scheduler.js";
import { config } from "./server/config.js";

console.log("Starting Debug Scheduler...");
console.log("RPC_URL Configured:", config.RPC_URL ? "YES" : "NO");

try {
    startScheduler();
    console.log("Scheduler started. Waiting for 30 seconds...");

    setTimeout(() => {
        console.log("Test complete. Scheduler kept running.");
        process.exit(0);
    }, 30000);
} catch (e) {
    console.error("Scheduler crashed synchronously:", e);
}

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
});
