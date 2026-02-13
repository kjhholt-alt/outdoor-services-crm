import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  Calendar,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { routesApi, customersApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import type { Route, CustomerListItem, PaginatedResponse } from '../types';

export function RoutesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: () => routesApi.list().then((r) => r.results || r),
  });

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Routes
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Plan and optimize your customer visits
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Route
        </Button>
      </div>

      {/* Routes List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !routes || routes.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No routes created yet. Create one to start planning your visits.
              </p>
            </Card>
          </div>
        ) : (
          routes.map((route) => (
            <Card
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {route.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {route.date}
                    </p>
                  </div>
                  {route.is_completed ? (
                    <span className="badge badge-success">Completed</span>
                  ) : (
                    <span className="badge badge-info">
                      {route.completed_stop_count}/{route.stop_count} stops
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {route.stop_count} stops
                  </span>
                  {route.total_distance_miles && (
                    <span className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {route.total_distance_miles.toFixed(1)} mi
                    </span>
                  )}
                </div>

                {route.stops && route.stops.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                      {route.stops.slice(0, 3).map((stop) => (
                        <div
                          key={stop.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              stop.is_completed
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {stop.stop_order}
                          </span>
                          <span className="truncate text-gray-700 dark:text-gray-300">
                            {stop.customer_name}
                          </span>
                        </div>
                      ))}
                      {route.stops.length > 3 && (
                        <p className="text-xs text-gray-400 pl-7">
                          +{route.stops.length - 3} more stops
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Route Modal */}
      <CreateRouteModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Route Detail Modal */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
    </PageTransition>
  );
}

function CreateRouteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const { data: customers } = useQuery<PaginatedResponse<CustomerListItem>>({
    queryKey: ['customers', { search }],
    queryFn: () => customersApi.list({ search, page_size: 100 }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      routesApi.createOptimized({
        name,
        date,
        customer_ids: selectedCustomers,
        optimize: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onClose();
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedCustomers([]);
    },
  });

  const toggleCustomer = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Route"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!name || selectedCustomers.length === 0}
          >
            Create & Optimize
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Route Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Northern Iowa Route"
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div>
          <label className="label">Select Customers ({selectedCustomers.length} selected)</label>
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {customers?.results?.map((customer) => (
              <label
                key={customer.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={selectedCustomers.includes(customer.id)}
                  onChange={() => toggleCustomer(customer.id)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {customer.business_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {customer.city}, {customer.state}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function RouteDetailModal({
  route,
  onClose,
}: {
  route: Route;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const completeStopMutation = useMutation({
    mutationFn: (stopId: number) => routesApi.completeStop(route.id, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  return (
    <Modal isOpen={true} onClose={onClose} title={route.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {route.date}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {route.stop_count} stops
          </span>
          {route.total_distance_miles && (
            <span className="flex items-center gap-1">
              <Navigation className="w-4 h-4" />
              {route.total_distance_miles.toFixed(1)} miles
            </span>
          )}
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {route.stops?.map((stop, index) => (
            <div
              key={stop.id}
              className={`flex items-center gap-4 p-4 ${
                index !== route.stops.length - 1
                  ? 'border-b border-gray-200 dark:border-gray-700'
                  : ''
              } ${stop.is_completed ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  stop.is_completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {stop.is_completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stop.stop_order
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {stop.customer_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stop.customer_address}
                </p>
                {stop.customer_phone && (
                  <a
                    href={`tel:${stop.customer_phone}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {stop.customer_phone}
                  </a>
                )}
              </div>
              {!stop.is_completed && !route.is_completed && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => completeStopMutation.mutate(stop.id)}
                  isLoading={completeStopMutation.isPending}
                >
                  Complete
                </Button>
              )}
              {stop.distance_from_previous_miles && (
                <span className="text-sm text-gray-400">
                  {stop.distance_from_previous_miles.toFixed(1)} mi
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
