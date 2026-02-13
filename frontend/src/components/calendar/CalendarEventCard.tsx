import type { EventContentArg } from '@fullcalendar/core';

export function CalendarEventCard({ event }: { event: EventContentArg }) {
  const job = event.event.extendedProps.job as {
    customer_name: string;
    status: string;
    scheduled_time: string | null;
  } | undefined;

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-400',
    in_progress: 'bg-amber-400',
    completed: 'bg-green-400',
    cancelled: 'bg-gray-400',
    rescheduled: 'bg-purple-400',
    weather_delay: 'bg-sky-400',
  };

  return (
    <div className="flex items-center gap-1 overflow-hidden px-1 w-full">
      {job && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[job.status] ?? 'bg-gray-400'}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate leading-tight">
          {event.event.title}
        </p>
        {job && (
          <p className="text-[10px] opacity-75 truncate leading-tight">
            {job.customer_name}
          </p>
        )}
      </div>
    </div>
  );
}
