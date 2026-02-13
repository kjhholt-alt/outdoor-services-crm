import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts';
import type { JobsByStatus } from '../../data/demoReports';

interface JobsByStatusChartProps {
  data: JobsByStatus[];
}

function CenterLabel({ viewBox, total }: { viewBox?: { cx?: number; cy?: number }; total: number }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" fill="#f9fafb" fontSize="24" fontWeight="bold">
        {total}
      </tspan>
      <tspan x={cx} dy="1.5em" fill="#9ca3af" fontSize="12">
        Total Jobs
      </tspan>
    </text>
  );
}

export function JobsByStatusChart({ data }: JobsByStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="count"
          nameKey="status"
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <CenterLabel total={total} />
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
          formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, name ?? '']}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value: string) => (
            <span className="text-gray-400 text-sm">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
