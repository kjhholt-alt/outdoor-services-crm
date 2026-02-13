import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Download } from 'lucide-react';
import { generateInvoicePDF } from '../../lib/pdf.ts';
import type { Invoice } from '../../types/index.ts';

interface InvoicePreviewProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-200 text-gray-500',
};

export function InvoicePreview({ invoice, isOpen, onClose }: InvoicePreviewProps) {
  const lineItems = getPreviewLineItems(invoice);
  const statusClass = STATUS_COLORS[invoice.status] ?? 'bg-gray-200 text-gray-700';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Preview"
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => generateInvoicePDF(invoice)}
          >
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-green-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">AATOS</h2>
              <p className="text-green-100 text-sm mt-1">All Around Town Outdoor Services</p>
              <p className="text-green-100 text-sm">Davenport, Iowa | (563) 555-LAWN</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">INVOICE</p>
              <p className="text-green-100 font-mono">{invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Bill To</p>
            <p className="text-gray-900 dark:text-white font-medium mt-1">{invoice.customer_name}</p>
          </div>
          <div className="text-right space-y-1">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Issued: </span>
              <span className="text-gray-900 dark:text-white">{invoice.issued_date}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Due: </span>
              <span className="text-gray-900 dark:text-white">{invoice.due_date}</span>
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusClass}`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="text-left px-4 py-2 text-sm font-semibold">Description</th>
                <th className="text-right px-4 py-2 text-sm font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr
                  key={i}
                  className={
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-800/50'
                  }
                >
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {item.description}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                    ${item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span>${Number(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white border-t border-green-500 pt-2">
              <span>Total</span>
              <span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            {Number(invoice.amount_paid) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Paid</span>
                <span>${Number(invoice.amount_paid).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.balance_due) > 0 && invoice.status !== 'paid' && (
              <div className="flex justify-between text-sm font-semibold text-red-600">
                <span>Balance Due</span>
                <span>${Number(invoice.balance_due).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Thank you for your business!
        </div>
      </div>
    </Modal>
  );
}

interface LineItem {
  description: string;
  amount: number;
}

function getPreviewLineItems(invoice: Invoice): LineItem[] {
  if (invoice.job_details && invoice.job_details.length > 0) {
    return invoice.job_details.map((job) => ({
      description: `${job.service_name} - ${job.customer_name} (${job.scheduled_date})`,
      amount: Number(job.price),
    }));
  }

  const notes = invoice.notes || 'Outdoor services';
  const subtotal = Number(invoice.subtotal);

  if (subtotal > 200) {
    const primary = Math.round(subtotal * 0.6 * 100) / 100;
    const secondary = Math.round(subtotal * 0.3 * 100) / 100;
    const misc = Math.round((subtotal - primary - secondary) * 100) / 100;
    return [
      { description: notes, amount: primary },
      { description: 'Additional services', amount: secondary },
      { description: 'Materials & supplies', amount: misc },
    ];
  }

  return [{ description: notes, amount: subtotal }];
}
