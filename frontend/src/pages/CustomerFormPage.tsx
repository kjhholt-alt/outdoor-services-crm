import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { customersApi, regionsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Input, TextArea, Select } from '../components/common/Input';
import type { Customer, Region } from '../types';

// Zip-to-city/state lookup for the QC area — auto-fills city and state from zip code
const ZIP_LOOKUP: Record<string, { city: string; state: string }> = {
  '52748': { city: 'Eldridge', state: 'IA' },
  '52753': { city: 'LeClaire', state: 'IA' },
  '52722': { city: 'Bettendorf', state: 'IA' },
  '52801': { city: 'Davenport', state: 'IA' },
  '52802': { city: 'Davenport', state: 'IA' },
  '52803': { city: 'Davenport', state: 'IA' },
  '52804': { city: 'Davenport', state: 'IA' },
  '52806': { city: 'Davenport', state: 'IA' },
  '52807': { city: 'Davenport', state: 'IA' },
  '52809': { city: 'Davenport', state: 'IA' },
  '52761': { city: 'Muscatine', state: 'IA' },
  '52768': { city: 'Princeton', state: 'IA' },
  '52747': { city: 'Donahue', state: 'IA' },
  '61201': { city: 'Rock Island', state: 'IL' },
  '61244': { city: 'East Moline', state: 'IL' },
  '61265': { city: 'Moline', state: 'IL' },
  '61264': { city: 'Milan', state: 'IL' },
  '52728': { city: 'Blue Grass', state: 'IA' },
  '52726': { city: 'Bettendorf', state: 'IA' },
  '52732': { city: 'Clinton', state: 'IA' },
  '52745': { city: 'Dixon', state: 'IA' },
  '52750': { city: 'Grand Mound', state: 'IA' },
  '52756': { city: 'Long Grove', state: 'IA' },
  '52765': { city: 'New Liberty', state: 'IA' },
  '52777': { city: 'Walcott', state: 'IA' },
  '52778': { city: 'Wheatland', state: 'IA' },
};

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = id && id !== 'new';
  const isFromLead = searchParams.get('from_lead') === 'true';

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

  // Pre-fill from URL search params (when converting a lead to customer)
  useEffect(() => {
    if (isFromLead && !isEditing) {
      setFormData({
        business_name: searchParams.get('business_name') || '',
        bill_to_address: searchParams.get('bill_to_address') || '',
        city: searchParams.get('city') || '',
        state: searchParams.get('state') || '',
        zip_code: searchParams.get('zip_code') || '',
        primary_contact: searchParams.get('primary_contact') || '',
        main_email: searchParams.get('main_email') || '',
        main_phone: searchParams.get('main_phone') || '',
        secondary_phone: '',
        fax: '',
        fleet_description: searchParams.get('fleet_description') || '',
        region: '',
      });
      toast.info('Form pre-filled from lead data. Review and save.');
    }
  }, [isFromLead, isEditing, searchParams]);

  // Pre-fill from existing customer (edit mode)
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
      toast.success('Customer created!');
      navigate(`/customers/${newCustomer.id}`);
    },
    onError: () => {
      toast.error('Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customersApi.update(parseInt(id!, 10), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success('Customer updated!');
      navigate(`/customers/${id}`);
    },
    onError: () => {
      toast.error('Failed to update customer');
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-fill city and state from zip code
      if (name === 'zip_code' && value.length === 5) {
        const match = ZIP_LOOKUP[value];
        if (match) {
          updated.city = match.city;
          updated.state = match.state;
        }
      }

      // Auto-fill state when city is typed (for common QC cities)
      if (name === 'city') {
        const cityLower = value.toLowerCase().trim();
        if (['davenport', 'bettendorf', 'leclaire', 'le claire', 'eldridge', 'walcott', 'blue grass', 'princeton', 'muscatine', 'clinton', 'long grove', 'dixon'].includes(cityLower)) {
          updated.state = 'IA';
        } else if (['rock island', 'moline', 'east moline', 'milan', 'silvis'].includes(cityLower)) {
          updated.state = 'IL';
        }
      }

      return updated;
    });
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          {isFromLead && (
            <p className="text-sm text-blue-600 dark:text-blue-400">Pre-filled from lead — review and save</p>
          )}
        </div>
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
                placeholder="ZIP (auto-fills city/state)"
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
              label="Notes / Services Needed"
              name="fleet_description"
              value={formData.fleet_description}
              onChange={handleChange}
              placeholder="Services the customer needs, equipment details, special instructions..."
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
