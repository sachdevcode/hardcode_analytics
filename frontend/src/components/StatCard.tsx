interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'default' | 'muted';
}

export function StatCard({ label, value, sub, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={
        'rounded-lg border border-surface-500 bg-surface-800 px-5 py-4 ' +
        (variant === 'muted' ? 'opacity-90' : '')
      }
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sub != null && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
