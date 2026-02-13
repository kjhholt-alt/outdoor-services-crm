import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import type { Job } from '../../types/index.ts';
import { CalendarEventCard } from './CalendarEventCard.tsx';

interface JobCalendarProps {
  jobs: Job[];
  onJobClick?: (jobId: number) => void;
}

export function JobCalendar({ jobs, onJobClick }: JobCalendarProps) {
  const events = jobs.map((job) => ({
    id: String(job.id),
    title: job.service_name,
    start: `${job.scheduled_date}T${job.scheduled_time || '09:00'}`,
    backgroundColor: job.category_color,
    borderColor: job.category_color,
    extendedProps: { job },
  }));

  function handleEventClick(info: EventClickArg) {
    const jobId = Number(info.event.id);
    if (onJobClick && !isNaN(jobId)) {
      onJobClick(jobId);
    }
  }

  function renderEventContent(eventInfo: EventContentArg) {
    return <CalendarEventCard event={eventInfo} />;
  }

  return (
    <div className="fc-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
        dayMaxEvents={4}
        nowIndicator
        editable={false}
      />
    </div>
  );
}
