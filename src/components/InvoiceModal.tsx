import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, LPGInvoice } from '../types';
import {
  X,
  FileText,
  AlertTriangle,
  UserPlus,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  formatCurrency,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: LPGInvoice) => void;
  initialCustomerId?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
  initialCustomerId,
}) => {
  const {
    customers,
    inventory,
    settings,
    addInvoice,
    getCustomerBalance,
    getCustomerEmptyCylinders,
    getNextInvoiceNumber,
    addCustomer,
  } = useApp();

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [cylinderSize, setCylinderSize] = useState<string>(
    settings.cylinderSizes.find((s) => s.isDefault)?.name || settings.cylinderSizes[0]?.name || '11.8 KG (Domestic)'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerCylinder, setPricePerCylinder] = useState<number>(settings.defaultCylinderPrice);
  const [emptyReceived, setEmptyReceived] = useState<number>(1); // default return 1 empty when 1 full bought
  const [emptyGiven, setEmptyGiven] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [allowNegativeStockOverride, setAllowNegativeStockOverride] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Quick inline add customer
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustMobile, setQuickCustMobile] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');

  // Auto-sync price when cylinder size changes
  useEffect(() => {
    const config = settings.cylinderSizes.find((s) => s.name === cylinderSize);
    if (config) {
      setPricePerCylinder(config.defaultPrice);
    }
  }, [cylinderSize, settings.cylinderSizes]);

  // When customer changes, initialize
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const previousBalance = activeCustomer ? getCustomerBalance(activeCustomer.id) : 0;
  const currentEmptyWithCustomer = activeCustomer ? getCustomerEmptyCylinders(activeCustomer.id) : 0;

  // Formula Calculations:
  // Subtotal = Quantity * Price
  const subtotal = (Number(quantity) || 0) * (Number(pricePerCylinder) || 0);
  // Total Amount = Subtotal + Previous Balance
  const totalAmount = subtotal + previousBalance;
  // Remaining Balance = Total Amount - Amount Paid
  const remainingBalance = totalAmount - (Number(amountPaid) || 0);

  // Default amountPaid to subtotal when invoice is new
  useEffect(() => {
    if (amountPaid === 0 && subtotal > 0) {
      // Optional: keep 0 or leave for user
    }
  }, [subtotal]);

  // Set initial customer if passed
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers, selectedCustomerId]);

  if (!isOpen) return null;

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim() || !quickCustMobile.trim()) {
      setError('گاہک کا نام اور موبائل درج کریں / Please provide customer name and mobile');
      return;
    }
    const newCust = addCustomer({
      name: quickCustName.trim(),
      mobile: quickCustMobile.trim(),
      address: quickCustAddress.trim(),
      customerId: '',
      openingBalance: 0,
      openingEmptyCylinders: 0,
      notes: 'Quick-added from invoice modal',
    });
    setSelectedCustomerId(newCust.id);
    setShowQuickAddCust(false);
    setQuickCustName('');
    setQuickCustMobile('');
    setQuickCustAddress('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeCustomer) {
      setError('براہ کرم گاہک کا انتخاب کریں / Please select a customer');
      return;
    }
    if (quantity <= 0) {
      setError('سلنڈر کی تعداد 1 یا زیادہ ہونی چاہیے / Quantity must be at least 1');
      return;
    }
    if (pricePerCylinder <= 0) {
      setError('سلنڈر کی قیمت درست درج کریں / Price must be greater than zero');
      return;
    }

    // Stock check
    if (
      inventory.fullCylindersInStock < quantity &&
      !inventory.allowNegativeStock &&
      !allowNegativeStockOverride
    ) {
      setError(
        `دکان میں بھرے سلنڈرز کا اسٹاک کم ہے (${inventory.fullCylindersInStock} دستیاب). اگر منفی اسٹاک کی اجازت دینی ہے تو چیک باکس لگائیں / Insufficient full cylinder stock (${inventory.fullCylindersInStock} available).`
      );
      return;
    }

    const status: 'PAID' | 'PARTIAL' | 'UNPAID' =
      remainingBalance <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const newInvoice = addInvoice({
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerMobile: activeCustomer.mobile,
      customerAddress: activeCustomer.address,
      date,
      time: time || getCurrentTimeString(),
      cylinderSize,
      quantity,
      pricePerCylinder,
      emptyCylindersReceived: Number(emptyReceived) || 0,
      emptyCylindersGiven: Number(emptyGiven) || 0,
      subtotal,
      previousBalance,
      totalAmount,
      amountPaid: Number(amountPaid) || 0,
      remainingBalance,
      status,
      notes,
    });

    onInvoiceCreated(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                LPG Gas Invoice / نیا گیس بل ({getNextInvoiceNumber()})
              </h2>
              <p className="text-xs text-emerald-200 font-urdu">
                فروخت، سلنڈر تبادلہ اور بقایا جات کا فوری اندراج
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Add Customer Sub-Form */}
          {showQuickAddCust ? (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">
                  فوری نیا گاہک درج کریں / Quick Add Customer
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  منسوخ کریں ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="نام / Name *"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  className="text-xs p-2 bg-white border border-blue-200 rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="موبائل / Mobile *"
                  value={quickCustMobile}
                  onChange={(e) => setQuickCustMobile(e.target.value)}
                  className="text-xs p-2 bg-white border border-blue-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="پتہ / Address"
                  value={quickCustAddress}
                  onChange={(e) => setQuickCustAddress(e.target.value)}
                  className="text-xs p-2 bg-white border border-blue-200 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickAddCustomer}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
              >
                + گاہک شامل کریں اور بل جاری رکھیں / Add Customer & Continue
              </button>
            </div>
          ) : (
            /* Customer Selector Row */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    گاہک کا انتخاب / Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCust(true)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> + نیا گاہک / New Customer
                  </button>
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
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

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تاریخ / Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">وقت / Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Live Snapshot Bar */}
          {activeCustomer && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">گاہک / Mobile:</span>
                <span className="font-bold text-slate-800">{activeCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">پچھلا بقایا / Prev Baqaya:</span>
                <span
                  className={`font-black ${
                    previousBalance > 0
                      ? 'text-rose-600'
                      : previousBalance < 0
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                >
                  {formatCurrency(previousBalance)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">خالی سلنڈر گاہک کے پاس:</span>
                <span className="font-bold text-amber-700">
                  {currentEmptyWithCustomer} Cylinders
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">دکان میں بھرا اسٹاک:</span>
                <span className="font-bold text-emerald-700">
                  {inventory.fullCylindersInStock} Available
                </span>
              </div>
            </div>
          )}

          {/* Cylinder Sale Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                سلنڈر سائز / Cylinder Size *
              </label>
              <select
                value={cylinderSize}
                onChange={(e) => setCylinderSize(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800"
              >
                {settings.cylinderSizes.map((size) => (
                  <option key={size.id} value={size.name}>
                    {size.name} - (Rs. {size.defaultPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                تعداد / Quantity (Full) *
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setQuantity(q);
                    // by default shopkeepers receive same quantity of empty
                    setEmptyReceived(q);
                  }}
                  className="w-full text-sm font-black p-2 bg-white border border-emerald-300 rounded-xl text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                فی سلنڈر قیمت / Price (PKR) *
              </label>
              <input
                type="number"
                min={0}
                value={pricePerCylinder}
                onChange={(e) => setPricePerCylinder(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-black p-2 bg-white border border-emerald-300 rounded-xl text-right"
              />
            </div>
          </div>

          {/* Empty Cylinder Movement on this sale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  خالی سلنڈر وصول ہوئے / Empty Received
                </label>
              </div>
              <input
                type="number"
                min={0}
                value={emptyReceived}
                onChange={(e) => setEmptyReceived(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full text-sm font-bold p-2 bg-white border border-amber-300 rounded-xl text-center"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                دکان کے خالی اسٹاک میں اضافہ ہوگا (+{emptyReceived})
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-amber-950">
                  اضافی خالی سلنڈر دیا گیا / Extra Empty Given
                </label>
              </div>
              <input
                type="number"
                min={0}
                value={emptyGiven}
                onChange={(e) => setEmptyGiven(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full text-sm font-bold p-2 bg-white border border-amber-300 rounded-xl text-center"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                گاہک کے پاس خالی سلنڈر کھاتہ بڑھے گا (+{emptyGiven})
              </span>
            </div>
          </div>

          {/* Accounting Calculations Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
            <div className="flex justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
              <span>سب ٹوٹل / Subtotal ({quantity} x Rs.{pricePerCylinder}):</span>
              <span className="font-mono font-bold text-white text-sm">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
              <span>پچھلا بقایا / Previous Balance:</span>
              <span
                className={`font-mono font-bold ${
                  previousBalance > 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {formatCurrency(previousBalance)}
              </span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-amber-300 pb-2 border-b border-slate-800">
              <span>کل واجب الادا رقم / Total Amount:</span>
              <span className="font-mono text-base">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Amount Paid Input */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-emerald-400">
                  وصول شدہ رقم / Amount Paid Now (PKR):
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(totalAmount)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    Full (Rs. {totalAmount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(subtotal)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    Only Bill (Rs. {subtotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-rose-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    0 Baqaya
                  </button>
                </div>
              </div>
              <input
                type="number"
                min={0}
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-black p-2.5 bg-slate-800 border border-emerald-500 rounded-xl text-white text-right focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Remaining Balance Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">بقایا رقم / Remaining Balance:</span>
                <div
                  className={`text-lg font-black font-mono ${
                    remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(remainingBalance)}
                </div>
              </div>

              <div
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  remainingBalance <= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {remainingBalance <= 0 ? 'PAID / ادا شدہ' : 'BAQAYA / بقایا'}
              </div>
            </div>
          </div>

          {/* Notes & Stock override warning */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نوٹس / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered via Rickshaw, cylinder seal intact"
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {inventory.fullCylindersInStock < quantity && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs flex items-center justify-between gap-2">
              <span className="text-amber-800">
                بھرے سلنڈر کا اسٹاک کم ہے۔ کیا آپ منفی اسٹاک کی اجازت دیتے ہیں؟
              </span>
              <label className="flex items-center gap-1.5 font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegativeStockOverride}
                  onChange={(e) => setAllowNegativeStockOverride(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Allow Sale</span>
              </label>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              منسوخ / Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>بل جاری کریں / Create & Print Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
