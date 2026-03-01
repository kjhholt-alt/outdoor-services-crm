import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { serviceCategoriesApi, api } from '../api/client';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, TextArea } from '../components/common/Input';
import { PageTransition } from '../components/common/PageTransition';
import type { ServiceCategory } from '../types';

export function SettingsPage() {
  const queryClient = useQueryClient();

  // Company info stored in localStorage (could be backend settings model later)
  const [company, setCompany] = useState(() => {
    const saved = localStorage.getItem('aatos_company_settings');
    return saved ? JSON.parse(saved) : {
      name: 'All Around Town Outdoor Services',
      address: 'Davenport, Iowa',
      phone: '(563) 555-0100',
      email: 'info@aatos-qc.com',
      taxRate: '7',
      invoicePrefix: 'INV-',
      invoiceTerms: 'Payment due within 15 days of invoice date. Late payments subject to 1.5% monthly interest.',
    };
  });

  const saveCompanySettings = () => {
    localStorage.setItem('aatos_company_settings', JSON.stringify(company));
    toast.success('Company settings saved!');
  };

  // Service categories
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => serviceCategoriesApi.list(),
  });

  const categories: ServiceCategory[] = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  const addServiceMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/api/services/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Service added!');
      setNewServiceName('');
      setNewServicePrice('');
    },
    onError: () => {
      toast.error('Failed to add service');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/services/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Service removed');
    },
    onError: () => {
      toast.error('Failed to remove service');
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Configure your business</p>
          </div>
        </div>

        {/* Company Information */}
        <Card>
          <CardHeader title="Company Information" subtitle="Your business details shown on invoices and estimates" />
          <CardContent className="space-y-4">
            <Input
              label="Business Name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
            <Input
              label="Address"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={saveCompanySettings}
            >
              Save Company Info
            </Button>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader title="Invoice Settings" subtitle="Default values for new invoices" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Tax Rate (%)"
                type="number"
                step="0.01"
                value={company.taxRate}
                onChange={(e) => setCompany({ ...company, taxRate: e.target.value })}
              />
              <Input
                label="Invoice Prefix"
                value={company.invoicePrefix}
                onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })}
              />
            </div>
            <TextArea
              label="Default Payment Terms"
              value={company.invoiceTerms}
              onChange={(e) => setCompany({ ...company, invoiceTerms: e.target.value })}
              rows={3}
            />
            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={saveCompanySettings}
            >
              Save Invoice Settings
            </Button>
          </CardContent>
        </Card>

        {/* Service Types */}
        <Card>
          <CardHeader title="Service Types" subtitle="Manage the services you offer" />
          <CardContent className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                  <span className="text-xs text-gray-400">{cat.services?.length ?? 0} services</span>
                </div>
                <div className="space-y-1.5">
                  {cat.services?.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{svc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {svc.price_type === 'custom' ? 'Custom' : `$${Number(svc.default_price).toFixed(0)}`}
                          {svc.price_type === 'hourly' ? '/hr' : svc.price_type === 'sqft' ? '/sqft' : ''}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${svc.name}"?`)) {
                              deleteServiceMutation.mutate(svc.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add new service */}
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Service</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Service Name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g., Gutter Cleaning"
                />
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm mt-6"
                >
                  <option value="">Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex items-end gap-2">
                  <Input
                    label="Price ($)"
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="0"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    className="mb-0.5"
                    leftIcon={<Plus className="w-4 h-4" />}
                    disabled={!newServiceName || !newServiceCategory}
                    onClick={() => {
                      addServiceMutation.mutate({
                        name: newServiceName,
                        category: parseInt(newServiceCategory),
                        default_price: parseFloat(newServicePrice) || 0,
                        price_type: 'flat',
                        estimated_duration_minutes: 60,
                      });
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
