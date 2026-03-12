import { Router } from 'express';
import { query, useSqlite } from '../db/client.js';
const router = Router();
router.get('/', async (_req, res) => {
    const isSqlite = useSqlite();
    const campaignsSql = isSqlite
        ? `
    SELECT cam.id, cam.creator_id, cam.brand, cam.campaign_name, cam.start_date, cam.end_date,
           cam.spend, cam.conversions, cam.status,
           c.handle,
           s.subscribers, s.views_total, s.engagement_rate
    FROM campaigns cam
    JOIN creators c ON c.id = cam.creator_id
    LEFT JOIN (
      SELECT creator_id, subscribers, views_total, engagement_rate
      FROM snapshots s1
      WHERE fetched_at = (SELECT MAX(fetched_at) FROM snapshots s2 WHERE s2.creator_id = s1.creator_id)
    ) s ON s.creator_id = cam.creator_id
    ORDER BY cam.start_date DESC
  `
        : `
    SELECT cam.id, cam.creator_id, cam.brand, cam.campaign_name, cam.start_date, cam.end_date,
           cam.spend, cam.conversions, cam.status,
           c.handle,
           s.subscribers, s.views_total, s.engagement_rate
    FROM campaigns cam
    JOIN creators c ON c.id = cam.creator_id
    LEFT JOIN LATERAL (
      SELECT subscribers, views_total, engagement_rate
      FROM snapshots
      WHERE creator_id = cam.creator_id
      ORDER BY fetched_at DESC
      LIMIT 1
    ) s ON true
    ORDER BY cam.start_date DESC NULLS LAST
  `;
    const { rows } = await query(campaignsSql);
    const campaigns = rows.map((r) => {
        const spend = r.spend != null ? parseFloat(r.spend) : null;
        const conversions = r.conversions != null ? parseInt(r.conversions, 10) : null;
        const roi = spend != null && spend > 0 && conversions != null ? conversions / spend : null;
        const alert = spend != null && spend > 1000 && (conversions == null || conversions === 0);
        return {
            id: r.id,
            creator_id: r.creator_id,
            brand: r.brand,
            campaign_name: r.campaign_name,
            start_date: r.start_date != null ? parseInt(r.start_date, 10) : null,
            end_date: r.end_date != null ? parseInt(r.end_date, 10) : null,
            spend,
            conversions,
            status: r.status,
            handle: r.handle,
            subscribers: r.subscribers != null ? parseInt(r.subscribers, 10) : null,
            views_total: r.views_total != null ? parseInt(r.views_total, 10) : null,
            engagement_rate: r.engagement_rate != null ? parseFloat(r.engagement_rate) : null,
            roi,
            alert,
        };
    });
    res.json(campaigns);
});
export default router;
