export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  channel_id TEXT,
  category TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS snapshots (
  id SERIAL PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  fetched_at BIGINT NOT NULL,
  subscribers BIGINT,
  views_total BIGINT,
  video_count INTEGER,
  avg_views_30d REAL,
  engagement_rate REAL,
  raw_json TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  campaign_name TEXT,
  start_date BIGINT,
  end_date BIGINT,
  spend REAL,
  conversions INTEGER,
  status TEXT
);

CREATE INDEX IF NOT EXISTS idx_snapshots_creator_id ON snapshots(creator_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_fetched_at ON snapshots(fetched_at);
CREATE INDEX IF NOT EXISTS idx_creators_platform ON creators(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
`;
