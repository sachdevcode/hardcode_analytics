# HardScope Creator Analytics

Production-grade creator campaign analytics for HardScope, a media infrastructure company serving brand partnerships teams. The dashboard ingests public YouTube channel statistics, stores time-series snapshots, and surfaces engagement trends, platform breakdowns, and campaign ROI—with server-side alerts for engagement drops and high-spend zero-conversion campaigns.

## Quickstart

**Prerequisites:** Node 20+, PostgreSQL 16 (or use Docker for Postgres).

1. **Clone and install**
   ```bash
   cd hardscope-analytics
   npm install --prefix backend && npm install --prefix frontend
   ```

2. **Database**
   Create a Postgres database and set its URL:
   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL and YOUTUBE_API_KEY
   ```
   Example: `DATABASE_URL=postgresql://user:pass@localhost:5432/hardscope`

3. **Get a YouTube API key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
   - Create an API key and enable **YouTube Data API v3**.
   - Put the key in `.env` as `YOUTUBE_API_KEY=...`. Without it, the server logs a clear error and exits; the scheduler will not run.

4. **Run backend**
   ```bash
   cd backend && npm run dev
   ```
   Tables are created on first run. Campaign seed runs once if the campaigns table is empty. Ingestion runs immediately and then every 6 hours via node-cron.

5. **Run frontend**
   ```bash
   cd frontend && npm run dev
   ```
   Open http://localhost:5173. The Vite proxy forwards `/api` to the backend on port 3001.

**Docker (full stack including Postgres):**
```bash
cp .env.example .env
# Set YOUTUBE_API_KEY in .env
docker compose up --build
```
Backend: http://localhost:3001. Frontend: http://localhost:5173. Postgres: localhost:5432 (user `hardscope`, password `hardscope`, db `hardscope`).

## Data sources

**YouTube Data API v3** — Channels endpoint (`channels?part=statistics,snippet&id={channelId}`). Chosen for free tier, rich public stats (subscribers, viewCount, videoCount), and no OAuth requirement for public channel data. The seed list in `backend/src/ingestion/youtube.ts` uses 17 real public channel IDs across tech (MKBHD, Linus Tech Tips, The Verge, etc.), gaming (PewDiePie, TechWithTim, LazarBeam), education (Veritasium, freeCodeCamp, Net Ninja), lifestyle (Casey Neistat), and finance (Ali Abdaal). You can extend the list in that file.

## Architecture decisions

- **Postgres:** Strong support for analytics queries (window functions, lateral joins), indexes on `creator_id`, `platform`, `fetched_at`, and production-ready tooling. Fits multi-tenant and scaling better than SQLite for a real deployment.
- **Time-series snapshots:** Every ingestion run inserts new snapshot rows; we never overwrite. This enables trend charts, period-over-period comparison, and the ≥20% engagement-drop alert logic.
- **Engagement rate:** Defined as (total views / video count) / subscriber count — i.e. average views per video per subscriber. Surfaces creators whose content is watched relative to audience size.
- **Express:** Simple, well-understood, and sufficient for this scope; middleware and error handling are straightforward. Fastify would be a natural swap for higher throughput if needed.

## Tradeoffs

- **With more time:** Add TimescaleDB (or similar) for native time-series and retention policies; add Redis to cache YouTube API responses and reduce quota; deliver alerts via webhooks (e.g. Slack); normalize multiple platforms (Twitch Helix, Reddit, etc.) into the same creator/snapshot schema.
- **Current limits:** Single platform (YouTube); no auth (dashboard is open); alerts are computed on demand in the summary endpoint rather than pushed.

## What's next

- **Multi-platform ingestion:** Twitch (Helix API), Reddit (public JSON), Instagram (Graph API where applicable), with a single creator/snapshot model.
- **Creator–campaign attribution:** Score creators by fit and performance for a given campaign or brand.
- **Alerting pipeline:** Persist alert rules, run checks on a schedule, and deliver via email or Slack.
- **Authentication:** Multi-tenant access so each brand only sees their campaigns and linked creators.
