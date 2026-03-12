const YOUTUBE_CHANNEL_SEED = [
    { channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA', handle: 'MrBeast', category: 'entertainment' },
    { channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', handle: 'PewDiePie', category: 'gaming' },
    { channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw', handle: 'MKBHD', category: 'tech' },
    { channelId: 'UCXuqSBlHAE6Xw-yeJA0Tunw', handle: 'LinusTechTips', category: 'tech' },
    { channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', handle: 'GoogleDevelopers', category: 'tech' },
    { channelId: 'UCDSfZ2cQ9b1Fc2s-OvVgR6g', handle: 'Veritasium', category: 'education' },
    { channelId: 'UCY1kMZp36IQSyNx_9h4mpCg', handle: 'MarkRober', category: 'science' },
    { channelId: 'UCs0M1Wb1gLhFmHjRvNnBO2g', handle: 'UnboxTherapy', category: 'tech' },
    { channelId: 'UCddiUEpeqJcYeBxX1IVBKvQ', handle: 'TheVerge', category: 'tech' },
    { channelId: 'UCVHFbqXqoYvEWM1Ddxl0QKg', handle: 'Dave2D', category: 'tech' },
    { channelId: 'UC8Q7XEy86Q7T-3kNpNjVgwA', handle: 'CaseyNeistat', category: 'lifestyle' },
    { channelId: 'UCoOae5nYA7V8X2-U2TV1G1Q', handle: 'AliAbdaal', category: 'finance' },
    { channelId: 'UC8butISFwT-Wl7EV0hUK0BQ', handle: 'freeCodeCamp', category: 'education' },
    { channelId: 'UC3gNmTux-tbG3o6F3NcODag', handle: 'TechWithTim', category: 'gaming' },
    { channelId: 'UCFQMnBA3CS502aghlcr0_aw', handle: 'FilmTheory', category: 'entertainment' },
    { channelId: 'UCW5YeuFMltSFv7YKjGV4Swg', handle: 'NetNinja', category: 'education' },
    { channelId: 'UCBJycsmduvYEL83R_U4JriQ', handle: 'LazarBeam', category: 'gaming' },
];
const BASE_URL = 'https://www.googleapis.com/youtube/v3/channels';
function parseNum(s) {
    if (s === undefined || s === '')
        return null;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
}
async function fetchWithBackoff(url, retries = 3) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);
            const body = await res.text();
            if (res.status === 403 || res.status === 429) {
                lastError = new Error(`YouTube API rate limit/forbidden: ${res.status} ${body}`);
                if (attempt < retries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise((r) => setTimeout(r, delay));
                }
                continue;
            }
            let data;
            try {
                data = JSON.parse(body);
            }
            catch {
                return { ok: res.ok, status: res.status, body };
            }
            return { ok: res.ok, status: res.status, body, data };
        }
        catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
    throw lastError ?? new Error('Unknown error');
}
export async function fetchChannelStats(apiKey, channelId, handle, category) {
    const url = `${BASE_URL}?part=statistics,snippet&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
    const { ok, status, body, data } = await fetchWithBackoff(url);
    if (!ok) {
        console.error(`YouTube API error for channel ${channelId}: ${status} ${body}`);
        return null;
    }
    const items = data?.items;
    if (!items?.length)
        return null;
    const ch = items[0];
    const stats = ch.statistics;
    const snippet = ch.snippet;
    const subscribers = parseNum(stats?.subscriberCount);
    const viewsTotal = parseNum(stats?.viewCount);
    const videoCount = parseNum(stats?.videoCount);
    let avgViews30d = null;
    let engagementRate = null;
    if (subscribers != null && subscribers > 0 && viewsTotal != null && videoCount != null && videoCount > 0) {
        const avgViewsPerVideo = viewsTotal / videoCount;
        engagementRate = avgViewsPerVideo / subscribers;
        avgViews30d = avgViewsPerVideo;
    }
    const displayName = snippet?.title ?? snippet?.customUrl ?? null;
    const creatorId = `yt_${channelId}`;
    return {
        creatorId,
        displayName,
        handle,
        channelId,
        subscribers,
        viewsTotal,
        videoCount,
        avgViews30d,
        engagementRate,
        rawJson: body,
    };
}
export function getSeedChannels() {
    return [...YOUTUBE_CHANNEL_SEED];
}
export async function runIngestion(apiKey) {
    if (!apiKey?.trim()) {
        console.error('YOUTUBE_API_KEY is missing. Set it in .env and restart.');
        process.exit(1);
    }
    const { query } = await import('../db/client.js');
    const seed = getSeedChannels();
    let updated = 0;
    const now = Math.floor(Date.now() / 1000);
    for (const { channelId, handle, category } of seed) {
        const fetched = await fetchChannelStats(apiKey, channelId, handle, category);
        if (!fetched)
            continue;
        await query(`INSERT INTO creators (id, platform, handle, display_name, channel_id, category, created_at)
       VALUES ($1, 'youtube', $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         handle = EXCLUDED.handle,
         display_name = EXCLUDED.display_name,
         channel_id = EXCLUDED.channel_id,
         category = EXCLUDED.category`, [fetched.creatorId, fetched.handle, fetched.displayName, fetched.channelId, category, now]);
        await query(`INSERT INTO snapshots (creator_id, fetched_at, subscribers, views_total, video_count, avg_views_30d, engagement_rate, raw_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            fetched.creatorId,
            now,
            fetched.subscribers,
            fetched.viewsTotal,
            fetched.videoCount,
            fetched.avgViews30d,
            fetched.engagementRate,
            fetched.rawJson,
        ]);
        updated++;
    }
    return updated;
}
