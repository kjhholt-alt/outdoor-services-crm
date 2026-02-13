import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { outdoorDashboardApi } from '../api/client';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import type { OutdoorDashboardSummary } from '../types';

export function ReportsPage() {
  const { data: summary } = useQuery<OutdoorDashboardSummary>({
    queryKey: ['outdoor-dashboard'],
    queryFn: outdoorDashboardApi.summary,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Business performance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="This Month" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(summary?.this_month.revenue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Jobs Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.this_month.jobs_completed ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="This Week" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(summary?.this_week.revenue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.this_week.total_jobs ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Accounts Receivable" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(summary?.outstanding.total_owed ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {summary?.outstanding.invoices_count ?? 0} invoices
                  </p>
                </div>
              </div>
              {(summary?.outstanding.overdue_count ?? 0) > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${(summary?.outstanding.overdue_amount ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-red-400">
                      {summary?.outstanding.overdue_count} invoices past due
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Detailed Charts Coming Soon</p>
          <p className="text-sm mt-1">Revenue trends, service breakdown, and customer analytics will appear here once you have job data.</p>
        </div>
      </Card>
    </div>
  );
}
