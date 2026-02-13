import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Receipt, Plus, AlertCircle, Clock, Eye, Download,
} from 'lucide-react';
import { invoicesApi } from '../api/client.ts';
import { Card } from '../components/common/Card.tsx';
import { PageTransition } from '../components/common/PageTransition';
import { InvoicePreview } from '../components/invoice/InvoicePreview.tsx';
import { generateInvoicePDF } from '../lib/pdf.ts';
import type { Invoice, InvoiceStatus } from '../types/index.ts';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30' },
  sent: { label: 'Sent', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  paid: { label: 'Paid', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  partial: { label: 'Partial', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  overdue: { label: 'Overdue', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  void: { label: 'Void', color: 'text-gray-500 dark:text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
};

export function InvoicesPage() {
  const [view, setView] = useState<'all' | 'outstanding' | 'overdue'>('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const { data: allData } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.list(),
    enabled: view === 'all',
  });

  const { data: outstandingData } = useQuery<Invoice[]>({
    queryKey: ['invoices', 'outstanding'],
    queryFn: invoicesApi.outstanding,
    enabled: view === 'outstanding',
  });

  const { data: overdueData } = useQuery<Invoice[]>({
    queryKey: ['invoices', 'overdue'],
    queryFn: invoicesApi.overdue,
    enabled: view === 'overdue',
  });

  const invoices: Invoice[] = view === 'all'
    ? (allData?.results ?? allData ?? [])
    : view === 'outstanding' ? (outstandingData ?? [])
    : (overdueData ?? []);

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400">Track billing and payments</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      <div className="flex gap-2">
        {(['all', 'outstanding', 'overdue'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`btn ${view === v ? 'btn-primary' : 'btn-secondary'}`}
          >
            {v === 'all' ? 'All' : v === 'outstanding' ? 'Outstanding' : 'Overdue'}
            {v === 'overdue' && overdueData && overdueData.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {overdueData.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {invoices.length > 0 ? (
          invoices.map(inv => {
            const statusCfg = STATUS_CONFIG[inv.status];
            const balance = Number(inv.total) - Number(inv.amount_paid);
            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    inv.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {inv.status === 'overdue' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {inv.invoice_number}
                      </span>
                      <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{inv.customer_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Due {inv.due_date}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Preview invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => generateInvoicePDF(inv)}
                      className="p-2 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <div className="text-right ml-2">
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">
                        ${Number(inv.total).toFixed(2)}
                      </span>
                      {balance > 0 && inv.status !== 'paid' && (
                        <p className="text-xs text-red-500">
                          ${balance.toFixed(2)} due
                        </p>
                      )}
                      {inv.status === 'paid' && (
                        <p className="text-xs text-green-500">Paid in full</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No invoices {view !== 'all' ? `(${view})` : ''} found</p>
            </div>
          </Card>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          isOpen={true}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
    </PageTransition>
  );
}
