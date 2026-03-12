import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff0000',
  twitch: '#9146ff',
  instagram: '#e4405f',
};

interface PlatformBreakdownProps {
  data: { platform: string; count: number; avg_engagement: number }[];
}

export function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  const chartData = data.map((d) => ({
    name: d.platform,
    count: d.count,
    avgEngagement: d.avg_engagement,
    fill: PLATFORM_COLORS[d.platform] ?? '#6b7280',
  }));
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={false}
            tickFormatter={(v) => String(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1d21',
              border: '1px solid #363c45',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(value: number) => [value, '']}
            labelFormatter={(label) => `Platform: ${label}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
