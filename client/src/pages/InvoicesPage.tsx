import React, { useEffect, useState } from 'react';
import { api, Invoice, InvoiceItem } from '../api/client';
import { FileText, Plus, Download, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'AI Bot Setup & Automation', quantity: 1, unitPrice: 1500, total: 1500 }
  ]);

  const fetchInvoices = () => {
    api.get('/invoices')
      .then((res) => {
        setInvoices(res.data.invoices);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching invoices:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(updated[index].quantity) || 0;
      const p = Number(updated[index].unitPrice) || 0;
      updated[index].total = q * p;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    api.post('/invoices', {
      clientName,
      clientEmail,
      dueDate,
      items
    }).then(() => {
      fetchInvoices();
      setShowModal(false);
      setClientName('');
      setClientEmail('');
      setItems([{ description: 'AI Workflow Integration', quantity: 1, unitPrice: 1200, total: 1200 }]);
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    api.patch(`/invoices/${id}/status`, { status }).then(() => fetchInvoices());
  };

  const downloadPdf = (id: string, invoiceNumber: string) => {
    window.open(`/api/invoices/${id}/pdf`, '_blank');
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const grandTotal = subtotal + tax;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoice & Report Generation</h2>
          <p className="text-sm text-slate-500">
            Automated billing, instant calculations, and one-click PDF generation for clients.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Invoice
        </button>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">No invoices generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">PDF Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.clientName}</div>
                      <div className="text-xs text-slate-500">{inv.clientEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">${(inv.amount + inv.tax).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400">Subtotal: ${inv.amount.toLocaleString()}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer focus:outline-none ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : inv.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        PDF Export
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Generate Client Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Service or Product description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-16 text-xs px-2 py-1.5 rounded border border-slate-300 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Unit $"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-24 text-xs px-2 py-1.5 rounded border border-slate-300 bg-white"
                    />
                    <span className="w-20 text-xs font-mono font-bold text-right text-slate-700">
                      ${item.total}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Estimated Total (with 8% Tax):</span>
                <span className="text-lg font-bold text-indigo-700">${grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
