import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import { customersApi, regionsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Input';
import { FAB } from '../components/common/FAB';
import type { CustomerListItem, Region, PaginatedResponse } from '../types';

export function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const region = searchParams.get('region') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const ordering = searchParams.get('ordering') || 'business_name';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  const { data: customers, isLoading } = useQuery<PaginatedResponse<CustomerListItem>>({
    queryKey: ['customers', { search, region, page, ordering }],
    queryFn: () => {
      const params: Record<string, string | number> = { page, ordering };
      if (search) params.search = search;
      if (region) params.region = region;
      return customersApi.list(params);
    },
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ['regions'],
    queryFn: regionsApi.list,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      prev.set('search', searchInput);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      if (e.target.value) {
        prev.set('region', e.target.value);
      } else {
        prev.delete('region');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  const totalPages = customers ? Math.ceil(customers.count / 25) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {customers?.count || 0} total customers
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/customers/new')}
          className="hidden sm:flex"
        >
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customers..."
              className="input pl-10"
            />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown
              className={`w-4 h-4 ml-1 transition-transform ${
                showFilters ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Region"
              value={region}
              onChange={handleRegionChange}
              options={[
                { value: '', label: 'All Regions' },
                ...(regions?.map((r) => ({ value: r.id.toString(), label: r.name })) || []),
              ]}
            />
            <Select
              label="Sort By"
              value={ordering}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set('ordering', e.target.value);
                  return prev;
                });
              }}
              options={[
                { value: 'business_name', label: 'Name (A-Z)' },
                { value: '-business_name', label: 'Name (Z-A)' },
                { value: 'city', label: 'City' },
                { value: '-last_call_date', label: 'Last Call (Recent)' },
                { value: 'next_call_date', label: 'Next Call (Soonest)' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Customer List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Loading customers...
            </p>
          </div>
        ) : customers?.results.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No customers found. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Next Call
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {customers?.results.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="table-row"
                    >
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.business_name}
                        </p>
                        {customer.current_note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {customer.current_note.content}
                          </p>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="text-gray-900 dark:text-white">
                          {customer.primary_contact || '-'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.main_phone}
                        </p>
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">
                        {customer.city}
                        {customer.city && customer.state && ', '}
                        {customer.state}
                      </td>
                      <td className="table-cell">
                        {customer.region_name && (
                          <span className="badge badge-info">
                            {customer.region_name}
                          </span>
                        )}
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">
                        {customer.next_call_date || '-'}
                      </td>
                      <td className="table-cell">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {customers?.results.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer min-h-touch"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {customer.business_name}
                      </p>
                      {customer.primary_contact && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.primary_contact}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {customer.main_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {customer.main_phone}
                          </span>
                        )}
                        {(customer.city || customer.state) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {customer.city}
                            {customer.city && customer.state && ', '}
                            {customer.state}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB for mobile */}
      <FAB
        actions={[
          {
            icon: <Plus className="w-6 h-6" />,
            label: 'Add Customer',
            onClick: () => navigate('/customers/new'),
          },
        ]}
      />
    </div>
  );
}
