import { useState, useMemo } from 'react';
import { DollarSign, Briefcase, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card.tsx';
import { PageTransition } from '../components/common/PageTransition';
import { RevenueChart } from '../components/reports/RevenueChart.tsx';
import { JobsByStatusChart } from '../components/reports/JobsByStatusChart.tsx';
import { RevenueByCategoryChart } from '../components/reports/RevenueByCategoryChart.tsx';
import { SeasonalTrendsChart } from '../components/reports/SeasonalTrendsChart.tsx';
import { CrewProductivityChart } from '../components/reports/CrewProductivityChart.tsx';
import {
  monthlyRevenue2025,
  monthlyRevenue2024,
  jobsByStatus,
  revenueByCategory,
  crewProductivity,
  totalRevenue,
  totalJobs,
  avgJobValue,
  topCategory,
} from '../data/demoReports.ts';

type DateRange = 'month' | 'quarter' | 'year' | 'all';

function filterByRange<T>(data: T[], range: DateRange): T[] {
  switch (range) {
    case 'month':
      return data.slice(-1);
    case 'quarter':
      return data.slice(-3);
    case 'year':
      return data.slice(-12);
    case 'all':
    default:
      return data;
  }
}

export function ReportsPage() {
  const [range, setRange] = useState<DateRange>('all');

  const filteredRevenue = useMemo(
    () => filterByRange(monthlyRevenue2025, range),
    [range],
  );

  const filteredRevenue2024 = useMemo(
    () => filterByRange(monthlyRevenue2024, range),
    [range],
  );

  const filteredTotal = useMemo(
    () => filteredRevenue.reduce((s, m) => s + m.revenue, 0),
    [filteredRevenue],
  );

  const filteredJobs = useMemo(
    () => filteredRevenue.reduce((s, m) => s + m.jobs, 0),
    [filteredRevenue],
  );

  const filteredAvg = filteredJobs > 0 ? Math.round(filteredTotal / filteredJobs) : 0;

  const ranges: { key: DateRange; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
    { key: 'all', label: 'All' },
  ];

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          {ranges.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`btn ${range === key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${(range === 'all' ? totalRevenue : filteredTotal).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {range === 'all' ? totalJobs : filteredJobs}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Job Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${range === 'all' ? avgJobValue : filteredAvg}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{topCategory}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue trend - full width */}
      <Card>
        <CardHeader title="Revenue Trend" subtitle="Monthly revenue over time" />
        <CardContent>
          <RevenueChart data={filteredRevenue} />
        </CardContent>
      </Card>

      {/* Second row: Jobs by Status + Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Jobs by Status" subtitle="All-time job breakdown" />
          <CardContent>
            <JobsByStatusChart data={jobsByStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Revenue by Category" subtitle="Service category performance" />
          <CardContent>
            <RevenueByCategoryChart data={revenueByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Third row: Seasonal Trends + Crew Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Seasonal Trends" subtitle="2025 vs 2024 comparison" />
          <CardContent>
            <SeasonalTrendsChart data2025={filteredRevenue} data2024={filteredRevenue2024} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Crew Productivity" subtitle="Jobs completed and revenue per crew member" />
          <CardContent>
            <CrewProductivityChart data={crewProductivity} />
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}
