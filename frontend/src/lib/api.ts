const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

export interface CreatorRow {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  channel_id: string | null;
  category: string | null;
  created_at: number | null;
  last_fetched_at: number | null;
  subscribers: number | null;
  views_total: number | null;
  video_count: number | null;
  avg_views_30d: number | null;
  engagement_rate: number | null;
}

export interface CreatorsParams {
  platform?: string;
  min_subscribers?: number;
  max_subscribers?: number;
  category?: string;
  limit?: number;
  offset?: number;
}

export async function fetchCreators(params: CreatorsParams = {}): Promise<CreatorRow[]> {
  const q = new URLSearchParams();
  if (params.platform) q.set('platform', params.platform);
  if (params.min_subscribers != null) q.set('min_subscribers', String(params.min_subscribers));
  if (params.max_subscribers != null) q.set('max_subscribers', String(params.max_subscribers));
  if (params.category) q.set('category', params.category);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const res = await fetch(`${API_BASE}/creators?${q}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SummaryAlert {
  creator_id: string;
  handle: string;
  previous_engagement: number;
  current_engagement: number;
  drop_percent: number;
  alert_type: string;
}

export interface PlatformBreakdownItem {
  platform: string;
  count: number;
  avg_engagement: number;
}

export interface TopPerformer {
  creator_id: string;
  handle: string;
  engagement_rate: number;
}

export interface AnalyticsSummary {
  total_creators: number;
  platform_breakdown: PlatformBreakdownItem[];
  top_performers: TopPerformer[];
  alerts: SummaryAlert[];
}

export async function fetchSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SnapshotPoint {
  id: number;
  fetched_at: number;
  subscribers: number | null;
  views_total: number | null;
  video_count: number | null;
  avg_views_30d: number | null;
  engagement_rate: number | null;
}

export async function fetchTrend(creatorId: string): Promise<SnapshotPoint[]> {
  const res = await fetch(`${API_BASE}/analytics/trend/${encodeURIComponent(creatorId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CampaignRow {
  id: string;
  creator_id: string;
  brand: string;
  campaign_name: string | null;
  start_date: number | null;
  end_date: number | null;
  spend: number | null;
  conversions: number | null;
  status: string | null;
  handle: string;
  subscribers: number | null;
  views_total: number | null;
  engagement_rate: number | null;
  roi: number | null;
  alert: boolean;
}

export async function fetchCampaigns(): Promise<CampaignRow[]> {
  const res = await fetch(`${API_BASE}/campaigns`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
