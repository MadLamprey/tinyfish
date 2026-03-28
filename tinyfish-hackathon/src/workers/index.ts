/**
 * Combined worker entry point.
 * Starts all BullMQ workers in a single process.
 *
 *   npm run workers
 */
import "./scrapeWorker";
import "./normalizeWorker";
import "./recommendationWorker";

console.log("[workers] scrape, normalize, recommendations — all listening");
