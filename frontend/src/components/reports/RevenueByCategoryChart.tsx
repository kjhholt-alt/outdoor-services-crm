import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { RevenueByCategory } from '../../data/demoReports';

interface RevenueByCategoryChartProps {
  data: RevenueByCategory[];
}

const formatDollar = (value: number) => `$${(value / 1000).toFixed(0)}k`;

export function RevenueByCategoryChart({ data }: RevenueByCategoryChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatDollar}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
          width={100}
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
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={24}>
          {sorted.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
