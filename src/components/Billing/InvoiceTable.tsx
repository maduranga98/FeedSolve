import { format } from 'date-fns';
import { Download } from 'lucide-react';
import type { Invoice } from '../../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No invoices yet</p>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'MMM d, yyyy');
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="text-left py-4 px-4 font-bold">Date</th>
            <th className="text-left py-4 px-4 font-bold">Description</th>
            <th className="text-right py-4 px-4 font-bold">Amount</th>
            <th className="text-center py-4 px-4 font-bold">Status</th>
            <th className="text-center py-4 px-4 font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-4 px-4">{formatDate(invoice.createdAt)}</td>
              <td className="py-4 px-4 text-gray-900 font-medium">{invoice.description}</td>
              <td className="py-4 px-4 text-right font-bold text-gray-900">
                {formatAmount(invoice.amount)}
              </td>
              <td className="py-4 px-4 text-center">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'open'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <a
                  href={invoice.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
