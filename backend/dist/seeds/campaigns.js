import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config();
import { query, initDb, useSqlite } from '../db/client.js';
const CAMPAIGNS = [
    { id: 'cmp_1', creator_id: 'yt_UCX6OQ3DkcsbYNE6H8uQQuVA', brand: 'Nike', campaign_name: 'Spring 2025 Run', start_date: 1735689600, end_date: 1738368000, spend: 85000, conversions: 1240, status: 'completed' },
    { id: 'cmp_2', creator_id: 'yt_UCuAXFkgsw1L7xaCfnd5JJOw', brand: 'Samsung', campaign_name: 'Galaxy S25 Launch', start_date: 1738195200, end_date: null, spend: 120000, conversions: 890, status: 'active' },
    { id: 'cmp_3', creator_id: 'yt_UCXuqSBlHAE6Xw-yeJA0Tunw', brand: 'Corsair', campaign_name: 'Streamer Setup Q1', start_date: 1733011200, end_date: 1735689600, spend: 45000, conversions: 620, status: 'completed' },
    { id: 'cmp_4', creator_id: 'yt_UC-lHJZR3Gqxm24_Vd_AJ5Yw', brand: 'G Fuel', campaign_name: 'Energy Drink Push', start_date: 1735689600, end_date: null, spend: 95000, conversions: 0, status: 'active' },
    { id: 'cmp_5', creator_id: 'yt_UCs0M1Wb1gLhFmHjRvNnBO2g', brand: 'Razer', campaign_name: 'Unbox Series Integration', start_date: 1730419200, end_date: 1733011200, spend: 32000, conversions: 410, status: 'completed' },
    { id: 'cmp_6', creator_id: 'yt_UCddiUEpeqJcYeBxX1IVBKvQ', brand: 'Microsoft', campaign_name: 'Surface Pro Campaign', start_date: 1738195200, end_date: null, spend: 78000, conversions: 0, status: 'active' },
    { id: 'cmp_7', creator_id: 'yt_UCoOae5nYA7V8X2-U2TV1G1Q', brand: 'Notion', campaign_name: 'Productivity Creator Program', start_date: 1733011200, end_date: 1738368000, spend: 28000, conversions: 1850, status: 'completed' },
    { id: 'cmp_8', creator_id: 'yt_UCDSfZ2cQ9b1Fc2s-OvVgR6g', brand: 'Brilliant', campaign_name: 'Science Education Partnership', start_date: 1735689600, end_date: null, spend: 52000, conversions: 720, status: 'active' },
    { id: 'cmp_9', creator_id: 'yt_UCY1kMZp36IQSyNx_9h4mpCg', brand: 'Discovery', campaign_name: 'Science Show Sponsorship', start_date: 1730419200, end_date: 1735689600, spend: 110000, conversions: 0, status: 'paused' },
    { id: 'cmp_10', creator_id: 'yt_UC8butISFwT-Wl7EV0hUK0BQ', brand: 'Hack Club', campaign_name: 'Learn to Code Initiative', start_date: 1738195200, end_date: null, spend: 15000, conversions: 2100, status: 'active' },
];
const CREATOR_STUBS = [
    { id: 'yt_UCX6OQ3DkcsbYNE6H8uQQuVA', handle: 'MrBeast' },
    { id: 'yt_UCuAXFkgsw1L7xaCfnd5JJOw', handle: 'MKBHD' },
    { id: 'yt_UCXuqSBlHAE6Xw-yeJA0Tunw', handle: 'LinusTechTips' },
    { id: 'yt_UC-lHJZR3Gqxm24_Vd_AJ5Yw', handle: 'PewDiePie' },
    { id: 'yt_UCs0M1Wb1gLhFmHjRvNnBO2g', handle: 'UnboxTherapy' },
    { id: 'yt_UCddiUEpeqJcYeBxX1IVBKvQ', handle: 'TheVerge' },
    { id: 'yt_UCoOae5nYA7V8X2-U2TV1G1Q', handle: 'AliAbdaal' },
    { id: 'yt_UCDSfZ2cQ9b1Fc2s-OvVgR6g', handle: 'Veritasium' },
    { id: 'yt_UCY1kMZp36IQSyNx_9h4mpCg', handle: 'MarkRober' },
    { id: 'yt_UC8butISFwT-Wl7EV0hUK0BQ', handle: 'freeCodeCamp' },
];
export async function seedCampaigns() {
    await initDb();
    const isSqlite = useSqlite();
    const { rows } = await query(isSqlite ? 'SELECT COUNT(*) AS count FROM campaigns' : 'SELECT COUNT(*)::text AS count FROM campaigns');
    if (parseInt(String(rows[0]?.count ?? '0'), 10) > 0)
        return 0;
    const now = Math.floor(Date.now() / 1000);
    for (const cr of CREATOR_STUBS) {
        const ins = isSqlite
            ? 'INSERT OR IGNORE INTO creators (id, platform, handle, created_at) VALUES (?, ?, ?, ?)'
            : 'INSERT INTO creators (id, platform, handle, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING';
        await query(ins, [cr.id, 'youtube', cr.handle, now]);
    }
    for (const c of CAMPAIGNS) {
        await query(isSqlite
            ? `INSERT OR IGNORE INTO campaigns (id, creator_id, brand, campaign_name, start_date, end_date, spend, conversions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            : `INSERT INTO campaigns (id, creator_id, brand, campaign_name, start_date, end_date, spend, conversions, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`, [c.id, c.creator_id, c.brand, c.campaign_name, c.start_date, c.end_date, c.spend, c.conversions, c.status]);
    }
    return CAMPAIGNS.length;
}
