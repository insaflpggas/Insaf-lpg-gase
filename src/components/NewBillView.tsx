import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, LPGInvoice } from '../types';
import {
  FileText,
  UserPlus,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Sparkles,
  Layers,
  Wallet,
  Phone,
  ArrowRight,
} from 'lucide-react';
import {
  formatCurrency,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';

interface NewBillViewProps {
  onInvoiceCreated: (invoice: LPGInvoice) => void;
  onNavigate: (view: string) => void;
}

export const NewBillView: React.FC<NewBillViewProps> = ({
  onInvoiceCreated,
  onNavigate,
}) => {
  const {
    customers,
    inventory,
    settings,
    addInvoice,
    addCustomer,
    getCustomerBalance,
    getCustomerEmptyCylinders,
    getNextInvoiceNumber,
  } = useApp();

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [cylinderSize, setCylinderSize] = useState<string>(
    settings.cylinderSizes.find((s) => s.isDefault)?.name || settings.cylinderSizes[0]?.name || '11.8 KG (Domestic)'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerCylinder, setPricePerCylinder] = useState<number>(settings.defaultCylinderPrice);
  const [emptyReceived, setEmptyReceived] = useState<number>(1);
  const [emptyGiven, setEmptyGiven] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Quick Customer Inline Creation Modal
  const [showQuickAddCust, setShowQuickAddCust] = useState<boolean>(false);
  const [quickName, setQuickName] = useState<string>('');
  const [quickMobile, setQuickMobile] = useState<string>('');
  const [quickAddress, setQuickAddress] = useState<string>('');
  const [quickOpeningBalance, setQuickOpeningBalance] = useState<number>(0);
  const [quickOpeningEmpty, setQuickOpeningEmpty] = useState<number>(0);

  // Sync default price when cylinder size changes
  useEffect(() => {
    const config = settings.cylinderSizes.find((s) => s.name === cylinderSize);
    if (config) {
      setPricePerCylinder(config.defaultPrice);
    }
  }, [cylinderSize, settings.cylinderSizes]);

  // Sync selected customer if none selected but customers exist
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const previousBaqaya = activeCustomer ? getCustomerBalance(activeCustomer.id) : 0;
  const currentEmptyWithCustomer = activeCustomer ? getCustomerEmptyCylinders(activeCustomer.id) : 0;

  // Pakistani LPG Auto Formulas:
  // 1. Subtotal = Quantity × Price
  const subtotal = (Number(quantity) || 0) * (Number(pricePerCylinder) || 0);
  // 2. Grand Total = Subtotal + Previous Baqaya
  const grandTotal = subtotal + previousBaqaya;
  // 3. Remaining Baqaya = Grand Total - Paid Today
  const remainingBaqaya = grandTotal - (Number(amountPaid) || 0);

  // Quick set full payment button
  const handlePayFull = () => {
    setAmountPaid(grandTotal);
  };

  const handlePaySubtotalOnly = () => {
    setAmountPaid(subtotal);
  };

  const handleResetForm = () => {
    setQuantity(1);
    setEmptyReceived(1);
    setEmptyGiven(0);
    setAmountPaid(0);
    setNotes('');
    setError('');
  };

  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setError('گاہک کا نام درج کریں / Please enter customer name');
      return;
    }
    if (!quickMobile.trim()) {
      setError('موبائل نمبر درج کریں / Please enter mobile number');
      return;
    }

    const newCust = addCustomer({
      name: quickName.trim(),
      mobile: quickMobile.trim(),
      address: quickAddress.trim(),
      customerId: '',
      openingBalance: Number(quickOpeningBalance) || 0,
      openingEmptyCylinders: Number(quickOpeningEmpty) || 0,
      notes: 'Added from billing screen',
    });

    setSelectedCustomerId(newCust.id);
    setShowQuickAddCust(false);
    setQuickName('');
    setQuickMobile('');
    setQuickAddress('');
    setQuickOpeningBalance(0);
    setQuickOpeningEmpty(0);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeCustomer) {
      setError('براہ کرم گاہک کا انتخاب کریں / Please select or add a customer');
      return;
    }
    if (quantity <= 0) {
      setError('سلنڈر کی تعداد 1 یا اس سے زیادہ ہونی چاہیے / Quantity must be at least 1');
      return;
    }
    if (pricePerCylinder <= 0) {
      setError('سلنڈر ریٹ درج کریں / Please enter cylinder price');
      return;
    }

    const newInv = addInvoice({
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerMobile: activeCustomer.mobile,
      customerAddress: activeCustomer.address,
      date,
      time: time || getCurrentTimeString(),
      cylinderSize,
      quantity: Number(quantity),
      pricePerCylinder: Number(pricePerCylinder),
      subtotal,
      previousBalance: previousBaqaya,
      totalAmount: grandTotal,
      amountPaid: Number(amountPaid) || 0,
      remainingBalance: remainingBaqaya,
      emptyCylindersReceived: Number(emptyReceived) || 0,
      emptyCylindersGiven: Number(emptyGiven) || 0,
      status: remainingBaqaya <= 0 ? 'PAID' : 'BAQAYA',
      notes: notes.trim(),
    });

    setSuccessNotice(`بل #${newInv.invoiceNumber} کامیابی سے تیار کر لیا گیا ہے!`);
    onInvoiceCreated(newInv);
    handleResetForm();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-lg">
              {getNextInvoiceNumber()}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              نیا کیش میمو / New LPG Bill
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            نیا بل بنائیں / Create New LPG Bill
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
            گاہک کے لیے گیس سلنڈر کی فروخت، بقایا اور خالی سلنڈرز کا بل تیار کریں
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>فارم صاف کریں / Reset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Billing Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Input Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Customer Selection */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                <span>1. گاہک کا انتخاب / Select Customer</span>
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddCust(true)}
                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ نیا گاہک درج کریں / New Customer</span>
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                <p className="text-xs sm:text-sm text-amber-900 font-bold font-urdu">
                  ابھی کوئی گاہک درج نہیں ہے۔ بل بنانے کے لیے پہلے گاہک شامل کریں۔
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>پہلا گاہک شامل کریں / Add First Customer</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-sm font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900"
                >
                  {customers.map((c) => {
                    const b = getCustomerBalance(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile}) - {b > 0 ? `Baqaya: Rs.${b.toLocaleString()}` : 'Clear / صفر'}
                      </option>
                    );
                  })}
                </select>

                {activeCustomer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">{activeCustomer.mobile}</span>
                      {activeCustomer.address && (
                        <span className="text-slate-500 truncate">• {activeCustomer.address}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-start sm:justify-end gap-3 font-mono">
                      <span>
                        پچھلا بقایا:{' '}
                        <b className={previousBaqaya > 0 ? 'text-rose-700' : 'text-slate-700'}>
                          {formatCurrency(previousBaqaya)}
                        </b>
                      </span>
                      <span>
                        خالی سلنڈر: <b className="text-amber-800">{currentEmptyWithCustomer}</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Cylinder & Sale Details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase pb-2 border-b border-slate-100">
              2. گیس سلنڈر اور فروخت / Cylinder Sale Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cylinder Size */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سلنڈر کا سائز / Cylinder Size *
                </label>
                <select
                  value={cylinderSize}
                  onChange={(e) => setCylinderSize(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {settings.cylinderSizes.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} (Rs. {s.defaultPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سلنڈر کی تعداد / Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                />
              </div>

              {/* Rate / Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ریٹ فی سلنڈر (PKR) / Rate *
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={pricePerCylinder}
                  onChange={(e) => setPricePerCylinder(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-sm font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-right"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ / Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وقت / Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 02:30 PM"
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Empty Cylinder Movement */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase">
                3. خالی سلنڈرز کی وصولی اور واپسی / Empty Cylinders Movement
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                <label className="block text-xs font-bold text-amber-950">
                  خالی سلنڈر وصول ہوئے / Empty Received
                </label>
                <p className="text-[11px] text-amber-800 font-urdu">
                  گاہک نے دکان پر کتنے خالی سلنڈر واپس کیے
                </p>
                <input
                  type="number"
                  min="0"
                  value={emptyReceived}
                  onChange={(e) => setEmptyReceived(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-sm font-black p-2 bg-white border border-amber-300 rounded-xl font-mono text-center"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  خالی سلنڈر دیے گئے / Empty Given
                </label>
                <p className="text-[11px] text-slate-600 font-urdu">
                  دکان نے گاہک کو اضافی خالی سلنڈر دیے (عموماً 0)
                </p>
                <input
                  type="number"
                  min="0"
                  value={emptyGiven}
                  onChange={(e) => setEmptyGiven(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-sm font-black p-2 bg-white border border-slate-300 rounded-xl font-mono text-center"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs flex items-center justify-between font-urdu">
              <span>اس بل کے بعد گاہک کے پاس کل خالی سلنڈر ہوں گے:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {currentEmptyWithCustomer + (Number(emptyGiven) || 0) - (Number(emptyReceived) || 0)}
              </span>
            </div>
          </div>

          {/* 4. Notes / Reminders */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              بل پر اضافی نوٹ / Invoice Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: ڈلیوری بذریعہ رکشہ، اسپیشل رعایت، وغیرہ..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
            />
          </div>
        </div>

        {/* Right Column: Calculations & Submit Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-lg space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <span className="font-black text-slate-900 text-base flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-amber-500" />
                حساب کتاب / Bill Summary
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                PKR / روپے
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>سب ٹوٹل / Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  {quantity} × {pricePerCylinder} = {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>پچھلا بقایا / Previous Baqaya:</span>
                <span
                  className={`font-mono font-bold ${
                    previousBaqaya > 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}
                >
                  {formatCurrency(previousBaqaya)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-black text-slate-900 text-base">
                <span>کل بل / Grand Total:</span>
                <span className="font-mono text-lg text-emerald-800">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Paid Today Input */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-900 uppercase">
                    آج وصولی / Paid Today *
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handlePayFull}
                      className="text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded"
                    >
                      مکمل وصولی
                    </button>
                    <button
                      type="button"
                      onClick={handlePaySubtotalOnly}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded"
                    >
                      صرف بل
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-base font-black p-2.5 bg-emerald-50/60 border-2 border-emerald-600 rounded-xl font-mono text-right text-emerald-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Remaining Baqaya */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black">
                <span className="text-sm text-slate-900">باقی بقایا / Remaining:</span>
                <span
                  className={`font-mono text-lg ${
                    remainingBaqaya > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(remainingBaqaya)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={customers.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5 text-amber-400" />
              <span>بل بنائیں اور پرنٹ کریں / Generate Bill</span>
            </button>

            <div className="text-[11px] text-center text-slate-500 font-urdu">
              بل بنتے ہی پرنٹ اور واٹس ایپ کا بٹن خودکار طور پر کھل جائے گا
            </div>
          </div>
        </div>
      </form>

      {/* Quick Customer Add Modal */}
      {showQuickAddCust && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                فوری نیا گاہک درج کریں / Quick Add Customer
              </h3>
              <button
                onClick={() => setShowQuickAddCust(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  گاہک کا نام / Name *
                </label>
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="e.g. محمد عثمان"
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  موبائل نمبر / Mobile *
                </label>
                <input
                  type="tel"
                  value={quickMobile}
                  onChange={(e) => setQuickMobile(e.target.value)}
                  placeholder="03001234567"
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پتہ / Shop or Home Address
                </label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  placeholder="e.g. کوٹ عبد المالک"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ابتدائی بقایا (Rs. 0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quickOpeningBalance}
                    onChange={(e) => setQuickOpeningBalance(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ابتدائی خالی سلنڈر (0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quickOpeningEmpty}
                    onChange={(e) => setQuickOpeningEmpty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCust(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl shadow"
                >
                  محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
