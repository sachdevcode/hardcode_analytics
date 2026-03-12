import cron from 'node-cron';
import { runIngestion } from './youtube.js';
export function startScheduler() {
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) {
        console.error('YOUTUBE_API_KEY is missing. Scheduler will not run.');
        return;
    }
    runIngestion(apiKey)
        .then((count) => {
        console.log(`[${new Date().toISOString()}] Initial ingestion complete. Creators updated: ${count}`);
    })
        .catch((err) => {
        console.error(`[${new Date().toISOString()}] Initial ingestion failed:`, err);
    });
    cron.schedule('0 */6 * * *', () => {
        const ts = new Date().toISOString();
        runIngestion(apiKey)
            .then((count) => {
            console.log(`[${ts}] Scheduled ingestion complete. Creators updated: ${count}`);
        })
            .catch((err) => {
            console.error(`[${ts}] Scheduled ingestion failed:`, err);
        });
    });
}
