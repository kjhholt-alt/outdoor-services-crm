import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CrewMember } from '../../data/demoReports';

interface CrewProductivityChartProps {
  data: CrewMember[];
}

export function CrewProductivityChart({ data }: CrewProductivityChartProps) {
  // Scale revenue to hundreds for visual balance with job counts
  const chartData = data.map((c) => ({
    name: c.name,
    jobs: c.jobs,
    revenue: c.revenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#4b5563' }}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
          formatter={(value: number | undefined, name: string | undefined) => {
            const v = value ?? 0;
            if (name === 'revenue') return [`$${v.toLocaleString()}`, 'Revenue'];
            return [v, 'Jobs'];
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-gray-400 text-sm">
              {value === 'jobs' ? 'Jobs' : 'Revenue ($)'}
            </span>
          )}
        />
        <Bar dataKey="jobs" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
        <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
