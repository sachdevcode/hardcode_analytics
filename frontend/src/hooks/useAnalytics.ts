import { useState, useEffect, useCallback } from 'react';
import {
  fetchSummary,
  fetchCreators,
  fetchTrend,
  fetchCampaigns,
  type AnalyticsSummary,
  type CreatorRow,
  type SnapshotPoint,
  type CampaignRow,
} from '../lib/api';

export function useAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [trendCreatorId, setTrendCreatorId] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<SnapshotPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c, camp] = await Promise.all([
        fetchSummary(),
        fetchCreators({ limit: 100 }),
        fetchCampaigns(),
      ]);
      setSummary(s);
      setCreators(c);
      setCampaigns(camp);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!trendCreatorId) {
      setTrendData([]);
      return;
    }
    let cancelled = false;
    fetchTrend(trendCreatorId).then(
      (data) => {
        if (!cancelled) setTrendData(data);
      },
      () => {
        if (!cancelled) setTrendData([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [trendCreatorId]);

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const alertCount = (summary?.alerts?.length ?? 0) + campaigns.filter((c) => c.alert).length;

  return {
    summary,
    creators,
    campaigns,
    trendCreatorId,
    setTrendCreatorId,
    trendData,
    loading,
    error,
    lastFetched,
    retry: load,
    activeCampaigns,
    alertCount,
  };
}
