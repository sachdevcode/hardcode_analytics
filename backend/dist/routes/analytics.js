import { Router } from 'express';
import { query, useSqlite } from '../db/client.js';
const router = Router();
router.get('/summary', async (_req, res) => {
    const isSqlite = useSqlite();
    const totalSql = isSqlite ? 'SELECT COUNT(*) AS total FROM creators' : 'SELECT COUNT(*)::text AS total FROM creators';
    const { rows: totalRow } = await query(totalSql);
    const totalCreators = parseInt(String(totalRow[0]?.total ?? '0'), 10);
    const platformSql = isSqlite
        ? `
    SELECT c.platform, COUNT(*) AS count, COALESCE(AVG(s.engagement_rate), 0) AS avg_engagement
    FROM creators c
    INNER JOIN (
      SELECT creator_id, engagement_rate FROM snapshots s1
      WHERE fetched_at = (SELECT MAX(fetched_at) FROM snapshots s2 WHERE s2.creator_id = s1.creator_id)
    ) s ON s.creator_id = c.id
    GROUP BY c.platform
  `
        : `
    SELECT c.platform, COUNT(*)::text AS count, COALESCE(AVG(s.engagement_rate), 0)::text AS avg_engagement
    FROM creators c
    INNER JOIN (
      SELECT DISTINCT ON (creator_id) creator_id, engagement_rate
      FROM snapshots ORDER BY creator_id, fetched_at DESC
    ) s ON s.creator_id = c.id
    GROUP BY c.platform
  `;
    const { rows: platformRows } = await query(platformSql);
    const platform_breakdown = platformRows.map((r) => ({
        platform: r.platform,
        count: typeof r.count === 'number' ? r.count : parseInt(String(r.count), 10),
        avg_engagement: typeof r.avg_engagement === 'number' ? r.avg_engagement : parseFloat(String(r.avg_engagement)) || 0,
    }));
    const topSql = isSqlite
        ? `
    SELECT c.id AS creator_id, c.handle, s.engagement_rate
    FROM creators c
    INNER JOIN (
      SELECT creator_id, engagement_rate FROM snapshots s1
      WHERE fetched_at = (SELECT MAX(fetched_at) FROM snapshots s2 WHERE s2.creator_id = s1.creator_id)
    ) s ON s.creator_id = c.id
    WHERE s.engagement_rate IS NOT NULL
    ORDER BY s.engagement_rate DESC
    LIMIT 5
  `
        : `
    SELECT c.id AS creator_id, c.handle, s.engagement_rate::text
    FROM creators c
    INNER JOIN (
      SELECT DISTINCT ON (creator_id) creator_id, engagement_rate
      FROM snapshots ORDER BY creator_id, fetched_at DESC
    ) s ON s.creator_id = c.id
    WHERE s.engagement_rate IS NOT NULL
    ORDER BY s.engagement_rate DESC
    LIMIT 5
  `;
    const { rows: topRows } = await query(topSql);
    const top_performers = topRows.map((r) => ({
        creator_id: r.creator_id,
        handle: r.handle,
        engagement_rate: typeof r.engagement_rate === 'number' ? r.engagement_rate : parseFloat(String(r.engagement_rate)) || 0,
    }));
    const alertsSql = `
    WITH ranked AS (
      SELECT creator_id, engagement_rate, fetched_at,
             LAG(engagement_rate) OVER (PARTITION BY creator_id ORDER BY fetched_at ASC) AS prev_engagement
      FROM snapshots
    ),
    latest_two AS (
      SELECT creator_id, engagement_rate AS curr_engagement, prev_engagement,
             ROW_NUMBER() OVER (PARTITION BY creator_id ORDER BY fetched_at DESC) AS rn
      FROM ranked
      WHERE prev_engagement IS NOT NULL AND engagement_rate IS NOT NULL AND prev_engagement > 0
    )
    SELECT l.creator_id, c.handle, l.prev_engagement, l.curr_engagement
    FROM latest_two l
    JOIN creators c ON c.id = l.creator_id
    WHERE l.rn = 1 AND (l.prev_engagement - l.curr_engagement) / l.prev_engagement >= 0.20
  `;
    const { rows: snapshotRows } = await query(alertsSql);
    const alerts = snapshotRows.map((r) => {
        const prev = parseFloat(String(r.prev_engagement ?? '0'));
        const curr = parseFloat(String(r.curr_engagement ?? '0'));
        const dropPercent = prev > 0 ? ((prev - curr) / prev) * 100 : 0;
        return {
            creator_id: r.creator_id,
            handle: r.handle,
            previous_engagement: prev,
            current_engagement: curr,
            drop_percent: Math.round(dropPercent * 100) / 100,
            alert_type: 'engagement_drop',
        };
    });
    res.json({
        total_creators: totalCreators,
        platform_breakdown,
        top_performers,
        alerts,
    });
});
router.get('/trend/:creatorId', async (req, res) => {
    const { creatorId } = req.params;
    const isSqlite = useSqlite();
    const sql = isSqlite
        ? `SELECT id, fetched_at, subscribers, views_total, video_count, avg_views_30d, engagement_rate FROM snapshots WHERE creator_id = ? ORDER BY fetched_at ASC`
        : `SELECT id, fetched_at, subscribers, views_total, video_count, avg_views_30d, engagement_rate FROM snapshots WHERE creator_id = $1 ORDER BY fetched_at ASC`;
    const { rows } = await query(sql, [creatorId]);
    const data = rows.map((r) => ({
        id: r.id,
        fetched_at: typeof r.fetched_at === 'number' ? r.fetched_at : parseInt(String(r.fetched_at), 10),
        subscribers: r.subscribers != null ? (typeof r.subscribers === 'number' ? r.subscribers : parseInt(String(r.subscribers), 10)) : null,
        views_total: r.views_total != null ? (typeof r.views_total === 'number' ? r.views_total : parseInt(String(r.views_total), 10)) : null,
        video_count: r.video_count != null ? (typeof r.video_count === 'number' ? r.video_count : parseInt(String(r.video_count), 10)) : null,
        avg_views_30d: r.avg_views_30d != null ? (typeof r.avg_views_30d === 'number' ? r.avg_views_30d : parseFloat(String(r.avg_views_30d))) : null,
        engagement_rate: r.engagement_rate != null ? (typeof r.engagement_rate === 'number' ? r.engagement_rate : parseFloat(String(r.engagement_rate))) : null,
    }));
    res.json(data);
});
export default router;
