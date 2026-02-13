import { useState } from 'react';
import { Play, CheckCircle2, MapPin, Phone, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { PhotoCapture } from '../photos/PhotoCapture';
import { PhotoGallery } from '../photos/PhotoGallery';
import type { Job, JobStatus } from '../../types';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: 'In Progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  completed: { label: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  rescheduled: { label: 'Rescheduled', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  weather_delay: { label: 'Weather Delay', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30' },
};

interface CrewJobCardProps {
  job: Job;
  onStart?: (id: number) => void;
  onComplete?: (id: number) => void;
}

export function CrewJobCard({ job, onStart, onComplete }: CrewJobCardProps) {
  const [notes, setNotes] = useState('');
  const statusCfg = STATUS_CONFIG[job.status];

  const mapsUrl = job.customer_address
    ? `https://maps.google.com/?q=${encodeURIComponent(job.customer_address)}`
    : null;

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {job.customer_name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {job.service_name}
            </span>
          </div>
        </div>
        {job.scheduled_time && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 shrink-0">
            <Clock className="w-4 h-4" />
            {job.scheduled_time}
            {job.estimated_duration > 0 && (
              <span className="ml-1">({job.estimated_duration}min)</span>
            )}
          </div>
        )}
      </div>

      {/* Address + Contact */}
      <div className="flex flex-col gap-2">
        {job.customer_address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
              {job.customer_address}
            </span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary !min-h-[44px] !px-3 text-sm shrink-0"
              >
                Navigate
              </a>
            )}
          </div>
        )}
        {job.customer_phone && (
          <a
            href={`tel:${job.customer_phone}`}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            <Phone className="w-4 h-4" />
            {job.customer_phone}
          </a>
        )}
      </div>

      {/* Quick notes */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Quick notes..."
        rows={3}
        className="input w-full text-sm resize-none"
      />

      {/* Action button */}
      {job.status === 'scheduled' && onStart && (
        <button
          onClick={() => onStart(job.id)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors"
        >
          <Play className="w-5 h-5" />
          Start Job
        </button>
      )}
      {job.status === 'in_progress' && onComplete && (
        <button
          onClick={() => onComplete(job.id)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors"
        >
          <CheckCircle2 className="w-5 h-5" />
          Complete Job
        </button>
      )}
      {job.status === 'completed' && (
        <div className="w-full h-14 flex items-center justify-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-lg">
          <CheckCircle2 className="w-5 h-5" />
          Completed
        </div>
      )}

      {/* Photos */}
      {job.status === 'in_progress' && (
        <PhotoCapture jobId={job.id} customerId={job.customer} />
      )}
      <PhotoGallery jobId={job.id} customerId={job.customer} />
    </Card>
  );
}
