import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { MonthlyRevenue } from '../../data/demoReports';

interface SeasonalTrendsChartProps {
  data2025: MonthlyRevenue[];
  data2024: MonthlyRevenue[];
}

const formatDollar = (value: number) => `$${(value / 1000).toFixed(0)}k`;

export function SeasonalTrendsChart({ data2025, data2024 }: SeasonalTrendsChartProps) {
  const combined = data2025.map((m, i) => ({
    month: m.month,
    revenue2025: m.revenue,
    revenue2024: data2024[i]?.revenue ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={combined} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="seasonal2025" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatDollar}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
          formatter={(value: number | undefined, name: string | undefined) => [
            `$${(value ?? 0).toLocaleString()}`,
            name === 'revenue2025' ? '2025' : '2024',
          ]}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-gray-400 text-sm">
              {value === 'revenue2025' ? '2025' : '2024'}
            </span>
          )}
        />
        <Area
          type="monotone"
          dataKey="revenue2024"
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="transparent"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="revenue2025"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#seasonal2025)"
          dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
