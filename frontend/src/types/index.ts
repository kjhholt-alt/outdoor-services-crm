// User and Auth types
export interface UserProfile {
  dark_mode: boolean;
  default_region: number | null;
  items_per_page: number;
  receive_weekly_summary: boolean;
  weekly_summary_email: string;
  weekly_summary_day: number;
  weekly_summary_time: string;
  reminder_notifications: boolean;
  overdue_notifications: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

// Region type
export interface Region {
  id: number;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  customer_count: number;
}

// Customer types
export interface CustomerNote {
  id: number;
  content: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  is_current: boolean;
  parent_note: number | null;
}

export interface Customer {
  id: number;
  business_name: string;
  bill_to_address: string;
  city: string;
  state: string;
  zip_code: string;
  primary_contact: string;
  main_email: string;
  main_phone: string;
  secondary_phone: string;
  fax: string;
  fleet_description: string;
  region: number | null;
  region_name: string;
  latitude: number | null;
  longitude: number | null;
  last_call_date: string | null;
  next_call_date: string | null;
  custom_fields: Record<string, unknown>;
  notes: CustomerNote[];
  current_note: CustomerNote | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  activity_count: number;
  pending_reminders_count: number;
}

export interface CustomerListItem {
  id: number;
  business_name: string;
  city: string;
  state: string;
  primary_contact: string;
  main_phone: string;
  main_email: string;
  region: number | null;
  region_name: string;
  last_call_date: string | null;
  next_call_date: string | null;
  current_note: {
    id: number;
    content: string;
    created_at: string;
  } | null;
  pending_reminders_count: number;
  is_active: boolean;
}

// Activity types
export interface ActivityType {
  id: number;
  name: string;
  display_name: string;
  icon: string;
  color: string;
  is_calendar_event: boolean;
  default_duration_minutes: number;
  is_active: boolean;
  sort_order: number;
}

export interface Activity {
  id: number;
  customer: number;
  customer_name: string;
  activity_type: number;
  activity_type_name: string;
  activity_type_icon: string;
  activity_type_color: string;
  subject: string;
  notes: string;
  outcome: string;
  activity_datetime: string;
  duration_minutes: number;
  custom_fields: Record<string, unknown>;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

// Reminder types
export interface Reminder {
  id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  activity: number | null;
  title: string;
  description: string;
  reminder_date: string;
  reminder_time: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  original_date: string | null;
  snooze_count: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  completed_by: number | null;
  is_overdue: boolean;
  is_today: boolean;
}

export interface DashboardSummary {
  overdue: number;
  today: number;
  this_week: number;
  next_week: number;
  next_30_days: number;
  total_pending: number;
}

// Route types
export interface RouteStop {
  id: number;
  customer: number;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
  stop_order: number;
  notes: string;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  estimated_duration_minutes: number;
  distance_from_previous_miles: number | null;
  is_completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  skip_reason: string;
}

export interface Route {
  id: number;
  name: string;
  date: string;
  notes: string;
  total_distance_miles: number | null;
  estimated_duration_minutes: number | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_completed: boolean;
  completed_at: string | null;
  stops: RouteStop[];
  stop_count: number;
  completed_stop_count: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Service types
export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_seasonal: boolean;
  season_start: number | null;
  season_end: number | null;
  is_active: boolean;
  sort_order: number;
  services: Service[];
  service_count: number;
}

export interface Service {
  id: number;
  category: number;
  category_name: string;
  name: string;
  description: string;
  default_price: number;
  price_type: 'flat' | 'hourly' | 'sqft' | 'custom';
  estimated_duration_minutes: number;
  is_recurring: boolean;
  recurring_frequency: 'weekly' | 'biweekly' | 'monthly' | 'seasonal' | 'one_time';
  is_active: boolean;
}

// Job types
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'weather_delay';

export interface Job {
  id: number;
  customer: number;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  service: number;
  service_name: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  scheduled_date: string;
  scheduled_time: string | null;
  estimated_duration: number;
  assigned_to: string;
  status: JobStatus;
  price: number;
  is_invoiced: boolean;
  is_paid: boolean;
  is_recurring: boolean;
  completed_at: string | null;
  actual_duration: number | null;
  completion_notes?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Estimate types
export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface EstimateLineItem {
  service: string;
  price: number;
  frequency?: string;
  notes?: string;
}

export interface Estimate {
  id: number;
  customer: number;
  customer_name: string;
  title: string;
  description: string;
  line_items: EstimateLineItem[];
  total: number;
  status: EstimateStatus;
  valid_until: string | null;
  sent_at: string | null;
  responded_at: string | null;
  converted_to_jobs: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Invoice types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void';

export interface Invoice {
  id: number;
  customer: number;
  customer_name: string;
  invoice_number: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string;
  job_details?: Job[];
  created_at: string;
  updated_at: string;
}

// Dashboard summary (outdoor version)
export interface OutdoorDashboardSummary {
  today: {
    total_jobs: number;
    completed: number;
    in_progress: number;
    scheduled: number;
    revenue: number;
  };
  this_week: {
    total_jobs: number;
    completed: number;
    revenue: number;
  };
  this_month: {
    revenue: number;
    jobs_completed: number;
  };
  outstanding: {
    invoices_count: number;
    total_owed: number;
    overdue_count: number;
    overdue_amount: number;
  };
  monthly_revenue?: { month: string; revenue: number }[];
}
