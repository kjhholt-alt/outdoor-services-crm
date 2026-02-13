/**
 * Demo report data for the Reports page.
 * Realistic seasonal patterns for a Davenport, Iowa outdoor services company.
 */

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  jobs: number;
}

export interface JobsByStatus {
  status: string;
  count: number;
  color: string;
}

export interface RevenueByCategory {
  category: string;
  revenue: number;
  color: string;
}

export interface CrewMember {
  name: string;
  jobs: number;
  revenue: number;
}

// 2025 monthly revenue data with seasonal patterns
// Peaks Jun-Sep, dips Dec-Feb
export const monthlyRevenue2025: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 2100, jobs: 12 },
  { month: 'Feb', revenue: 1800, jobs: 10 },
  { month: 'Mar', revenue: 4200, jobs: 22 },
  { month: 'Apr', revenue: 6800, jobs: 35 },
  { month: 'May', revenue: 8900, jobs: 42 },
  { month: 'Jun', revenue: 11200, jobs: 52 },
  { month: 'Jul', revenue: 12400, jobs: 56 },
  { month: 'Aug', revenue: 10800, jobs: 48 },
  { month: 'Sep', revenue: 9200, jobs: 44 },
  { month: 'Oct', revenue: 7100, jobs: 38 },
  { month: 'Nov', revenue: 4600, jobs: 25 },
  { month: 'Dec', revenue: 2900, jobs: 16 },
];

// Previous year for comparison
export const monthlyRevenue2024: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 1800, jobs: 10 },
  { month: 'Feb', revenue: 1500, jobs: 8 },
  { month: 'Mar', revenue: 3800, jobs: 19 },
  { month: 'Apr', revenue: 6200, jobs: 31 },
  { month: 'May', revenue: 8100, jobs: 38 },
  { month: 'Jun', revenue: 10400, jobs: 48 },
  { month: 'Jul', revenue: 11600, jobs: 52 },
  { month: 'Aug', revenue: 9800, jobs: 44 },
  { month: 'Sep', revenue: 8400, jobs: 40 },
  { month: 'Oct', revenue: 6500, jobs: 34 },
  { month: 'Nov', revenue: 4100, jobs: 22 },
  { month: 'Dec', revenue: 2500, jobs: 14 },
];

export const jobsByStatus: JobsByStatus[] = [
  { status: 'Completed', count: 156, color: '#16a34a' },
  { status: 'Scheduled', count: 24, color: '#3b82f6' },
  { status: 'In Progress', count: 8, color: '#f59e0b' },
  { status: 'Cancelled', count: 5, color: '#6b7280' },
  { status: 'Weather Delay', count: 12, color: '#0ea5e9' },
];

export const revenueByCategory: RevenueByCategory[] = [
  { category: 'Lawn Care', revenue: 45000, color: '#16a34a' },
  { category: 'Landscaping', revenue: 22000, color: '#15803d' },
  { category: 'Snow Removal', revenue: 18000, color: '#0ea5e9' },
  { category: 'Cleanups', revenue: 12000, color: '#d97706' },
  { category: 'Additional', revenue: 8000, color: '#6366f1' },
];

export const crewProductivity: CrewMember[] = [
  { name: 'Mike', jobs: 142, revenue: 38000 },
  { name: 'Jake', jobs: 98, revenue: 28000 },
  { name: 'Sarah', jobs: 67, revenue: 19000 },
  { name: 'Tom', jobs: 48, revenue: 12000 },
];

// Summary stats
export const totalRevenue = monthlyRevenue2025.reduce((sum, m) => sum + m.revenue, 0);
export const totalJobs = monthlyRevenue2025.reduce((sum, m) => sum + m.jobs, 0);
export const avgJobValue = Math.round(totalRevenue / totalJobs);
export const topCategory = revenueByCategory[0].category;
