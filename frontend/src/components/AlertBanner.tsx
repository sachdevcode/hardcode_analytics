import type { SummaryAlert } from '../lib/api';

interface AlertBannerProps {
  alerts: SummaryAlert[];
  onRetry?: () => void;
}

export function AlertBanner({ alerts, onRetry }: AlertBannerProps) {
  if (!alerts?.length) return null;
  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-amber-200">
          Engagement drop ≥20%: {alerts.map((a) => a.handle).join(', ')}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/30"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
