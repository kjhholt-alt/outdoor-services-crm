/**
 * Demo data for previewing the CRM without a backend.
 * When VITE_API_URL is not set or the backend is unreachable,
 * the app uses this data so the UI looks fully populated.
 */

import type {
  ServiceCategory, Job, Estimate, Invoice,
  OutdoorDashboardSummary, Reminder, CustomerListItem, Customer, Activity,
} from '../types';

// --- Helpers ---
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
const daysFromNow = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

// --- Service Categories ---
export const demoCategories: ServiceCategory[] = [
  {
    id: 1, name: 'Lawn Care', description: 'Mowing, edging, trimming, and fertilization',
    icon: 'leaf', color: '#16a34a', is_seasonal: true, season_start: 4, season_end: 10,
    is_active: true, sort_order: 1, service_count: 4,
    services: [
      { id: 1, category: 1, category_name: 'Lawn Care', name: 'Weekly Mowing', description: 'Standard mowing with edging and blowing', default_price: 45, price_type: 'flat', estimated_duration_minutes: 45, is_recurring: true, recurring_frequency: 'weekly', is_active: true },
      { id: 2, category: 1, category_name: 'Lawn Care', name: 'Lawn Fertilization', description: '5-step fertilization program', default_price: 65, price_type: 'flat', estimated_duration_minutes: 30, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
      { id: 3, category: 1, category_name: 'Lawn Care', name: 'Aeration & Overseeding', description: 'Core aeration with premium seed blend', default_price: 150, price_type: 'flat', estimated_duration_minutes: 60, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
      { id: 4, category: 1, category_name: 'Lawn Care', name: 'Weed Control Treatment', description: 'Pre and post-emergent weed treatment', default_price: 55, price_type: 'flat', estimated_duration_minutes: 25, is_recurring: true, recurring_frequency: 'monthly', is_active: true },
    ],
  },
  {
    id: 2, name: 'Landscaping', description: 'Design, installation, and maintenance',
    icon: 'trees', color: '#15803d', is_seasonal: true, season_start: 3, season_end: 11,
    is_active: true, sort_order: 2, service_count: 3,
    services: [
      { id: 5, category: 2, category_name: 'Landscaping', name: 'Mulch Installation', description: 'Premium hardwood mulch, spread and edged', default_price: 3.50, price_type: 'sqft', estimated_duration_minutes: 120, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
      { id: 6, category: 2, category_name: 'Landscaping', name: 'Shrub Trimming', description: 'Shape and trim all shrubs', default_price: 85, price_type: 'hourly', estimated_duration_minutes: 90, is_recurring: true, recurring_frequency: 'monthly', is_active: true },
      { id: 7, category: 2, category_name: 'Landscaping', name: 'Landscape Design & Install', description: 'Custom landscape design with plant installation', default_price: 0, price_type: 'custom', estimated_duration_minutes: 480, is_recurring: false, recurring_frequency: 'one_time', is_active: true },
    ],
  },
  {
    id: 3, name: 'Snow Removal', description: 'Plowing, shoveling, and salt application',
    icon: 'snowflake', color: '#0ea5e9', is_seasonal: true, season_start: 11, season_end: 3,
    is_active: true, sort_order: 3, service_count: 3,
    services: [
      { id: 8, category: 3, category_name: 'Snow Removal', name: 'Driveway Plowing', description: 'Residential driveway snow plowing', default_price: 45, price_type: 'flat', estimated_duration_minutes: 15, is_recurring: true, recurring_frequency: 'weekly', is_active: true },
      { id: 9, category: 3, category_name: 'Snow Removal', name: 'Sidewalk Shoveling & Salt', description: 'Clear sidewalks with ice melt application', default_price: 30, price_type: 'flat', estimated_duration_minutes: 20, is_recurring: true, recurring_frequency: 'weekly', is_active: true },
      { id: 10, category: 3, category_name: 'Snow Removal', name: 'Commercial Lot Plowing', description: 'Full parking lot snow removal', default_price: 175, price_type: 'flat', estimated_duration_minutes: 60, is_recurring: true, recurring_frequency: 'weekly', is_active: true },
    ],
  },
  {
    id: 4, name: 'Cleanups', description: 'Seasonal yard cleanups and debris removal',
    icon: 'trash-2', color: '#d97706', is_seasonal: true, season_start: 3, season_end: 11,
    is_active: true, sort_order: 4, service_count: 2,
    services: [
      { id: 11, category: 4, category_name: 'Cleanups', name: 'Spring Cleanup', description: 'Full yard cleanup: debris removal, bed edging, first mow', default_price: 200, price_type: 'flat', estimated_duration_minutes: 180, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
      { id: 12, category: 4, category_name: 'Cleanups', name: 'Fall Leaf Removal', description: 'Complete leaf removal, bed cleanup, gutter clearing', default_price: 225, price_type: 'flat', estimated_duration_minutes: 240, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
    ],
  },
  {
    id: 5, name: 'Additional Services', description: 'Power washing, gutter cleaning, and more',
    icon: 'wrench', color: '#6366f1', is_seasonal: false, season_start: null, season_end: null,
    is_active: true, sort_order: 5, service_count: 2,
    services: [
      { id: 13, category: 5, category_name: 'Additional Services', name: 'Power Washing', description: 'Driveway, patio, or siding power washing', default_price: 95, price_type: 'hourly', estimated_duration_minutes: 120, is_recurring: false, recurring_frequency: 'one_time', is_active: true },
      { id: 14, category: 5, category_name: 'Additional Services', name: 'Gutter Cleaning', description: 'Clean and flush all gutters and downspouts', default_price: 125, price_type: 'flat', estimated_duration_minutes: 90, is_recurring: true, recurring_frequency: 'seasonal', is_active: true },
    ],
  },
];

// --- Jobs ---
export const demoJobs: Job[] = [
  { id: 1, customer: 1, customer_name: 'Johnson Residence', customer_address: '1425 E Locust St, Davenport, IA', customer_phone: '(563) 555-0142', service: 1, service_name: 'Weekly Mowing', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: fmt(today), scheduled_time: '08:00', estimated_duration: 45, assigned_to: 'Mike', status: 'completed', price: 45, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: fmt(today), actual_duration: 40 },
  { id: 2, customer: 2, customer_name: 'Riverfront Office Park', customer_address: '300 W River Dr, Davenport, IA', customer_phone: '(563) 555-0287', service: 1, service_name: 'Weekly Mowing', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: fmt(today), scheduled_time: '09:00', estimated_duration: 90, assigned_to: 'Mike', status: 'in_progress', price: 120, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: null, actual_duration: null },
  { id: 3, customer: 3, customer_name: 'Peterson Family', customer_address: '2810 N Division St, Davenport, IA', customer_phone: '(563) 555-0193', service: 6, service_name: 'Shrub Trimming', category_name: 'Landscaping', category_color: '#15803d', category_icon: 'trees', scheduled_date: fmt(today), scheduled_time: '11:00', estimated_duration: 90, assigned_to: 'Jake', status: 'scheduled', price: 170, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: null, actual_duration: null },
  { id: 4, customer: 4, customer_name: 'Davenport Community Church', customer_address: '1515 W 35th St, Davenport, IA', customer_phone: '(563) 555-0456', service: 1, service_name: 'Weekly Mowing', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: fmt(today), scheduled_time: '13:00', estimated_duration: 60, assigned_to: 'Mike', status: 'scheduled', price: 85, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: null, actual_duration: null },
  { id: 5, customer: 5, customer_name: 'Williams Property', customer_address: '945 E 53rd St, Davenport, IA', customer_phone: '(563) 555-0321', service: 5, service_name: 'Mulch Installation', category_name: 'Landscaping', category_color: '#15803d', category_icon: 'trees', scheduled_date: daysFromNow(1), scheduled_time: '08:00', estimated_duration: 120, assigned_to: 'Jake', status: 'scheduled', price: 350, is_invoiced: false, is_paid: false, is_recurring: false, completed_at: null, actual_duration: null },
  { id: 6, customer: 6, customer_name: 'Kimberly Road Dental', customer_address: '3622 Kimberly Rd, Davenport, IA', customer_phone: '(563) 555-0789', service: 1, service_name: 'Weekly Mowing', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: daysFromNow(1), scheduled_time: '10:00', estimated_duration: 45, assigned_to: 'Mike', status: 'scheduled', price: 55, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: null, actual_duration: null },
  { id: 7, customer: 1, customer_name: 'Johnson Residence', customer_address: '1425 E Locust St, Davenport, IA', customer_phone: '(563) 555-0142', service: 4, service_name: 'Weed Control Treatment', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: daysFromNow(2), scheduled_time: '08:00', estimated_duration: 25, assigned_to: 'Jake', status: 'scheduled', price: 55, is_invoiced: false, is_paid: false, is_recurring: true, completed_at: null, actual_duration: null },
  { id: 8, customer: 7, customer_name: 'QC Brewing Company', customer_address: '208 E River Dr, Davenport, IA', customer_phone: '(563) 555-0654', service: 13, service_name: 'Power Washing', category_name: 'Additional Services', category_color: '#6366f1', category_icon: 'wrench', scheduled_date: daysAgo(1), scheduled_time: '09:00', estimated_duration: 120, assigned_to: 'Mike', status: 'completed', price: 190, is_invoiced: true, is_paid: true, is_recurring: false, completed_at: daysAgo(1), actual_duration: 105 },
  { id: 9, customer: 3, customer_name: 'Peterson Family', customer_address: '2810 N Division St, Davenport, IA', customer_phone: '(563) 555-0193', service: 1, service_name: 'Weekly Mowing', category_name: 'Lawn Care', category_color: '#16a34a', category_icon: 'leaf', scheduled_date: daysAgo(2), scheduled_time: '08:00', estimated_duration: 45, assigned_to: 'Mike', status: 'completed', price: 45, is_invoiced: true, is_paid: false, is_recurring: true, completed_at: daysAgo(2), actual_duration: 42 },
];

// --- Estimates ---
export const demoEstimates: Estimate[] = [
  {
    id: 1, customer: 5, customer_name: 'Williams Property', title: 'Full Landscape Renovation',
    description: 'Complete front and back yard redesign with new plantings',
    line_items: [
      { service: 'Landscape Design', price: 500, notes: 'Custom design with 3D rendering' },
      { service: 'Plant Material', price: 1200, notes: '12 shrubs, 24 perennials, 4 ornamental trees' },
      { service: 'Installation Labor', price: 1800, notes: '3-day install' },
      { service: 'Mulch (15 yards)', price: 675, notes: 'Premium hardwood mulch' },
    ],
    total: 4175, status: 'sent', valid_until: daysFromNow(14),
    sent_at: daysAgo(3), responded_at: null, converted_to_jobs: false,
    created_by: 1, created_at: daysAgo(5), updated_at: daysAgo(3),
  },
  {
    id: 2, customer: 2, customer_name: 'Riverfront Office Park', title: 'Annual Maintenance Contract 2026',
    description: 'Full-season lawn care and landscape maintenance',
    line_items: [
      { service: 'Weekly Mowing (Apr-Oct)', price: 3360, frequency: '28 weeks', notes: '$120/visit' },
      { service: 'Fertilization (5-step)', price: 780, frequency: '5 applications' },
      { service: 'Spring/Fall Cleanup', price: 850, frequency: '2 visits' },
      { service: 'Shrub Trimming', price: 1020, frequency: '6 visits', notes: 'Monthly Apr-Sep' },
    ],
    total: 6010, status: 'accepted', valid_until: daysAgo(10),
    sent_at: daysAgo(20), responded_at: daysAgo(15), converted_to_jobs: true,
    created_by: 1, created_at: daysAgo(25), updated_at: daysAgo(15),
  },
  {
    id: 3, customer: 8, customer_name: 'Bettendorf Heights HOA', title: 'Common Area Snow Removal',
    description: 'Winter snow removal for sidewalks and parking areas',
    line_items: [
      { service: 'Parking Lot Plowing', price: 275, frequency: 'Per event' },
      { service: 'Sidewalk Clearing & Salt', price: 150, frequency: 'Per event' },
    ],
    total: 425, status: 'draft', valid_until: null,
    sent_at: null, responded_at: null, converted_to_jobs: false,
    created_by: 1, created_at: daysAgo(1), updated_at: daysAgo(1),
  },
];

// --- Invoices ---
export const demoInvoices: Invoice[] = [
  {
    id: 1, customer: 2, customer_name: 'Riverfront Office Park', invoice_number: 'INV-2026-0042',
    subtotal: 620, tax_rate: 7, tax_amount: 43.40, total: 663.40, amount_paid: 663.40,
    balance_due: 0, status: 'paid', issued_date: daysAgo(15), due_date: daysAgo(1),
    paid_date: daysAgo(5), notes: 'February maintenance services', created_at: daysAgo(15), updated_at: daysAgo(5),
  },
  {
    id: 2, customer: 1, customer_name: 'Johnson Residence', invoice_number: 'INV-2026-0043',
    subtotal: 245, tax_rate: 7, tax_amount: 17.15, total: 262.15, amount_paid: 0,
    balance_due: 262.15, status: 'sent', issued_date: daysAgo(7), due_date: daysFromNow(8),
    paid_date: null, notes: 'January lawn care services', created_at: daysAgo(7), updated_at: daysAgo(7),
  },
  {
    id: 3, customer: 3, customer_name: 'Peterson Family', invoice_number: 'INV-2026-0044',
    subtotal: 180, tax_rate: 7, tax_amount: 12.60, total: 192.60, amount_paid: 100,
    balance_due: 92.60, status: 'partial', issued_date: daysAgo(20), due_date: daysAgo(5),
    paid_date: null, notes: 'Shrub trimming and mowing', created_at: daysAgo(20), updated_at: daysAgo(10),
  },
  {
    id: 4, customer: 7, customer_name: 'QC Brewing Company', invoice_number: 'INV-2026-0045',
    subtotal: 190, tax_rate: 7, tax_amount: 13.30, total: 203.30, amount_paid: 0,
    balance_due: 203.30, status: 'overdue', issued_date: daysAgo(35), due_date: daysAgo(5),
    paid_date: null, notes: 'Power washing - patio and entrance', created_at: daysAgo(35), updated_at: daysAgo(35),
  },
  {
    id: 5, customer: 4, customer_name: 'Davenport Community Church', invoice_number: 'INV-2026-0046',
    subtotal: 510, tax_rate: 0, tax_amount: 0, total: 510, amount_paid: 510,
    balance_due: 0, status: 'paid', issued_date: daysAgo(30), due_date: daysAgo(16),
    paid_date: daysAgo(18), notes: 'Monthly grounds maintenance - January', created_at: daysAgo(30), updated_at: daysAgo(18),
  },
];

// --- Reminders ---
export const demoReminders: Reminder[] = [
  {
    id: 1, customer: 5, customer_name: 'Williams Property', customer_phone: '(563) 555-0321',
    activity: null, title: 'Follow up on landscape estimate', description: 'Sent estimate 3 days ago, no response yet',
    reminder_date: daysAgo(1), reminder_time: '09:00', priority: 'high', status: 'pending',
    original_date: null, snooze_count: 0, created_by: 1, created_by_name: 'Admin',
    created_at: daysAgo(3), updated_at: daysAgo(3), completed_at: null, completed_by: null,
    is_overdue: true, is_today: false,
  },
  {
    id: 2, customer: 7, customer_name: 'QC Brewing Company', customer_phone: '(563) 555-0654',
    activity: null, title: 'Collect overdue payment', description: 'INV-2026-0045 is 5 days past due ($203.30)',
    reminder_date: fmt(today), reminder_time: '10:00', priority: 'high', status: 'pending',
    original_date: null, snooze_count: 0, created_by: 1, created_by_name: 'Admin',
    created_at: daysAgo(2), updated_at: daysAgo(2), completed_at: null, completed_by: null,
    is_overdue: false, is_today: true,
  },
  {
    id: 3, customer: 8, customer_name: 'Bettendorf Heights HOA', customer_phone: '(563) 555-0890',
    activity: null, title: 'Finalize snow removal contract', description: 'Draft estimate needs review before sending',
    reminder_date: daysFromNow(2), reminder_time: '14:00', priority: 'medium', status: 'pending',
    original_date: null, snooze_count: 0, created_by: 1, created_by_name: 'Admin',
    created_at: daysAgo(1), updated_at: daysAgo(1), completed_at: null, completed_by: null,
    is_overdue: false, is_today: false,
  },
];

// --- Customers (list view) ---
export const demoCustomers: CustomerListItem[] = [
  { id: 1, business_name: 'Johnson Residence', city: 'Davenport', state: 'IA', primary_contact: 'Sarah Johnson', main_phone: '(563) 555-0142', main_email: 'sjohnson@email.com', region: 1, region_name: 'Central Davenport', last_call_date: daysAgo(7), next_call_date: daysFromNow(7), current_note: { id: 1, content: 'Prefers Tuesday morning mowing', created_at: daysAgo(30) }, pending_reminders_count: 0, is_active: true },
  { id: 2, business_name: 'Riverfront Office Park', city: 'Davenport', state: 'IA', primary_contact: 'Tom Richards', main_phone: '(563) 555-0287', main_email: 'trichards@riverfrontpark.com', region: 1, region_name: 'Central Davenport', last_call_date: daysAgo(15), next_call_date: daysFromNow(15), current_note: { id: 2, content: 'Annual contract - renewed for 2026', created_at: daysAgo(15) }, pending_reminders_count: 0, is_active: true },
  { id: 3, business_name: 'Peterson Family', city: 'Davenport', state: 'IA', primary_contact: 'Mark Peterson', main_phone: '(563) 555-0193', main_email: 'mpeterson@email.com', region: 2, region_name: 'North Davenport', last_call_date: daysAgo(10), next_call_date: null, current_note: { id: 3, content: 'Has 2 dogs - keep gate closed', created_at: daysAgo(60) }, pending_reminders_count: 0, is_active: true },
  { id: 4, business_name: 'Davenport Community Church', city: 'Davenport', state: 'IA', primary_contact: 'Pastor Dave Miller', main_phone: '(563) 555-0456', main_email: 'office@dvptchurch.org', region: 2, region_name: 'North Davenport', last_call_date: daysAgo(5), next_call_date: daysFromNow(25), current_note: { id: 4, content: 'Non-profit - tax exempt', created_at: daysAgo(90) }, pending_reminders_count: 0, is_active: true },
  { id: 5, business_name: 'Williams Property', city: 'Davenport', state: 'IA', primary_contact: 'Carol Williams', main_phone: '(563) 555-0321', main_email: 'cwilliams@email.com', region: 3, region_name: 'East Davenport', last_call_date: daysAgo(3), next_call_date: daysFromNow(1), current_note: { id: 5, content: 'Interested in full landscape renovation - estimate sent', created_at: daysAgo(5) }, pending_reminders_count: 1, is_active: true },
  { id: 6, business_name: 'Kimberly Road Dental', city: 'Davenport', state: 'IA', primary_contact: 'Dr. Lisa Chen', main_phone: '(563) 555-0789', main_email: 'office@kimberlydentalcare.com', region: 3, region_name: 'East Davenport', last_call_date: daysAgo(14), next_call_date: daysFromNow(14), current_note: null, pending_reminders_count: 0, is_active: true },
  { id: 7, business_name: 'QC Brewing Company', city: 'Davenport', state: 'IA', primary_contact: 'Jake Torres', main_phone: '(563) 555-0654', main_email: 'jake@qcbrewing.com', region: 1, region_name: 'Central Davenport', last_call_date: daysAgo(35), next_call_date: daysAgo(5), current_note: { id: 7, content: 'OVERDUE - $203.30 outstanding', created_at: daysAgo(5) }, pending_reminders_count: 1, is_active: true },
  { id: 8, business_name: 'Bettendorf Heights HOA', city: 'Bettendorf', state: 'IA', primary_contact: 'Nancy Olsen', main_phone: '(563) 555-0890', main_email: 'nolsen@bettendorfhoa.com', region: 4, region_name: 'Bettendorf', last_call_date: daysAgo(1), next_call_date: daysFromNow(5), current_note: { id: 8, content: 'Potential large snow removal contract', created_at: daysAgo(1) }, pending_reminders_count: 1, is_active: true },
];

// --- Full Customer Detail objects (for /customers/:id) ---
function customerDetail(list: CustomerListItem, address: string, extra?: Partial<Customer>): Customer {
  return {
    id: list.id,
    business_name: list.business_name,
    bill_to_address: address,
    city: list.city,
    state: list.state,
    zip_code: '52801',
    primary_contact: list.primary_contact,
    main_email: list.main_email,
    main_phone: list.main_phone,
    secondary_phone: '',
    fax: '',
    fleet_description: '',
    region: list.region,
    region_name: list.region_name,
    latitude: null,
    longitude: null,
    last_call_date: list.last_call_date,
    next_call_date: list.next_call_date,
    custom_fields: {},
    notes: list.current_note ? [{ ...list.current_note, created_by: 1, created_by_name: 'Admin', is_current: true, parent_note: null }] : [],
    current_note: list.current_note ? { ...list.current_note, created_by: 1, created_by_name: 'Admin', is_current: true, parent_note: null } : null,
    created_by: 1,
    created_by_name: 'Admin',
    created_at: daysAgo(120),
    updated_at: daysAgo(1),
    is_active: list.is_active,
    activity_count: 0,
    pending_reminders_count: list.pending_reminders_count,
    ...extra,
  };
}

export const demoCustomerDetails: Customer[] = [
  customerDetail(demoCustomers[0], '1425 E Locust St', { zip_code: '52803', fleet_description: 'Standard residential lot ~8,000 sqft. Front and back yard.' }),
  customerDetail(demoCustomers[1], '300 W River Dr', { zip_code: '52801', fleet_description: '3-building office park, ~2 acres total. 2 parking lots, central courtyard.' }),
  customerDetail(demoCustomers[2], '2810 N Division St', { zip_code: '52804' }),
  customerDetail(demoCustomers[3], '1515 W 35th St', { zip_code: '52806', fax: '(563) 555-0457' }),
  customerDetail(demoCustomers[4], '945 E 53rd St', { zip_code: '52807' }),
  customerDetail(demoCustomers[5], '3622 Kimberly Rd', { zip_code: '52806' }),
  customerDetail(demoCustomers[6], '208 E River Dr', { zip_code: '52801' }),
  customerDetail(demoCustomers[7], '4500 Tanglefoot Ln', { city: 'Bettendorf', zip_code: '52722' }),
];

// --- Demo Activities ---
export const demoActivities: Activity[] = [
  { id: 1, customer: 1, customer_name: 'Johnson Residence', activity_type: 1, activity_type_name: 'Phone Call', activity_type_icon: 'phone', activity_type_color: '#3b82f6', subject: 'Scheduling call', notes: 'Confirmed Tuesday morning mowing schedule for the season', outcome: 'completed', activity_datetime: daysAgo(7) + 'T10:00:00Z', duration_minutes: 5, custom_fields: {}, created_by: 1, created_by_name: 'Admin', created_at: daysAgo(7), updated_at: daysAgo(7) },
  { id: 2, customer: 7, customer_name: 'QC Brewing Company', activity_type: 1, activity_type_name: 'Phone Call', activity_type_icon: 'phone', activity_type_color: '#3b82f6', subject: 'Payment reminder', notes: 'Left voicemail about overdue invoice INV-2026-0045', outcome: 'left_message', activity_datetime: daysAgo(3) + 'T14:00:00Z', duration_minutes: 2, custom_fields: {}, created_by: 1, created_by_name: 'Admin', created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: 3, customer: 5, customer_name: 'Williams Property', activity_type: 2, activity_type_name: 'Site Visit', activity_type_icon: 'map-pin', activity_type_color: '#16a34a', subject: 'Estimate walkthrough', notes: 'Walked the property with Carol. Discussed full landscape renovation options.', outcome: 'interested', activity_datetime: daysAgo(5) + 'T09:00:00Z', duration_minutes: 45, custom_fields: {}, created_by: 1, created_by_name: 'Admin', created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: 4, customer: 2, customer_name: 'Riverfront Office Park', activity_type: 1, activity_type_name: 'Phone Call', activity_type_icon: 'phone', activity_type_color: '#3b82f6', subject: 'Contract renewal', notes: 'Renewed annual maintenance contract for 2026. Same terms.', outcome: 'completed', activity_datetime: daysAgo(15) + 'T11:00:00Z', duration_minutes: 15, custom_fields: {}, created_by: 1, created_by_name: 'Admin', created_at: daysAgo(15), updated_at: daysAgo(15) },
  { id: 5, customer: 8, customer_name: 'Bettendorf Heights HOA', activity_type: 3, activity_type_name: 'Email', activity_type_icon: 'mail', activity_type_color: '#8b5cf6', subject: 'Snow removal estimate', notes: 'Sent draft snow removal estimate for review', outcome: 'follow_up_needed', activity_datetime: daysAgo(1) + 'T16:00:00Z', duration_minutes: 10, custom_fields: {}, created_by: 1, created_by_name: 'Admin', created_at: daysAgo(1), updated_at: daysAgo(1) },
];

// --- Dashboard Summary ---
export const demoDashboardSummary: OutdoorDashboardSummary = {
  today: { total_jobs: 4, completed: 1, in_progress: 1, scheduled: 2, revenue: 45 },
  this_week: { total_jobs: 9, completed: 3, revenue: 470 },
  this_month: { revenue: 2839.45, jobs_completed: 18 },
  outstanding: { invoices_count: 3, total_owed: 558.05, overdue_count: 1, overdue_amount: 203.30 },
};

// --- Check if we should use demo data ---
// Demo mode only activates when VITE_API_URL is explicitly set to 'demo' or not set at all.
// When developing locally against a real backend, set VITE_API_URL=http://localhost:8000
const apiUrl = import.meta.env.VITE_API_URL || '';
export const isDemoMode = !apiUrl || apiUrl === 'demo';
