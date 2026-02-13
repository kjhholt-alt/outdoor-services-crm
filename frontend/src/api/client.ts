import axios from 'axios';

// Use VITE_API_URL env var, or default to backend URL
// For Render: set VITE_API_URL to your backend URL (e.g., https://johnscrm.onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.patch('/auth/me/', data);
    return response.data;
  },
  toggleDarkMode: async () => {
    const response = await api.post('/auth/toggle-dark-mode/');
    return response.data;
  },
};

// Customers API
export const customersApi = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/customers/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/customers/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}/`);
    return response.data;
  },
  getNotes: async (id: number) => {
    const response = await api.get(`/customers/${id}/notes/`);
    return response.data;
  },
  addNote: async (id: number, content: string) => {
    const response = await api.post(`/customers/${id}/notes/`, { content });
    return response.data;
  },
  getActivities: async (id: number) => {
    const response = await api.get(`/customers/${id}/activities/`);
    return response.data;
  },
  getReminders: async (id: number) => {
    const response = await api.get(`/customers/${id}/reminders/`);
    return response.data;
  },
};

// Regions API
export const regionsApi = {
  list: async () => {
    const response = await api.get('/regions/');
    return response.data;
  },
};

// Activities API
export const activitiesApi = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/activities/', { params });
    return response.data;
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/activities/', data);
    return response.data;
  },
  getTypes: async () => {
    const response = await api.get('/activities/types/');
    return response.data;
  },
  getRecent: async () => {
    const response = await api.get('/activities/recent/');
    return response.data;
  },
  getByType: async (params?: Record<string, string>) => {
    const response = await api.get('/activities/by_type/', { params });
    return response.data;
  },
};

// Reminders API
export const remindersApi = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/reminders/', { params });
    return response.data;
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/reminders/', data);
    return response.data;
  },
  complete: async (id: number) => {
    const response = await api.post(`/reminders/${id}/complete/`);
    return response.data;
  },
  snooze: async (id: number, days: number, useBusinessDays = true) => {
    const response = await api.post(`/reminders/${id}/snooze/`, {
      days,
      use_business_days: useBusinessDays,
    });
    return response.data;
  },
  cancel: async (id: number) => {
    const response = await api.post(`/reminders/${id}/cancel/`);
    return response.data;
  },
  getOverdue: async () => {
    const response = await api.get('/reminders/overdue/');
    return response.data;
  },
  getToday: async () => {
    const response = await api.get('/reminders/today/');
    return response.data;
  },
  getWeek: async () => {
    const response = await api.get('/reminders/week/');
    return response.data;
  },
  getNextWeek: async () => {
    const response = await api.get('/reminders/next_week/');
    return response.data;
  },
  getNext30Days: async () => {
    const response = await api.get('/reminders/next_30_days/');
    return response.data;
  },
  getDashboardSummary: async () => {
    const response = await api.get('/reminders/dashboard_summary/');
    return response.data;
  },
};

// Routes API
export const routesApi = {
  list: async (params?: Record<string, string | number>) => {
    const response = await api.get('/routes/', { params });
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get(`/routes/${id}/`);
    return response.data;
  },
  createOptimized: async (data: {
    name: string;
    date: string;
    customer_ids: number[];
    notes?: string;
    optimize?: boolean;
  }) => {
    const response = await api.post('/routes/create_optimized/', data);
    return response.data;
  },
  completeStop: async (routeId: number, stopId: number) => {
    const response = await api.post(`/routes/${routeId}/complete_stop/`, {
      stop_id: stopId,
    });
    return response.data;
  },
  skipStop: async (routeId: number, stopId: number, reason: string) => {
    const response = await api.post(`/routes/${routeId}/skip_stop/`, {
      stop_id: stopId,
      reason,
    });
    return response.data;
  },
};

// Import/Export API
export const importExportApi = {
  preview: async (file: File, fieldMapping?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (fieldMapping) {
      formData.append('field_mapping', JSON.stringify(fieldMapping));
    }
    const response = await api.post('/import/preview/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  execute: async (
    file: File,
    fieldMapping: Record<string, string>,
    duplicateAction: 'skip' | 'update' | 'create_new'
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_mapping', JSON.stringify(fieldMapping));
    formData.append('duplicate_action', duplicateAction);
    const response = await api.post('/import/execute/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  exportCustomers: async (format: 'xlsx' | 'csv' = 'xlsx', regionId?: number) => {
    const params: Record<string, string | number> = { format };
    if (regionId) params.region = regionId;
    const response = await api.get('/import/export/customers/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// --- Demo mode: serve sample data when no backend is configured ---
import {
  isDemoMode, demoCategories, demoJobs, demoEstimates,
  demoInvoices, demoDashboardSummary, demoReminders, demoCustomers,
  demoCustomerDetails, demoActivities,
} from '../data/demo';

// Helper: try the real API, fall back to demo data on failure
async function withDemo<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
  if (isDemoMode) return fallback;
  try { return await apiFn(); } catch { return fallback; }
}

// Services API (outdoor-specific)
export const serviceCategoriesApi = {
  list: async () => withDemo(
    async () => (await api.get('/api/categories/')).data,
    demoCategories,
  ),
  get: async (id: number) => withDemo(
    async () => (await api.get(`/api/categories/${id}/`)).data,
    demoCategories.find(c => c.id === id),
  ),
};

export const servicesApi = {
  list: async (params?: Record<string, string | number>) => withDemo(
    async () => (await api.get('/api/services/', { params })).data,
    demoCategories.flatMap(c => c.services),
  ),
};

// Jobs API
const todayStr = new Date().toISOString().split('T')[0];
export const jobsApi = {
  list: async (params?: Record<string, string | number>) => withDemo(
    async () => (await api.get('/api/jobs/', { params })).data,
    params?.status ? demoJobs.filter(j => j.status === params.status) : demoJobs,
  ),
  get: async (id: number) => withDemo(
    async () => (await api.get(`/api/jobs/${id}/`)).data,
    demoJobs.find(j => j.id === id),
  ),
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/api/jobs/', data);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(`/api/jobs/${id}/`, data);
    return response.data;
  },
  today: async () => withDemo(
    async () => (await api.get('/api/jobs/today/')).data,
    demoJobs.filter(j => j.scheduled_date === todayStr),
  ),
  week: async () => withDemo(
    async () => (await api.get('/api/jobs/week/')).data,
    demoJobs,
  ),
  start: async (id: number) => {
    const response = await api.post(`/api/jobs/${id}/start/`);
    return response.data;
  },
  complete: async (id: number, data?: { actual_duration?: number; notes?: string }) => {
    const response = await api.post(`/api/jobs/${id}/complete/`, data);
    return response.data;
  },
  reschedule: async (id: number, date: string, time?: string) => {
    const response = await api.post(`/api/jobs/${id}/reschedule/`, { date, time });
    return response.data;
  },
};

// Estimates API
export const estimatesApi = {
  list: async (params?: Record<string, string | number>) => withDemo(
    async () => (await api.get('/api/estimates/', { params })).data,
    demoEstimates,
  ),
  get: async (id: number) => withDemo(
    async () => (await api.get(`/api/estimates/${id}/`)).data,
    demoEstimates.find(e => e.id === id),
  ),
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/api/estimates/', data);
    return response.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(`/api/estimates/${id}/`, data);
    return response.data;
  },
  accept: async (id: number, startDate?: string) => {
    const response = await api.post(`/api/estimates/${id}/accept/`, { start_date: startDate });
    return response.data;
  },
};

// Invoices API
export const invoicesApi = {
  list: async (params?: Record<string, string | number>) => withDemo(
    async () => (await api.get('/api/invoices/', { params })).data,
    demoInvoices,
  ),
  get: async (id: number) => withDemo(
    async () => (await api.get(`/api/invoices/${id}/`)).data,
    demoInvoices.find(i => i.id === id),
  ),
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/api/invoices/', data);
    return response.data;
  },
  outstanding: async () => withDemo(
    async () => (await api.get('/api/invoices/outstanding/')).data,
    demoInvoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)),
  ),
  overdue: async () => withDemo(
    async () => (await api.get('/api/invoices/overdue/')).data,
    demoInvoices.filter(i => i.status === 'overdue'),
  ),
  recordPayment: async (id: number, amount: number) => {
    const response = await api.post(`/api/invoices/${id}/record_payment/`, { amount });
    return response.data;
  },
};

// Dashboard API (outdoor-specific)
export const outdoorDashboardApi = {
  summary: async () => withDemo(
    async () => (await api.get('/api/dashboard/summary/')).data,
    demoDashboardSummary,
  ),
};

// Override reminders and customers APIs for demo mode
const _originalRemindersGetOverdue = remindersApi.getOverdue;
remindersApi.getOverdue = async () => withDemo(
  _originalRemindersGetOverdue,
  demoReminders.filter(r => r.is_overdue),
);

const _originalCustomersList = customersApi.list;
customersApi.list = async (params?: Record<string, string | number>) => withDemo(
  () => _originalCustomersList(params),
  demoCustomers,
);

const _originalCustomersGet = customersApi.get;
customersApi.get = async (id: number) => withDemo(
  () => _originalCustomersGet(id),
  demoCustomerDetails.find(c => c.id === id) as ReturnType<typeof _originalCustomersGet> extends Promise<infer R> ? R : never,
);

const _originalCustomersGetActivities = customersApi.getActivities;
customersApi.getActivities = async (id: number) => withDemo(
  () => _originalCustomersGetActivities(id),
  demoActivities.filter(a => a.customer === id),
);

const _originalCustomersGetReminders = customersApi.getReminders;
customersApi.getReminders = async (id: number) => withDemo(
  () => _originalCustomersGetReminders(id),
  demoReminders.filter(r => r.customer === id),
);

export default api;
