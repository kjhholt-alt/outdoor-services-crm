import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { invoicesApi, customersApi, jobsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Input, TextArea, Select } from '../components/common/Input';
import { PageTransition } from '../components/common/PageTransition';
import type { CustomerListItem, Job } from '../types';

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customer: '',
    subtotal: '',
    tax_rate: '7',
    issued_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    selectedJobs: [] as number[],
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.list(),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => jobsApi.list({ status: 'completed' }),
  });

  const customers: CustomerListItem[] = customersData?.results ?? customersData ?? [];
  const completedJobs: Job[] = (jobsData?.results ?? jobsData ?? []) as Job[];

  // Filter jobs for selected customer that aren't invoiced yet
  const customerJobs = formData.customer
    ? completedJobs.filter(j => j.customer === parseInt(formData.customer, 10) && !j.is_invoiced)
    : [];

  const subtotal = parseFloat(formData.subtotal) || 0;
  const taxRate = parseFloat(formData.tax_rate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Set default due date 15 days from issue date
  const setDefaultDueDate = (issueDate: string) => {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created!');
      navigate('/invoices');
    },
    onError: () => {
      toast.error('Failed to create invoice');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-set due date when issue date changes (always update if user hasn't manually set one)
      if (name === 'issued_date') {
        updated.due_date = setDefaultDueDate(value);
      }

      // Auto-fill notes with payment terms when customer is selected
      if (name === 'customer' && value && !prev.notes) {
        const cust = customers.find(c => c.id === parseInt(value, 10));
        if (cust) {
          updated.notes = `Payment due within 15 days of invoice date. Please make checks payable to All Around Town Outdoor Services.`;
        }
      }

      return updated;
    });
  };

  const toggleJob = (jobId: number) => {
    setFormData(prev => {
      const selected = prev.selectedJobs.includes(jobId)
        ? prev.selectedJobs.filter(id => id !== jobId)
        : [...prev.selectedJobs, jobId];

      // Recalculate subtotal from selected jobs
      const jobSubtotal = selected.reduce((sum, id) => {
        const job = customerJobs.find(j => j.id === id);
        return sum + (job ? Number(job.price) : 0);
      }, 0);

      return { ...prev, selectedJobs: selected, subtotal: jobSubtotal.toFixed(2) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      customer: parseInt(formData.customer, 10),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      amount_paid: 0,
      balance_due: total,
      status: 'draft',
      issued_date: formData.issued_date,
      due_date: formData.due_date || setDefaultDueDate(formData.issued_date),
      notes: formData.notes,
      job_ids: formData.selectedJobs,
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
            New Invoice
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Invoice Details" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Issue Date *"
                  name="issued_date"
                  type="date"
                  value={formData.issued_date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Due Date *"
                  name="due_date"
                  type="date"
                  value={formData.due_date || setDefaultDueDate(formData.issued_date)}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Completed Jobs for selected customer */}
          {formData.customer && customerJobs.length > 0 && (
            <Card className="mt-6">
              <CardHeader title="Attach Completed Jobs" subtitle="Select jobs to include on this invoice" />
              <CardContent className="space-y-2">
                {customerJobs.map(job => (
                  <label
                    key={job.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.selectedJobs.includes(job.id)
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedJobs.includes(job.id)}
                      onChange={() => toggleJob(job.id)}
                      className="w-4 h-4 rounded text-green-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">{job.service_name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {job.scheduled_date}
                      </span>
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      ${Number(job.price).toFixed(2)}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader title="Pricing" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Subtotal ($) *"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
                <Input
                  label="Tax Rate (%)"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  placeholder="7"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax ({taxRate}%)</span>
                  <span className="text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-green-700 dark:text-green-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <TextArea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Payment terms, special instructions..."
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
              Create Invoice
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
