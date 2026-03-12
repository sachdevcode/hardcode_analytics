import { StatCard } from './components/StatCard';
import { AlertBanner } from './components/AlertBanner';
import { CreatorTable } from './components/CreatorTable';
import { PlatformBreakdown } from './components/PlatformBreakdown';
import { EngagementTrend } from './components/EngagementTrend';
import { useAnalytics } from './hooks/useAnalytics';

export default function App() {
  const {
    summary,
    creators,
    trendCreatorId,
    setTrendCreatorId,
    trendData,
    loading,
    error,
    lastFetched,
    retry,
    activeCampaigns,
    alertCount,
  } = useAnalytics();

  const selectedHandle = trendCreatorId
    ? creators.find((c) => c.id === trendCreatorId)?.handle ?? null
    : null;

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-surface-700" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-800" />
            ))}
          </div>
          <div className="mt-8 h-64 animate-pulse rounded-lg bg-surface-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="rounded-lg border border-rose-500/50 bg-surface-800 p-6 text-center">
          <p className="text-rose-400">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded border border-surface-500 bg-surface-700 px-4 py-2 text-sm font-medium text-white hover:bg-surface-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const avgEngagement =
    summary?.platform_breakdown?.length &&
    summary.platform_breakdown.reduce(
      (a: number, p: { count: number; avg_engagement: number }) => a + p.avg_engagement * p.count,
      0
    ) /
      (summary?.platform_breakdown?.reduce(
        (a: number, p: { count: number }) => a + p.count,
        0
      ) ?? 1);
  const avgEngagementStr =
    avgEngagement != null && !Number.isNaN(avgEngagement)
      ? avgEngagement >= 0.01
        ? avgEngagement.toFixed(2)
        : avgEngagement.toFixed(4)
      : '—';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-white">
            HardScope Creator Analytics
          </h1>
          {lastFetched && (
            <p className="text-xs text-zinc-500">
              Data fetched {lastFetched.toLocaleTimeString()}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Creators"
            value={summary?.total_creators ?? 0}
            variant="default"
          />
          <StatCard
            label="Avg Engagement Rate"
            value={avgEngagementStr}
            variant="default"
          />
          <StatCard
            label="Active Campaigns"
            value={activeCampaigns.length}
            variant="default"
          />
          <StatCard
            label="Alerts"
            value={alertCount}
            sub={alertCount > 0 ? 'Engagement drop + high-spend no conversion' : undefined}
            variant={alertCount > 0 ? 'default' : 'muted'}
          />
        </div>

        {summary?.alerts?.length ? (
          <div className="mt-4">
            <AlertBanner alerts={summary.alerts} onRetry={retry} />
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Creators
          </h2>
          <CreatorTable
            creators={creators}
            onSelectCreator={(id: string) => setTrendCreatorId(id)}
            selectedCreatorId={trendCreatorId}
          />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-surface-500 bg-surface-800 p-4">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Platform Breakdown
            </h2>
            <PlatformBreakdown
              data={summary?.platform_breakdown ?? []}
            />
          </div>
          <div className="rounded-lg border border-surface-500 bg-surface-800 p-4">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Engagement Trend
            </h2>
            <EngagementTrend data={trendData} creatorHandle={selectedHandle} />
          </div>
        </div>
      </div>
    </div>
  );
}
