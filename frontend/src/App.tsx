import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/common/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomerFormPage } from './pages/CustomerFormPage';
import { JobsPage } from './pages/JobsPage';
import { ServicesPage } from './pages/ServicesPage';
import { EstimatesPage } from './pages/EstimatesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { RemindersPage } from './pages/RemindersPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { RoutesPage } from './pages/RoutesPage';
import { ImportExportPage } from './pages/ImportExportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/estimates" element={<EstimatesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/import" element={<ImportExportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
