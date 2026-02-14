import axios from 'axios';

// Types
export interface ScanResult {
  id: number;
  city: string;
  state: string;
  keyword: string;
  snippet: string;
  source_url: string;
  page_title: string;
  meeting_date: string | null;
  document_type: 'html' | 'pdf';
  found_at: string;
}

export interface ScanJob {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  cities_scanned: number;
  total_results: number;
  error_message: string;
  results?: ScanResult[];
}

export interface ScanStats {
  total_mentions: number;
  cities_with_hits: number;
  last_scan: Omit<ScanJob, 'results'> | null;
  active_keywords: number;
}

const scannerClient = axios.create({
  baseURL: '/api/scanner',
  headers: { 'Content-Type': 'application/json' },
});

export const scannerApi = {
  triggerScan: async (cities: { city: string; state: string }[]): Promise<ScanJob> => {
    const response = await scannerClient.post('/scan/', { cities });
    return response.data;
  },

  getScanStatus: async (jobId: number): Promise<ScanJob> => {
    const response = await scannerClient.get(`/scan/${jobId}/`);
    return response.data;
  },

  getResults: async (params?: Record<string, string>): Promise<ScanResult[]> => {
    const response = await scannerClient.get('/results/', { params });
    return response.data;
  },

  getHistory: async (): Promise<Omit<ScanJob, 'results'>[]> => {
    const response = await scannerClient.get('/history/');
    return response.data;
  },

  getStats: async (): Promise<ScanStats> => {
    const response = await scannerClient.get('/stats/');
    return response.data;
  },
};
