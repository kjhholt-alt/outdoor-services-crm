import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Phone, Plus,
  Play, CheckCircle2, Briefcase, CalendarDays, Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { jobsApi } from '../api/client';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { PageTransition } from '../components/common/PageTransition';
import { JobCalendar } from '../components/calendar/JobCalendar.tsx';
import { WeatherBadge } from '../components/weather/WeatherBadge.tsx';
import { PhotoCapture } from '../components/photos/PhotoCapture';
import { PhotoGallery } from '../components/photos/PhotoGallery';
import type { Job, JobStatus } from '../types';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  completed: { label: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  rescheduled: { label: 'Rescheduled', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  weather_delay: { label: 'Weather Delay', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30' },
};

export function JobsPage() {
  const [view, setView] = useState<'today' | 'week' | 'all' | 'calendar'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [photoJobId, setPhotoJobId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: todayJobs } = useQuery<Job[]>({
    queryKey: ['jobs', 'today'],
    queryFn: jobsApi.today,
    enabled: view === 'today',
  });

  const { data: weekJobs } = useQuery<Job[]>({
    queryKey: ['jobs', 'week'],
    queryFn: jobsApi.week,
    enabled: view === 'week',
  });

  const { data: allJobsData } = useQuery({
    queryKey: ['jobs', 'all', statusFilter],
    queryFn: () => jobsApi.list(statusFilter ? { status: statusFilter } : {}),
    enabled: view === 'all' || view === 'calendar',
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

  const jobs = view === 'today' ? todayJobs
    : view === 'week' ? weekJobs
    : allJobsData?.results ?? allJobsData ?? [];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage scheduled and completed work</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 flex-wrap">
        {(['today', 'week', 'all'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`btn ${view === v ? 'btn-primary' : 'btn-secondary'}`}
          >
            {v === 'today' ? 'Today' : v === 'week' ? 'This Week' : 'All Jobs'}
          </button>
        ))}
        <button
          onClick={() => setView('calendar')}
          className={`btn gap-2 ${view === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendar
        </button>
        {view === 'all' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input !w-auto"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <JobCalendar
          jobs={Array.isArray(allJobsData?.results ?? allJobsData) ? (allJobsData?.results ?? allJobsData ?? []) as Job[] : []}
        />
      )}

      {/* Job Cards */}
      {view !== 'calendar' && <div className="space-y-3">
        {Array.isArray(jobs) && jobs.length > 0 ? (
          jobs.map((job: Job) => {
            const statusCfg = STATUS_CONFIG[job.status];
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Category color bar */}
                  <div
                    className="w-1.5 h-16 rounded-full shrink-0"
                    style={{ backgroundColor: job.category_color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {job.service_name}
                      </span>
                      <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <Link to={`/customers/${job.customer}`} className="hover:text-green-600 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.customer_name}
                      </Link>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {job.scheduled_date}
                        {job.scheduled_time && ` at ${job.scheduled_time}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {job.estimated_duration}min
                      </span>
                      <WeatherBadge date={job.scheduled_date} />
                      {job.assigned_to && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {job.assigned_to}
                        </span>
                      )}
                    </div>
                    {job.customer_address && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.customer_address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-green-700 dark:text-green-400">
                      ${Number(job.price).toFixed(2)}
                    </span>
                    {job.status === 'scheduled' && (
                      <button
                        onClick={() => startMutation.mutate(job.id)}
                        className="btn btn-secondary !min-h-[36px] !px-3 gap-1"
                        title="Start job"
                      >
                        <Play className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    {job.status === 'in_progress' && (
                      <button
                        onClick={() => completeMutation.mutate(job.id)}
                        className="btn btn-secondary !min-h-[36px] !px-3 gap-1"
                        title="Complete job"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    {job.customer_phone && (
                      <a href={`tel:${job.customer_phone}`} className="btn btn-ghost !min-h-[36px] !px-3" title="Call customer">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setPhotoJobId(job.id)}
                      className="btn btn-ghost !min-h-[36px] !px-3"
                      title="Photos"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs {view === 'today' ? 'scheduled for today' : view === 'week' ? 'this week' : 'found'}</p>
              <Link to="/jobs/new" className="text-green-600 hover:underline text-sm mt-1 inline-block">
                Schedule a new job
              </Link>
            </div>
          </Card>
        )}
      </div>}

      {photoJobId !== null && (
        <Modal
          isOpen={true}
          onClose={() => setPhotoJobId(null)}
          title="Job Photos"
          size="lg"
        >
          <PhotoCapture
            jobId={photoJobId}
            customerId={jobs?.find((j: Job) => j.id === photoJobId)?.customer ?? 0}
          />
          <PhotoGallery
            jobId={photoJobId}
            customerId={jobs?.find((j: Job) => j.id === photoJobId)?.customer ?? 0}
          />
        </Modal>
      )}
    </div>
    </PageTransition>
  );
}
