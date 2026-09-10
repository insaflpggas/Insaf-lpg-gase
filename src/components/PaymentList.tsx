import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Payment } from '../types';
import {
  CreditCard,
  Search,
  Plus,
  Calendar,
  Trash2,
  BookOpen,
  X,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PaymentListProps {
  onNewPayment: () => void;
  onViewCustomerLedger: (customerId: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onNewPayment,
  onViewCustomerLedger,
}) => {
  const { payments, deletePayment } = useApp();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
    return true;
  });

  const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>وصولیاں اور ادائیگیاں / Payments</span>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              {payments.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-urdu mt-0.5">
            تمام وصول شدہ رقوم کا ریکارڈ اور رسیدیں
          </p>
        </div>

        <button
          onClick={onNewPayment}
          className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ رقم وصول کریں / Receive Payment</span>
        </button>
      </div>

      {/* Stats Chip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">
              Total Filtered Payments / کل موصولہ رقم
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatCurrency(totalCollected)}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, payment #, ref..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
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

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['all', 'Cash', 'Bank', 'Easypaisa', 'JazzCash'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                methodFilter === m
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            کوئی ادائیگی نہیں ملی / No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">نمبر / Receipt #</th>
                  <th className="py-3 px-4">گاہک / Customer</th>
                  <th className="py-3 px-4">تاریخ / Date</th>
                  <th className="py-3 px-4">طریقہ کار / Method</th>
                  <th className="py-3 px-4">حوالہ / Ref</th>
                  <th className="py-3 px-4 text-right">رقم / Amount</th>
                  <th className="py-3 px-4 text-center">ایکشن / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.customerName}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatDate(p.date)}</div>
                      <div className="text-[10px] text-slate-400">{p.time}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.referenceNumber || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      +{formatCurrency(p.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewCustomerLedger(p.customerId)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
                          title="View Ledger"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Delete Payment"
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

      {/* Delete Payment Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              ادائیگی حذف کریں؟ / Delete Payment?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              کیا آپ واقعی وصولی <b>{paymentToDelete.paymentNumber}</b> (مبلغ Rs. {paymentToDelete.amount.toLocaleString()}) کو ڈیلیٹ کرنا چاہتے ہیں؟ گاہک کا بقایا خودکار بڑھ جائے گا۔
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setPaymentToDelete(null)}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                نہیں / Cancel
              </button>
              <button
                onClick={() => {
                  deletePayment(paymentToDelete.id);
                  setPaymentToDelete(null);
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
