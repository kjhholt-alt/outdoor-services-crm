import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { estimatesApi, customersApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Input, TextArea, Select } from '../components/common/Input';
import { PageTransition } from '../components/common/PageTransition';
import type { CustomerListItem } from '../types';

interface LineItem {
  service: string;
  price: string;
  frequency: string;
  notes: string;
}

export function EstimateFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customer: '',
    title: '',
    description: '',
    valid_until: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { service: '', price: '', frequency: '', notes: '' },
  ]);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  });

  const customers: CustomerListItem[] = customersData?.results ?? customersData ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => estimatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created!');
      navigate('/estimates');
    },
    onError: () => {
      toast.error('Failed to create estimate');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (idx: number, field: keyof LineItem, value: string) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { service: '', price: '', frequency: '', notes: '' }]);
  };

  const removeLineItem = (idx: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      customer: parseInt(formData.customer, 10),
      title: formData.title,
      description: formData.description,
      valid_until: formData.valid_until || null,
      status: 'draft',
      line_items: lineItems
        .filter(item => item.service.trim())
        .map(item => ({
          service: item.service,
          price: parseFloat(item.price) || 0,
          frequency: item.frequency || undefined,
          notes: item.notes || undefined,
        })),
      total,
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
            New Estimate
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Estimate Details" />
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

              <Input
                label="Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Full Landscape Renovation"
              />

              <TextArea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the scope of work..."
                rows={3}
              />

              <Input
                label="Valid Until"
                name="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Line Items"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={addLineItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              }
            />
            <CardContent className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Service / Item *"
                      value={item.service}
                      onChange={e => handleLineItemChange(idx, 'service', e.target.value)}
                      placeholder="e.g. Weekly Mowing"
                    />
                    <Input
                      label="Price ($) *"
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={e => handleLineItemChange(idx, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                    <Input
                      label="Frequency"
                      value={item.frequency}
                      onChange={e => handleLineItemChange(idx, 'frequency', e.target.value)}
                      placeholder="e.g. 28 weeks, Per event"
                    />
                    <Input
                      label="Notes"
                      value={item.notes}
                      onChange={e => handleLineItemChange(idx, 'notes', e.target.value)}
                      placeholder="Additional details"
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="mt-7 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Estimate Total</span>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>
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
              Create Estimate
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
