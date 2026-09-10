import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LPGInvoice } from '../types';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Eye,
  Trash2,
  Share2,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

interface InvoiceListProps {
  onNewInvoice: () => void;
  onOpenReceipt: (invoice: LPGInvoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onNewInvoice, onOpenReceipt }) => {
  const { invoices, deleteInvoice } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'PAID' | 'BAQAYA'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [invoiceToDelete, setInvoiceToDelete] = useState<LPGInvoice | null>(null);

  const today = getTodayDateString();
  const currentMonthPrefix = today.slice(0, 7); // YYYY-MM

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerMobile.includes(search);

    if (!matchesSearch) return false;

    if (filterStatus === 'PAID' && inv.status !== 'PAID') return false;
    if (filterStatus === 'BAQAYA' && inv.status === 'PAID') return false;

    if (dateFilter === 'today' && inv.date !== today) return false;
    if (dateFilter === 'month' && !inv.date.startsWith(currentMonthPrefix)) return false;

    return true;
  });

  const totalFilteredSales = filteredInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  const totalFilteredPaid = filteredInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const totalFilteredBaqaya = filteredInvoices.reduce((acc, inv) => acc + (inv.remainingBalance || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>انوائسز اور گیس بل / Invoices</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {invoices.length} Invoices
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-urdu mt-0.5">
            تمام جاری شدہ بل، پرنٹ، پی ڈی ایف اور واٹس ایپ رسید
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ نیا بل بنائیں / Create Invoice</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Sales</span>
          <span className="text-sm sm:text-base font-black text-slate-900">
            {formatCurrency(totalFilteredSales)}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Collected Paid</span>
          <span className="text-sm sm:text-base font-black text-emerald-600">
            {formatCurrency(totalFilteredPaid)}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Unpaid Baqaya</span>
          <span className="text-sm sm:text-base font-black text-rose-600">
            {formatCurrency(totalFilteredBaqaya)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Filter & Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              تمام / All
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              آج / Today
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                dateFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              اس مہینے / This Month
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                filterStatus === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              PAID ادا
            </button>
            <button
              onClick={() => setFilterStatus('BAQAYA')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                filterStatus === 'BAQAYA' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              BAQAYA بقایا
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            کوئی انوائس نہیں ملی / No invoices matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">بل نمبر / Invoice #</th>
                  <th className="py-3 px-4">گاہک / Customer</th>
                  <th className="py-3 px-4">سلنڈر تفصیل / Item Details</th>
                  <th className="py-3 px-4 text-center">خالی واپسی / Empty</th>
                  <th className="py-3 px-4 text-right">رقم / Amount</th>
                  <th className="py-3 px-4 text-right">وصول شدہ / Paid</th>
                  <th className="py-3 px-4 text-right">بقایا / Baqaya</th>
                  <th className="py-3 px-4 text-center">حیثیت / Status</th>
                  <th className="py-3 px-4 text-center">ایکشن / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onOpenReceipt(inv)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-700">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(inv.date)} {inv.time}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerMobile}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">
                        {inv.quantity}x {inv.cylinderSize}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        @ Rs. {inv.pricePerCylinder.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold text-xs border border-amber-200">
                        <Layers className="w-3 h-3" />
                        {inv.emptyCylindersReceived} Returned
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.subtotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(inv.amountPaid)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(inv.remainingBalance)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status === 'PAID' ? 'PAID ادا' : 'BAQAYA بقایا'}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(inv)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View / Print Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              بل منسوخ / حذف کریں؟ / Delete Invoice?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              کیا آپ واقعی بل <b>{invoiceToDelete.invoiceNumber}</b> برائے{' '}
              <b>{invoiceToDelete.customerName}</b> کو ڈیلیٹ کرنا چاہتے ہیں؟ اس سے متعلقہ اسٹاک خودکار بحال ہو جائے گا۔
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setInvoiceToDelete(null)}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                نہیں / Cancel
              </button>
              <button
                onClick={() => {
                  deleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                ہاں، ڈیلیٹ کریں / Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
