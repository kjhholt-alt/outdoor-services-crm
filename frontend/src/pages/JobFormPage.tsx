import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { jobsApi, customersApi, serviceCategoriesApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Input, TextArea, Select } from '../components/common/Input';
import { PageTransition } from '../components/common/PageTransition';
import type { CustomerListItem, ServiceCategory } from '../types';

export function JobFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customer: '',
    service: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    estimated_duration: '60',
    assigned_to: '',
    price: '',
    notes: '',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  });

  const { data: categoriesData } = useQuery<ServiceCategory[]>({
    queryKey: ['categories'],
    queryFn: serviceCategoriesApi.list,
  });

  const customers: CustomerListItem[] = customersData?.results ?? customersData ?? [];
  const categories: ServiceCategory[] = categoriesData ?? [];
  const allServices = categories.flatMap(c => c.services.map(s => ({ ...s, categoryName: c.name })));

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job scheduled!');
      navigate('/jobs');
    },
    onError: () => {
      toast.error('Failed to create job');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill price and duration when service is selected
    if (name === 'service' && value) {
      const svc = allServices.find(s => s.id === parseInt(value, 10));
      if (svc) {
        setFormData(prev => ({
          ...prev,
          service: value,
          price: svc.default_price > 0 ? svc.default_price.toString() : prev.price,
          estimated_duration: svc.estimated_duration_minutes.toString(),
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      customer: parseInt(formData.customer, 10),
      service: parseInt(formData.service, 10),
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      estimated_duration: parseInt(formData.estimated_duration, 10),
      assigned_to: formData.assigned_to || '',
      price: parseFloat(formData.price) || 0,
      notes: formData.notes,
      status: 'scheduled',
    };
    createMutation.mutate(data);
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schedule New Job
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Job Details" />
            <CardContent className="space-y-4">
              <Select
                label="Customer *"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                required
                options={[
                  { value: '', label: 'Select a customer...' },
                  ...customers.map(c => ({ value: c.id.toString(), label: c.business_name })),
                ]}
              />

              <Select
                label="Service *"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                options={[
                  { value: '', label: 'Select a service...' },
                  ...allServices.map(s => ({
                    value: s.id.toString(),
                    label: `${s.name} (${s.categoryName}) - $${s.default_price}`,
                  })),
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Scheduled Date *"
                  name="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Scheduled Time"
                  name="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Duration (minutes)"
                  name="estimated_duration"
                  type="number"
                  value={formData.estimated_duration}
                  onChange={handleChange}
                  min="5"
                />
                <Input
                  label="Price ($)"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <Input
                  label="Assigned To"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  placeholder="e.g. Mike, Jake"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Notes" />
            <CardContent>
              <TextArea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Special instructions, gate codes, customer notes..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={createMutation.isPending}
            >
              Schedule Job
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
