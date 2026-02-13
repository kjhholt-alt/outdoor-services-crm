import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  MoreHorizontal,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { remindersApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import type { Reminder, DashboardSummary } from '../types';

export function RemindersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const filter = searchParams.get('filter') || 'all';

  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: remindersApi.getDashboardSummary,
  });

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders', filter],
    queryFn: () => {
      switch (filter) {
        case 'overdue':
          return remindersApi.getOverdue();
        case 'today':
          return remindersApi.getToday();
        case 'week':
          return remindersApi.getWeek();
        case 'next-week':
          return remindersApi.getNextWeek();
        case '30days':
          return remindersApi.getNext30Days();
        default:
          return remindersApi.list({ status: 'pending' }).then((r) => r.results || r);
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => remindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Reminder completed!');
    },
    onError: () => {
      toast.error('Failed to complete reminder');
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      remindersApi.snooze(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Reminder snoozed');
    },
    onError: () => {
      toast.error('Failed to snooze reminder');
    },
  });

  const tabs = [
    { id: 'overdue', label: 'Overdue', count: summary?.overdue, color: 'red' },
    { id: 'today', label: 'Today', count: summary?.today, color: 'orange' },
    { id: 'week', label: 'This Week', count: summary?.this_week, color: 'blue' },
    { id: 'next-week', label: 'Next Week', count: summary?.next_week, color: 'purple' },
    { id: '30days', label: '30 Days', count: summary?.next_30_days, color: 'green' },
    { id: 'all', label: 'All', count: summary?.total_pending, color: 'gray' },
  ];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reminders
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your follow-up tasks and calls
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setSearchParams((prev) => {
                prev.set('filter', tab.id);
                return prev;
              })
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-touch flex items-center gap-2 ${
              filter === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  tab.color === 'red'
                    ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : tab.color === 'orange'
                    ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !reminders || reminders.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'overdue'
                ? 'No overdue reminders!'
                : filter === 'today'
                ? 'Nothing due today!'
                : 'No reminders found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reminders.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                onComplete={() => completeMutation.mutate(reminder.id)}
                onSnooze={(days) =>
                  snoozeMutation.mutate({ id: reminder.id, days })
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
    </PageTransition>
  );
}

interface ReminderRowProps {
  reminder: Reminder;
  onComplete: () => void;
  onSnooze: (days: number) => void;
}

function ReminderRow({ reminder, onComplete, onSnooze }: ReminderRowProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            reminder.is_overdue
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : reminder.is_today
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
          }`}
        >
          {reminder.is_overdue ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Calendar className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/customers/${reminder.customer}`}
            className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
          >
            {reminder.customer_name}
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {reminder.title}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span
              className={
                reminder.is_overdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : ''
              }
            >
              {reminder.reminder_date}
            </span>
            {reminder.customer_phone && (
              <a
                href={`tel:${reminder.customer_phone}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <Phone className="w-4 h-4" />
                {reminder.customer_phone}
              </a>
            )}
            {reminder.priority !== 'medium' && (
              <span
                className={`badge ${
                  reminder.priority === 'high' ? 'badge-danger' : 'badge-info'
                }`}
              >
                {reminder.priority}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={onComplete}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Complete</span>
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onSnooze(1);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Snooze 1 day
                    </button>
                    <button
                      onClick={() => {
                        onSnooze(7);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Snooze 1 week
                    </button>
                    <button
                      onClick={() => {
                        onSnooze(30);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Snooze 30 days
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link
            to={`/customers/${reminder.customer}`}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
