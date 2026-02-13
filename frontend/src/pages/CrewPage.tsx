import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { jobsApi } from '../api/client';
import { PageTransition } from '../components/common/PageTransition';
import { CrewLayout } from '../components/crew/CrewLayout';
import { CrewJobCard } from '../components/crew/CrewJobCard';
import type { Job } from '../types';

export function CrewPage() {
  const queryClient = useQueryClient();

  const { data: todayJobs, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs', 'today'],
    queryFn: jobsApi.today,
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => jobsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job started!');
    },
    onError: () => {
      toast.error('Failed to start job');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => jobsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job completed!');
    },
    onError: () => {
      toast.error('Failed to complete job');
    },
  });

  const jobs = todayJobs ?? [];
  const sortedJobs = [...jobs].sort((a, b) => {
    const timeA = a.scheduled_time ?? '';
    const timeB = b.scheduled_time ?? '';
    return timeA.localeCompare(timeB);
  });

  const nextJob = sortedJobs.find(
    j => j.status === 'scheduled' || j.status === 'in_progress'
  );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <CrewLayout>
      <PageTransition>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Jobs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {today} &middot; {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Next up preview */}
        {nextJob && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 mb-0.5">
              {nextJob.status === 'in_progress' ? 'Current Job' : 'Next Up'}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {nextJob.customer_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {nextJob.service_name}
              {nextJob.scheduled_time && ` at ${nextJob.scheduled_time}`}
            </p>
          </div>
        )}

        {/* Job list */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading jobs...</div>
        ) : sortedJobs.length > 0 ? (
          <div className="space-y-4">
            {sortedJobs.map(job => (
              <CrewJobCard
                key={job.id}
                job={job}
                onStart={id => startMutation.mutate(id)}
                onComplete={id => completeMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No jobs scheduled for today</p>
            <p className="text-sm mt-1">Enjoy your day off!</p>
          </div>
        )}
      </div>
      </PageTransition>
    </CrewLayout>
  );
}
