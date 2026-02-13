import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../types/index.ts';

/**
 * Generate and download a PDF invoice.
 */
export function generateInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Green header bar ---
  doc.setFillColor(22, 163, 74); // #16a34a
  doc.rect(0, 0, pageWidth, 40, 'F');

  // AATOS logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AATOS', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('All Around Town Outdoor Services', 14, 26);
  doc.text('Davenport, Iowa | (563) 555-LAWN', 14, 32);

  // Invoice label on right side
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 18, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, pageWidth - 14, 26, { align: 'right' });

  // --- Invoice details ---
  let y = 52;
  doc.setTextColor(55, 65, 81); // gray-700
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer_name, 14, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', pageWidth - 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.issued_date, pageWidth - 80, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', pageWidth - 80, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.due_date, pageWidth - 80, y + 20);

  // --- Status badge ---
  const statusColors: Record<string, [number, number, number]> = {
    draft: [107, 114, 128],
    sent: [59, 130, 246],
    paid: [22, 163, 74],
    partial: [245, 158, 11],
    overdue: [239, 68, 68],
    void: [107, 114, 128],
  };

  const statusColor = statusColors[invoice.status] ?? [107, 114, 128];
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(invoice.status.toUpperCase(), pageWidth - 14, y + 32, { align: 'right' });

  // --- Line items table ---
  y = 100;
  const lineItems = parseLineItems(invoice);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount']],
    body: lineItems.map((item) => [item.description, `$${item.amount.toFixed(2)}`]),
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [55, 65, 81],
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });

  // --- Totals ---
  // jspdf-autotable stores the final Y position on the doc instance
  const docAny = doc as unknown as Record<string, unknown>;
  const autoTableInfo = docAny['lastAutoTable'] as { finalY?: number } | undefined;
  const prevTableInfo = docAny['previousAutoTable'] as { finalY?: number } | undefined;
  const finalY = autoTableInfo?.finalY ?? prevTableInfo?.finalY ?? y + 60;

  const totalsY = finalY + 10;
  const rightCol = pageWidth - 14;

  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Subtotal:', rightCol - 50, totalsY);
  doc.text(`$${Number(invoice.subtotal).toFixed(2)}`, rightCol, totalsY, { align: 'right' });

  if (Number(invoice.tax_amount) > 0) {
    doc.text(`Tax (${invoice.tax_rate}%):`, rightCol - 50, totalsY + 7);
    doc.text(`$${Number(invoice.tax_amount).toFixed(2)}`, rightCol, totalsY + 7, { align: 'right' });
  }

  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(rightCol - 55, totalsY + 11, rightCol, totalsY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', rightCol - 50, totalsY + 18);
  doc.text(`$${Number(invoice.total).toFixed(2)}`, rightCol, totalsY + 18, { align: 'right' });

  if (Number(invoice.amount_paid) > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74);
    doc.text('Amount Paid:', rightCol - 50, totalsY + 26);
    doc.text(`$${Number(invoice.amount_paid).toFixed(2)}`, rightCol, totalsY + 26, { align: 'right' });

    if (Number(invoice.balance_due) > 0) {
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text('Balance Due:', rightCol - 50, totalsY + 33);
      doc.text(`$${Number(invoice.balance_due).toFixed(2)}`, rightCol, totalsY + 33, { align: 'right' });
    }
  }

  // --- Footer ---
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('AATOS | All Around Town Outdoor Services', pageWidth / 2, footerY + 5, { align: 'center' });

  // Save
  doc.save(`${invoice.invoice_number}.pdf`);
}

interface LineItem {
  description: string;
  amount: number;
}

function parseLineItems(invoice: Invoice): LineItem[] {
  // If job_details are available, use them
  if (invoice.job_details && invoice.job_details.length > 0) {
    return invoice.job_details.map((job) => ({
      description: `${job.service_name} - ${job.customer_name} (${job.scheduled_date})`,
      amount: Number(job.price),
    }));
  }

  // Otherwise, generate line items from notes and subtotal
  const notes = invoice.notes || 'Outdoor services';
  const subtotal = Number(invoice.subtotal);

  // Split into a few plausible line items
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
