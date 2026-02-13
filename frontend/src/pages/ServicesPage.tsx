import { useQuery } from '@tanstack/react-query';
import {
  Leaf, Trees, Snowflake, Trash2, Wrench,
  Clock, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { serviceCategoriesApi } from '../api/client';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import type { ServiceCategory, Service } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  'leaf': Leaf,
  'trees': Trees,
  'snowflake': Snowflake,
  'trash-2': Trash2,
  'wrench': Wrench,
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  seasonal: 'Seasonal',
  one_time: 'One Time',
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  flat: 'Flat Rate',
  hourly: '/hour',
  sqft: '/sq ft',
  custom: 'Custom Quote',
};

export function ServicesPage() {
  const { data: categories } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: serviceCategoriesApi.list,
  });

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
        <p className="text-gray-500 dark:text-gray-400">Service catalog for All Around Town Outdoor Services</p>
      </div>

      <div className="space-y-4">
        {categories?.map(cat => {
          const Icon = ICON_MAP[cat.icon] || Leaf;
          const isOpen = expanded.has(cat.id);
          return (
            <Card key={cat.id}>
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center gap-4 text-left !min-h-0"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.service_count} services</span>
                  </div>
                  {cat.is_seasonal && cat.season_start && cat.season_end && (
                    <p className="text-xs text-gray-400">
                      Season: {MONTHS[cat.season_start]} - {MONTHS[cat.season_end]}
                    </p>
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {isOpen && cat.services && (
                <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                  {cat.services.map((svc: Service) => (
                    <div
                      key={svc.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{svc.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {svc.estimated_duration_minutes}min
                          </span>
                          {svc.is_recurring && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              {FREQUENCY_LABELS[svc.recurring_frequency] || svc.recurring_frequency}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {svc.price_type === 'custom' ? (
                          <span className="text-sm text-gray-500">Custom Quote</span>
                        ) : (
                          <span className="font-bold text-green-700 dark:text-green-400">
                            ${Number(svc.default_price).toFixed(2)}
                            <span className="text-xs font-normal text-gray-400 ml-0.5">
                              {PRICE_TYPE_LABELS[svc.price_type]}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        {!categories?.length && (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No service categories found. Seed data will be loaded on deploy.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
