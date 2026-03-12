import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface SnapshotPoint {
  id: number;
  fetched_at: number;
  subscribers: number | null;
  views_total: number | null;
  engagement_rate: number | null;
}

interface EngagementTrendProps {
  data: SnapshotPoint[];
  creatorHandle: string | null;
}

export function EngagementTrend({ data, creatorHandle }: EngagementTrendProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.fetched_at * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    }),
    rate: d.engagement_rate ?? 0,
  }));
  return (
    <div className="h-[280px] w-full">
      {creatorHandle && (
        <p className="mb-2 text-sm text-zinc-500">Engagement trend: {creatorHandle}</p>
      )}
      {chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-lg border border-surface-500 bg-surface-800 text-zinc-500">
          {creatorHandle ? 'No snapshot history' : 'Select a creator to view trend'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#363c45" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1 ? `${v.toFixed(1)}` : v.toFixed(2))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1d21',
                border: '1px solid #363c45',
                borderRadius: '6px',
              }}
              labelStyle={{ color: '#e5e7eb' }}
              formatter={(value: number) => [value.toFixed(4), 'Engagement rate']}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
