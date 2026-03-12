import { Router } from 'express';
import { query, useSqlite } from '../db/client.js';
const router = Router();
function buildCreatorsQuery(conditions, params, limit, offset, isSqlite) {
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const p = [...params, limit, offset];
    if (isSqlite) {
        const subquery = `
      SELECT s.creator_id, s.fetched_at, s.subscribers, s.views_total, s.video_count, s.avg_views_30d, s.engagement_rate
      FROM snapshots s
      INNER JOIN (SELECT creator_id, MAX(fetched_at) AS m FROM snapshots GROUP BY creator_id) t
      ON s.creator_id = t.creator_id AND s.fetched_at = t.m
    `;
        const sql = `
    SELECT c.id, c.platform, c.handle, c.display_name, c.channel_id, c.category, c.created_at,
           s.fetched_at AS last_fetched_at, s.subscribers, s.views_total, s.video_count, s.avg_views_30d, s.engagement_rate
    FROM creators c
    INNER JOIN (${subquery}) s ON s.creator_id = c.id
    ${where}
    ORDER BY s.subscribers DESC
    LIMIT ? OFFSET ?
  `;
        return { sql, params: p };
    }
    const idx = p.length - 1;
    const sql = `
    SELECT c.id, c.platform, c.handle, c.display_name, c.channel_id, c.category, c.created_at,
           s.fetched_at AS last_fetched_at, s.subscribers, s.views_total, s.video_count, s.avg_views_30d, s.engagement_rate
    FROM creators c
    INNER JOIN (
      SELECT DISTINCT ON (creator_id) creator_id, fetched_at, subscribers, views_total, video_count, avg_views_30d, engagement_rate
      FROM snapshots
      ORDER BY creator_id, fetched_at DESC
    ) s ON s.creator_id = c.id
    ${where}
    ORDER BY s.subscribers DESC NULLS LAST
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
    return { sql, params: p };
}
router.get('/', async (req, res) => {
    const platform = req.query.platform;
    const minSubscribers = req.query.min_subscribers;
    const maxSubscribers = req.query.max_subscribers;
    const category = req.query.category;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const conditions = [];
    const params = [];
    let idx = 1;
    const isSqlite = useSqlite();
    if (platform) {
        conditions.push(isSqlite ? 'c.platform = ?' : `c.platform = $${idx++}`);
        params.push(platform);
    }
    if (minSubscribers !== undefined && minSubscribers !== '') {
        const n = parseInt(minSubscribers, 10);
        if (!Number.isNaN(n)) {
            conditions.push(isSqlite ? 's.subscribers >= ?' : `s.subscribers >= $${idx++}`);
            params.push(n);
        }
    }
    if (maxSubscribers !== undefined && maxSubscribers !== '') {
        const n = parseInt(maxSubscribers, 10);
        if (!Number.isNaN(n)) {
            conditions.push(isSqlite ? 's.subscribers <= ?' : `s.subscribers <= $${idx++}`);
            params.push(n);
        }
    }
    if (category) {
        conditions.push(isSqlite ? 'c.category = ?' : `c.category = $${idx++}`);
        params.push(category);
    }
    const { sql, params: p } = buildCreatorsQuery(conditions, params, limit, offset, isSqlite);
    const { rows } = await query(sql, p);
    res.json(rows);
});
export default router;
