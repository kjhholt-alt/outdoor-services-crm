import type { Photo } from '../types/photos';

function makeSvgDataUrl(color: string, label: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect fill='${color}' width='400' height='300'/><text x='200' y='150' text-anchor='middle' fill='white' font-size='24'>${label}</text></svg>`
  )}`;
}

export const demoPhotos: Photo[] = [
  {
    id: 'demo-photo-1',
    jobId: 1,
    customerId: 1,
    type: 'before',
    dataUrl: makeSvgDataUrl('#16a34a', 'Before Photo'),
    timestamp: '2026-02-13T08:30:00.000Z',
    latitude: 42.3601,
    longitude: -71.0589,
    notes: 'Front yard before mowing',
  },
  {
    id: 'demo-photo-2',
    jobId: 1,
    customerId: 1,
    type: 'after',
    dataUrl: makeSvgDataUrl('#2563eb', 'After Photo'),
    timestamp: '2026-02-13T09:45:00.000Z',
    latitude: 42.3601,
    longitude: -71.0589,
    notes: 'Front yard after mowing',
  },
  {
    id: 'demo-photo-3',
    jobId: 2,
    customerId: 2,
    type: 'before',
    dataUrl: makeSvgDataUrl('#16a34a', 'Before Photo'),
    timestamp: '2026-02-13T10:00:00.000Z',
    notes: 'Hedge trimming needed',
  },
  {
    id: 'demo-photo-4',
    jobId: 8,
    customerId: 3,
    type: 'before',
    dataUrl: makeSvgDataUrl('#16a34a', 'Before Photo'),
    timestamp: '2026-02-12T14:00:00.000Z',
    latitude: 42.3751,
    longitude: -71.1056,
    notes: 'Snow removal area',
  },
  {
    id: 'demo-photo-5',
    jobId: 8,
    customerId: 3,
    type: 'after',
    dataUrl: makeSvgDataUrl('#2563eb', 'After Photo'),
    timestamp: '2026-02-12T15:30:00.000Z',
    latitude: 42.3751,
    longitude: -71.1056,
    notes: 'Cleared and salted',
  },
];
