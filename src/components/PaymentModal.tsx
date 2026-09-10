import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentMethod, Payment } from '../types';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import {
  formatCurrency,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSaved?: (payment: Payment) => void;
  initialCustomerId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSaved,
  initialCustomerId,
}) => {
  const {
    customers,
    addPayment,
    getCustomerBalance,
    getNextPaymentNumber,
  } = useApp();

  const [customerId, setCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialCustomerId) {
      setCustomerId(initialCustomerId);
    } else if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers, customerId]);

  const activeCustomer = customers.find((c) => c.id === customerId);
  const currentBalance = activeCustomer ? getCustomerBalance(activeCustomer.id) : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) {
      setError('براہ کرم گاہک منتخب کریں / Select customer');
      return;
    }
    if (amount <= 0) {
      setError('رقم 0 سے زیادہ ہونی چاہیے / Payment amount must be greater than zero');
      return;
    }

    const newPayment = addPayment({
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerMobile: activeCustomer.mobile,
      date,
      time: time || getCurrentTimeString(),
      amount: Number(amount),
      paymentMethod: method,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
    });

    if (onPaymentSaved) {
      onPaymentSaved(newPayment);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                رقم وصولی / Record Payment ({getNextPaymentNumber()})
              </h2>
              <p className="text-xs text-amber-100 font-urdu">
                گاہک سے کیش، بینک، ایزی پیسہ یا جاز کیش وصولی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              گاہک کا انتخاب / Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {customers.map((c) => {
                const bal = getCustomerBalance(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile}) - {bal > 0 ? `Baqaya: Rs.${bal.toLocaleString()}` : 'Clear'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Customer Current Balance Snapshot */}
          {activeCustomer && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">موجودہ بقایا رقم:</span>
                <span
                  className={`text-sm font-black ${
                    currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentBalance)}
                  className="text-[10px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded-lg hover:bg-amber-700"
                >
                  پوری رقم لکھیں (Rs. {currentBalance})
                </button>
              )}
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصول شدہ رقم / Payment Amount (PKR) *
            </label>
            <input
              type="number"
              min={1}
              required
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 5000"
              className="w-full text-lg font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              طریقہ ادائیگی / Payment Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Cash', 'Bank', 'Easypaisa', 'JazzCash'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    method === m
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m === 'Cash' && '💵 نقد / Cash'}
                  {m === 'Bank' && '🏦 بینک / Bank'}
                  {m === 'Easypaisa' && '🟢 Easypaisa'}
                  {m === 'JazzCash' && '🔴 JazzCash'}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Number & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                حوالہ نمبر / Ref / Trans ID
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="TID / Cheque #"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                تاریخ / Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نوٹس / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Received by shop assistant, etc."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          {/* New Balance Preview */}
          {activeCustomer && amount > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="text-slate-400">ادائیگی کے بعد نیا بقایا:</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(currentBalance - amount)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              منسوخ / Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>وصولی محفوظ کریں / Save Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
