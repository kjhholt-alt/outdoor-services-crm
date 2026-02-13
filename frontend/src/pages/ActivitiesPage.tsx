import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, ChevronRight, Filter } from 'lucide-react';
import { activitiesApi } from '../api/client';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Select } from '../components/common/Input';
import type { Activity, ActivityType, PaginatedResponse } from '../types';

export function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activityType = searchParams.get('type') || '';

  const { data: activities, isLoading } = useQuery<PaginatedResponse<Activity>>({
    queryKey: ['activities', { type: activityType }],
    queryFn: () => {
      const params: Record<string, string | number> = {
        ordering: '-activity_datetime',
      };
      if (activityType) params.activity_type = activityType;
      return activitiesApi.list(params);
    },
  });

  const { data: activityTypes } = useQuery<ActivityType[]>({
    queryKey: ['activity-types'],
    queryFn: activitiesApi.getTypes,
  });

  const { data: activityCounts } = useQuery({
    queryKey: ['activity-counts'],
    queryFn: () => activitiesApi.getByType(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Activities
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View your customer interaction history
        </p>
      </div>

      {/* Activity Type Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {activityCounts?.map((stat: { activity_type__display_name: string; activity_type__color: string; count: number }) => (
          <Card key={stat.activity_type__display_name} className="text-center">
            <div
              className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${stat.activity_type__color}20` }}
            >
              <Calendar
                className="w-5 h-5"
                style={{ color: stat.activity_type__color }}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.count}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.activity_type__display_name}
            </p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select
            value={activityType}
            onChange={(e) => {
              setSearchParams((prev) => {
                if (e.target.value) {
                  prev.set('type', e.target.value);
                } else {
                  prev.delete('type');
                }
                return prev;
              });
            }}
            options={[
              { value: '', label: 'All Activity Types' },
              ...(activityTypes?.map((type) => ({
                value: type.id.toString(),
                label: type.display_name,
              })) || []),
            ]}
            className="w-64"
          />
        </div>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader title="Recent Activities" />
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : !activities?.results || activities.results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No activities found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.results.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/customers/${activity.customer}`}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${activity.activity_type_color}20`,
                    }}
                  >
                    <Calendar
                      className="w-5 h-5"
                      style={{ color: activity.activity_type_color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.customer_name}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${activity.activity_type_color}20`,
                          color: activity.activity_type_color,
                        }}
                      >
                        {activity.activity_type_name}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {activity.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {new Date(activity.activity_datetime).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(activity.activity_datetime).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                      {activity.outcome && (
                        <span className="badge badge-info">{activity.outcome}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
