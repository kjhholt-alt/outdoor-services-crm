import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Clock,
} from 'lucide-react';
import { estimatesApi } from '../api/client';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import type { Estimate, EstimateStatus } from '../types';

const STATUS_CONFIG: Record<EstimateStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  sent: { label: 'Sent', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  accepted: { label: 'Accepted', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  declined: { label: 'Declined', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  expired: { label: 'Expired', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

export function EstimatesPage() {
  const { data } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.list(),
  });

  const estimates: Estimate[] = data?.results ?? data ?? [];

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="text-gray-500 dark:text-gray-400">Quotes and proposals for customers</p>
        </div>
        <Link to="/estimates/new" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Estimate
        </Link>
      </div>

      <div className="space-y-3">
        {estimates.length > 0 ? (
          estimates.map(est => {
            const statusCfg = STATUS_CONFIG[est.status];
            return (
              <Card key={est.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">{est.title}</span>
                      <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{est.customer_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(est.created_at).toLocaleDateString()}
                      </span>
                      {est.line_items?.length > 0 && (
                        <span className="text-xs">{est.line_items.length} items</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-green-700 dark:text-green-400">
                      ${Number(est.total).toFixed(2)}
                    </span>
                    {est.valid_until && (
                      <p className="text-xs text-gray-400">
                        Valid until {est.valid_until}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No estimates yet</p>
              <Link to="/estimates/new" className="text-green-600 hover:underline text-sm mt-1 inline-block">
                Create your first estimate
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
