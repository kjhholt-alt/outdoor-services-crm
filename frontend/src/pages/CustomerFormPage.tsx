import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { customersApi, regionsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Input, TextArea, Select } from '../components/common/Input';
import type { Customer, Region } from '../types';

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = id && id !== 'new';

  const [formData, setFormData] = useState({
    business_name: '',
    bill_to_address: '',
    city: '',
    state: '',
    zip_code: '',
    primary_contact: '',
    main_email: '',
    main_phone: '',
    secondary_phone: '',
    fax: '',
    fleet_description: '',
    region: '',
  });

  const { data: customer, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(parseInt(id!, 10)),
    enabled: !!isEditing,
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ['regions'],
    queryFn: regionsApi.list,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        business_name: customer.business_name || '',
        bill_to_address: customer.bill_to_address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        primary_contact: customer.primary_contact || '',
        main_email: customer.main_email || '',
        main_phone: customer.main_phone || '',
        secondary_phone: customer.secondary_phone || '',
        fax: customer.fax || '',
        fleet_description: customer.fleet_description || '',
        region: customer.region?.toString() || '',
      });
    }
  }, [customer]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => customersApi.create(data),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/customers/${newCustomer.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customersApi.update(parseInt(id!, 10), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      navigate(`/customers/${id}`);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      ...formData,
      region: formData.region ? parseInt(formData.region, 10) : null,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && loadingCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Customer' : 'Add New Customer'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Business Information" />
          <CardContent className="space-y-4">
            <Input
              label="Business Name *"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              placeholder="Enter business name"
            />

            <Select
              label="Region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select region...' },
                ...(regions?.map((r) => ({
                  value: r.id.toString(),
                  label: r.name,
                })) || []),
              ]}
            />

            <TextArea
              label="Address"
              name="bill_to_address"
              value={formData.bill_to_address}
              onChange={handleChange}
              placeholder="Enter street address"
              rows={2}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
              <Input
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="ZIP"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Contact Information" />
          <CardContent className="space-y-4">
            <Input
              label="Primary Contact"
              name="primary_contact"
              value={formData.primary_contact}
              onChange={handleChange}
              placeholder="Contact name"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Main Phone"
                name="main_phone"
                value={formData.main_phone}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                type="tel"
              />
              <Input
                label="Secondary Phone"
                name="secondary_phone"
                value={formData.secondary_phone}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                type="tel"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                name="main_email"
                value={formData.main_email}
                onChange={handleChange}
                placeholder="email@example.com"
                type="email"
              />
              <Input
                label="Fax"
                name="fax"
                value={formData.fax}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                type="tel"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Additional Information" />
          <CardContent>
            <TextArea
              label="Fleet Description"
              name="fleet_description"
              value={formData.fleet_description}
              onChange={handleChange}
              placeholder="Describe the customer's fleet, equipment, or other relevant details..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
