import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Briefcase, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card.tsx';
import { PageTransition } from '../components/common/PageTransition';
import { RevenueChart } from '../components/reports/RevenueChart.tsx';
import { JobsByStatusChart } from '../components/reports/JobsByStatusChart.tsx';
import { RevenueByCategoryChart } from '../components/reports/RevenueByCategoryChart.tsx';
import { SeasonalTrendsChart } from '../components/reports/SeasonalTrendsChart.tsx';
import { CrewProductivityChart } from '../components/reports/CrewProductivityChart.tsx';
import { reportsApi } from '../api/client';
import type { MonthlyRevenue } from '../data/demoReports';

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

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getData(),
    staleTime: 5 * 60 * 1000,
  });

  const monthlyRevenueCurrent: MonthlyRevenue[] = reports?.monthly_revenue_current ?? [];
  const monthlyRevenuePrevious: MonthlyRevenue[] = reports?.monthly_revenue_previous ?? [];
  const jobsByStatus = reports?.jobs_by_status ?? [];
  const revenueByCategory = reports?.revenue_by_category ?? [];
  const crewProductivity = reports?.crew_productivity ?? [];
  const summary = reports?.summary ?? { total_revenue: 0, total_jobs: 0, avg_job_value: 0, top_category: 'N/A' };

  const filteredRevenue = useMemo(
    () => filterByRange(monthlyRevenueCurrent, range),
    [monthlyRevenueCurrent, range],
  );

  const filteredRevenuePrev = useMemo(
    () => filterByRange(monthlyRevenuePrevious, range),
    [monthlyRevenuePrevious, range],
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

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${(range === 'all' ? summary.total_revenue : filteredTotal).toLocaleString()}
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
                {range === 'all' ? summary.total_jobs : filteredJobs}
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
                ${range === 'all' ? summary.avg_job_value : filteredAvg}
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.top_category}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Revenue Trend" subtitle="Monthly revenue over time" />
        <CardContent>
          <RevenueChart data={filteredRevenue} />
        </CardContent>
      </Card>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Seasonal Trends" subtitle="Current year vs previous year" />
          <CardContent>
            <SeasonalTrendsChart data2025={filteredRevenue} data2024={filteredRevenuePrev} />
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
