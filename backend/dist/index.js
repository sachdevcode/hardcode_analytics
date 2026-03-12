import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
import express from 'express';
import cors from 'cors';
import { initDb } from './db/client.js';
import { startScheduler } from './ingestion/scheduler.js';
import { seedCampaigns } from './seeds/campaigns.js';
import creatorsRouter from './routes/creators.js';
import analyticsRouter from './routes/analytics.js';
import campaignsRouter from './routes/campaigns.js';
import { errorHandler } from './middleware/errorHandler.js';
const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.use(cors());
app.use(express.json());
app.use('/api/creators', creatorsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use(errorHandler);
async function main() {
    await initDb();
    const seeded = await seedCampaigns();
    if (seeded > 0)
        console.log(`Seeded ${seeded} campaigns.`);
    startScheduler();
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}
main().catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
});
