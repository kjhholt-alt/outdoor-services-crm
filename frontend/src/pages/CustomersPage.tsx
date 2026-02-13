import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Users,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { customersApi, regionsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { PageTransition } from '../components/common/PageTransition';
import { SkeletonCard } from '../components/common/Skeleton';
import { Select } from '../components/common/Input';
import { FAB } from '../components/common/FAB';
import type { CustomerListItem, Region, PaginatedResponse } from '../types';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600',
  'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-orange-600',
];

function getAvatarColor(id: number): string {
  return avatarColors[id % avatarColors.length];
}

function isCallOverdue(nextCallDate: string | null): boolean {
  if (!nextCallDate) return false;
  return new Date(nextCallDate) < new Date();
}

// Normalize API response: demo mode returns flat arrays, backend returns PaginatedResponse
function normalizeCustomers(
  data: PaginatedResponse<CustomerListItem> | CustomerListItem[] | undefined
): { items: CustomerListItem[]; count: number } {
  if (!data) return { items: [], count: 0 };
  if (Array.isArray(data)) return { items: data, count: data.length };
  return { items: data.results ?? [], count: data.count ?? 0 };
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const region = searchParams.get('region') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const ordering = searchParams.get('ordering') || 'business_name';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  const { data: rawCustomers, isLoading } = useQuery<
    PaginatedResponse<CustomerListItem> | CustomerListItem[]
  >({
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

  const { items: customers, count: totalCount } = useMemo(
    () => normalizeCustomers(rawCustomers),
    [rawCustomers]
  );

  // Client-side search filter for demo mode (flat arrays have no server-side search)
  const filteredCustomers = useMemo(() => {
    if (!search || !Array.isArray(rawCustomers)) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.business_name.toLowerCase().includes(q) ||
        c.primary_contact?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.main_phone?.includes(q)
    );
  }, [customers, search, rawCustomers]);

  // Client-side sort for demo mode
  const sortedCustomers = useMemo(() => {
    if (!Array.isArray(rawCustomers)) return filteredCustomers;
    const sorted = [...filteredCustomers];
    const desc = ordering.startsWith('-');
    const field = desc ? ordering.slice(1) : ordering;
    sorted.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[field] ?? '';
      const bVal = (b as unknown as Record<string, unknown>)[field] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return desc ? -cmp : cmp;
    });
    return sorted;
  }, [filteredCustomers, ordering, rawCustomers]);

  const displayCount = Array.isArray(rawCustomers)
    ? sortedCustomers.length
    : totalCount;

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

  const totalPages = Array.isArray(rawCustomers)
    ? 1
    : totalCount
    ? Math.ceil(totalCount / 25)
    : 0;

  // Stats
  const needsAttention = customers.filter(
    (c) => c.pending_reminders_count > 0 || isCallOverdue(c.next_call_date)
  ).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customers
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-gray-500 dark:text-gray-400">
                {displayCount} total
              </span>
              {needsAttention > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {needsAttention} need attention
                </span>
              )}
            </div>
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
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, contact, city, or phone..."
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
                  ...(regions?.map((r) => ({
                    value: r.id.toString(),
                    label: r.name,
                  })) || []),
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
        <div className="card overflow-hidden p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No customers found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first customer to get started.'}
              </p>
              {!search && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/customers/new')}
                >
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Next Call
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedCustomers.map((customer) => {
                      const overdue = isCallOverdue(customer.next_call_date);
                      return (
                        <tr
                          key={customer.id}
                          onClick={() =>
                            navigate(`/customers/${customer.id}`)
                          }
                          className="table-row"
                        >
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(customer.id)}`}
                              >
                                {getInitials(customer.business_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {customer.business_name}
                                </p>
                                {customer.current_note && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {customer.current_note.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <p className="text-gray-900 dark:text-white">
                              {customer.primary_contact || '-'}
                            </p>
                            {customer.main_phone && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {customer.main_phone}
                              </p>
                            )}
                          </td>
                          <td className="table-cell text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>
                                {customer.city}
                                {customer.city && customer.state && ', '}
                                {customer.state}
                              </span>
                            </div>
                            {customer.region_name && (
                              <span className="badge badge-info mt-1">
                                {customer.region_name}
                              </span>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-col gap-1">
                              {customer.pending_reminders_count > 0 && (
                                <span className="badge badge-warning">
                                  <Bell className="w-3 h-3 mr-1" />
                                  {customer.pending_reminders_count} reminder
                                  {customer.pending_reminders_count !== 1
                                    ? 's'
                                    : ''}
                                </span>
                              )}
                              {overdue && (
                                <span className="badge badge-danger">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Call overdue
                                </span>
                              )}
                              {!customer.pending_reminders_count &&
                                !overdue && (
                                  <span className="badge badge-success">
                                    On track
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="table-cell text-gray-500 dark:text-gray-400">
                            <span
                              className={
                                overdue
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : ''
                              }
                            >
                              {customer.next_call_date || 'Not scheduled'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {sortedCustomers.map((customer) => {
                  const overdue = isCallOverdue(customer.next_call_date);
                  return (
                    <div
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(customer.id)}`}
                        >
                          {getInitials(customer.business_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {customer.business_name}
                            </p>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>
                          {customer.primary_contact && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.primary_contact}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {customer.main_phone && (
                              <a
                                href={`tel:${customer.main_phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-green-600 dark:text-green-400"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                {customer.main_phone}
                              </a>
                            )}
                            {customer.main_email && (
                              <a
                                href={`mailto:${customer.main_email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[160px]">
                                  {customer.main_email}
                                </span>
                              </a>
                            )}
                            {(customer.city || customer.state) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {customer.city}
                                {customer.city && customer.state && ', '}
                                {customer.state}
                              </span>
                            )}
                          </div>
                          {/* Status badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {customer.region_name && (
                              <span className="badge badge-info">
                                {customer.region_name}
                              </span>
                            )}
                            {customer.pending_reminders_count > 0 && (
                              <span className="badge badge-warning">
                                <Bell className="w-3 h-3 mr-1" />
                                {customer.pending_reminders_count} reminder
                                {customer.pending_reminders_count !== 1
                                  ? 's'
                                  : ''}
                              </span>
                            )}
                            {overdue && (
                              <span className="badge badge-danger">
                                Call overdue
                              </span>
                            )}
                          </div>
                          {customer.current_note && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                              {customer.current_note.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
    </PageTransition>
  );
}
