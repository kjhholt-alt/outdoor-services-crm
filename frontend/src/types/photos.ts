export interface Photo {
  id: string;           // UUID
  jobId: number;
  customerId: number;
  type: 'before' | 'after';
  dataUrl: string;      // base64 data URL
  timestamp: string;    // ISO datetime
  latitude?: number;
  longitude?: number;
  notes?: string;
}
