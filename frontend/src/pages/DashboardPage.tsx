import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase, DollarSign, AlertCircle,
  ChevronRight, TrendingUp, Receipt,
} from 'lucide-react';
import { outdoorDashboardApi, jobsApi, remindersApi } from '../api/client';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { WeatherWidget } from '../components/weather/WeatherWidget.tsx';
import { RevenueChart } from '../components/reports/RevenueChart';
import { PageTransition } from '../components/common/PageTransition';
import { monthlyRevenue2025 } from '../data/demoReports';
import type { OutdoorDashboardSummary, Job, Reminder } from '../types';

export function DashboardPage() {
  const { data: summary } = useQuery<OutdoorDashboardSummary>({
    queryKey: ['outdoor-dashboard'],
    queryFn: outdoorDashboardApi.summary,
  });

  const { data: todayJobs } = useQuery<Job[]>({
    queryKey: ['jobs', 'today'],
    queryFn: jobsApi.today,
  });

  const { data: overdueReminders } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'overdue'],
    queryFn: remindersApi.getOverdue,
  });

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          All Around Town Outdoor Services - Davenport, Iowa
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Jobs"
          value={summary?.today.total_jobs ?? 0}
          subtitle={summary ? `${summary.today.completed} done, ${summary.today.scheduled} left` : ''}
          icon={Briefcase}
          color="green"
          href="/jobs"
        />
        <StatCard
          title="Today's Revenue"
          value={`$${(summary?.today.revenue ?? 0).toFixed(0)}`}
          subtitle={`This week: $${(summary?.this_week.revenue ?? 0).toFixed(0)}`}
          icon={DollarSign}
          color="emerald"
          href="/jobs"
        />
        <StatCard
          title="Outstanding"
          value={summary?.outstanding.invoices_count ?? 0}
          subtitle={`$${(summary?.outstanding.total_owed ?? 0).toFixed(0)} owed`}
          icon={Receipt}
          color="amber"
          href="/invoices"
        />
        <StatCard
          title="Overdue"
          value={summary?.outstanding.overdue_count ?? 0}
          subtitle={summary?.outstanding.overdue_count ? `$${(summary.outstanding.overdue_amount).toFixed(0)} past due` : 'All good!'}
          icon={AlertCircle}
          color="red"
          href="/invoices"
        />
      </div>

      {/* Monthly revenue banner */}
      {summary && (
        <Card className="!bg-gradient-to-r !from-green-600 !to-green-700 !border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-sm">This Month's Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${summary.this_month.revenue.toFixed(2)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-green-100 text-sm">Jobs Completed</p>
              <p className="text-2xl font-bold text-white">
                {summary.this_month.jobs_completed}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader
          title="Monthly Revenue"
          subtitle="Last 12 months"
          action={
            <Link to="/reports" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Full reports
            </Link>
          }
        />
        <CardContent>
          <RevenueChart data={monthlyRevenue2025.slice(-6)} />
        </CardContent>
      </Card>

      {/* Weather Forecast */}
      <WeatherWidget />

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <Card>
          <CardHeader
            title="Today's Schedule"
            subtitle={`${todayJobs?.length ?? 0} jobs`}
            action={
              <Link to="/jobs" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all
              </Link>
            }
          />
          <CardContent>
            {todayJobs && todayJobs.length > 0 ? (
              <div className="space-y-2">
                {todayJobs.slice(0, 6).map(job => (
                  <div key={job.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 min-h-touch">
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: job.category_color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {job.service_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {job.customer_name}
                        {job.scheduled_time && ` - ${job.scheduled_time}`}
                      </p>
                    </div>
                    <span className={`badge text-xs ${
                      job.status === 'completed' ? 'badge-success'
                      : job.status === 'in_progress' ? 'badge-warning'
                      : 'badge-info'
                    }`}>
                      {job.status === 'completed' ? 'Done' : job.status === 'in_progress' ? 'Active' : job.status}
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${Number(job.price).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                No jobs scheduled for today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader
            title="Reminders"
            subtitle={`${overdueReminders?.length ?? 0} overdue`}
            action={
              <Link to="/reminders" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all
              </Link>
            }
          />
          <CardContent>
            {overdueReminders && overdueReminders.length > 0 ? (
              <div className="space-y-2">
                {overdueReminders.slice(0, 6).map(rem => (
                  <Link
                    key={rem.id}
                    to={`/customers/${rem.customer}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 min-h-touch"
                  >
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {rem.customer_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {rem.title}
                      </p>
                    </div>
                    <span className="text-xs text-red-500">{rem.reminder_date}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                No overdue reminders
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: 'green' | 'emerald' | 'amber' | 'red';
  href: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, href }: StatCardProps) {
  const colors = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
