import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import type { MonthlyRevenue } from '../../data/demoReports';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

const formatDollar = (value: number) => `$${(value / 1000).toFixed(0)}k`;

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
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
          formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, 'Revenue']}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#16a34a' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
