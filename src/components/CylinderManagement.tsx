import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Package,
  RefreshCw,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  AlertTriangle,
  History,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { formatDate, getTodayDateString, getCurrentTimeString } from '../utils/formatters';

interface CylinderManagementProps {
  onViewCustomerLedger: (customerId: string) => void;
}

export const CylinderManagement: React.FC<CylinderManagementProps> = ({
  onViewCustomerLedger,
}) => {
  const {
    inventory,
    customers,
    cylinderTransactions,
    addCylinderTransaction,
    updateInventory,
    getCustomerEmptyCylinders,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stock' | 'customers' | 'log'>('stock');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<'PLANT_REFILL' | 'EMPTY_RETURN' | 'EMPTY_GIVEN' | 'STOCK_ADJUSTMENT'>('PLANT_REFILL');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [qtyFull, setQtyFull] = useState<number>(30);
  const [qtyEmpty, setQtyEmpty] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [entryDate, setEntryDate] = useState<string>(getTodayDateString());
  const [entryTime, setEntryTime] = useState<string>(getCurrentTimeString());

  // Direct Stock Edit State
  const [manualFull, setManualFull] = useState<number>(inventory.fullCylindersInStock);
  const [manualEmpty, setManualEmpty] = useState<number>(inventory.emptyCylindersInStock);
  const [isEditingDirectStock, setIsEditingDirectStock] = useState(false);

  const openModal = (type: typeof entryType) => {
    setEntryType(type);
    setEntryDate(getTodayDateString());
    setEntryTime(getCurrentTimeString());
    setNotes('');
    if (type === 'PLANT_REFILL') {
      setQtyFull(30);
      setQtyEmpty(30);
    } else {
      setQtyFull(0);
      setQtyEmpty(1);
    }
    setShowEntryModal(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    if (entryType === 'PLANT_REFILL') {
      // Plant refill: Full stock +qtyFull, Empty stock -qtyEmpty
      addCylinderTransaction({
        date: entryDate,
        time: entryTime,
        type: 'PLANT_REFILL',
        fullCylindersDelta: Number(qtyFull) || 0,
        emptyCylindersDelta: -(Number(qtyEmpty) || 0),
        customerEmptyDelta: 0,
        notes: notes.trim() || `Plant Refill: Received ${qtyFull} Full, Sent ${qtyEmpty} Empty to plant`,
      });
    } else if (entryType === 'EMPTY_RETURN') {
      // Customer returns empty cylinder to shop
      // Shop Empty stock increases by qtyEmpty
      // Customer empty cylinders decreases by qtyEmpty (customerEmptyDelta = -qtyEmpty)
      const count = Number(qtyEmpty) || 1;
      addCylinderTransaction({
        date: entryDate,
        time: entryTime,
        type: 'EMPTY_RETURN',
        customerId: selectedCust?.id,
        customerName: selectedCust?.name,
        fullCylindersDelta: 0,
        emptyCylindersDelta: count,
        customerEmptyDelta: -count,
        notes: notes.trim() || `Empty return by customer: ${count} cylinder(s)`,
      });
    } else if (entryType === 'EMPTY_GIVEN') {
      // Shop gives empty cylinder to customer
      // Shop Empty stock decreases by count
      // Customer empty cylinders increases by count (customerEmptyDelta = +count)
      const count = Number(qtyEmpty) || 1;
      addCylinderTransaction({
        date: entryDate,
        time: entryTime,
        type: 'EMPTY_GIVEN',
        customerId: selectedCust?.id,
        customerName: selectedCust?.name,
        fullCylindersDelta: 0,
        emptyCylindersDelta: -count,
        customerEmptyDelta: count,
        notes: notes.trim() || `Empty cylinder issued to customer: ${count} cylinder(s)`,
      });
    } else if (entryType === 'STOCK_ADJUSTMENT') {
      addCylinderTransaction({
        date: entryDate,
        time: entryTime,
        type: 'STOCK_ADJUSTMENT',
        fullCylindersDelta: Number(qtyFull) || 0,
        emptyCylindersDelta: Number(qtyEmpty) || 0,
        customerEmptyDelta: 0,
        notes: notes.trim() || 'Physical inventory audit / adjustment',
      });
    }

    setShowEntryModal(false);
  };

  const handleSaveDirectStock = () => {
    updateInventory({
      fullCylindersInStock: Number(manualFull) || 0,
      emptyCylindersInStock: Number(manualEmpty) || 0,
    });
    setIsEditingDirectStock(false);
  };

  // Customers with empty cylinders held
  const customersWithCylinders = customers
    .map((cust) => ({
      ...cust,
      currentEmpty: getCustomerEmptyCylinders(cust.id),
    }))
    .filter((c) => {
      const matches =
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.mobile.includes(customerSearch) ||
        c.customerId.toLowerCase().includes(customerSearch.toLowerCase());
      return matches;
    })
    .sort((a, b) => b.currentEmpty - a.currentEmpty);

  const totalEmptyWithCustomers = customers.reduce(
    (acc, c) => acc + getCustomerEmptyCylinders(c.id),
    0
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>سلنڈر اور اسٹاک مینجمنٹ / Cylinders</span>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              Full: {inventory.fullCylindersInStock} | Empty: {inventory.emptyCylindersInStock}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-urdu mt-0.5">
            بھرے اور خالی سلنڈرز کا حساب، گاڑی بھروائی، اور گاہکوں کے خالی سلنڈرز کھاتہ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openModal('PLANT_REFILL')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>+ پلانٹ بھروائی / Plant Refill</span>
          </button>
          <button
            onClick={() => openModal('EMPTY_RETURN')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ خالی سلنڈر وصولی / Return</span>
          </button>
          <button
            onClick={() => openModal('EMPTY_GIVEN')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ خالی سلنڈر جاری / Issue</span>
          </button>
        </div>
      </div>

      {/* Stock Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Full Cylinders */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Full in Shop / دکان میں بھرے
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {inventory.fullCylindersInStock}
          </div>
          <div className="text-xs text-slate-500 font-urdu mt-1">
            فوری فروخت کے لیے تیار سلنڈرز
          </div>
        </div>

        {/* Empty Cylinders in Shop */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Empty in Shop / دکان میں خالی
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700">
            {inventory.emptyCylindersInStock}
          </div>
          <div className="text-xs text-slate-500 font-urdu mt-1">
            پلانٹ بھیجنے کے لیے دستیاب خالی سلنڈرز
          </div>
        </div>

        {/* Empty with Customers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              With Customers / گاہکوں کے پاس
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700">
            {totalEmptyWithCustomers}
          </div>
          <div className="text-xs text-slate-500 font-urdu mt-1">
            مارکیٹ میں گردش کرنے والے خالی سلنڈر
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
            activeTab === 'stock'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          دکان کا اسٹاک / Shop Stock
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
            activeTab === 'customers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          گاہکوں کے خالی سلنڈر / Customer Cylinders ({customersWithCylinders.length})
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors ${
            activeTab === 'log'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          سلنڈر نقل و حرکت لاگ / Movement Log ({cylinderTransactions.length})
        </button>
      </div>

      {/* Tab 1: Shop Stock Adjustments */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                براہ راست اسٹاک درستگی / Direct Stock Count
              </h3>
              <p className="text-xs text-slate-500 font-urdu">
                اگر دکان میں گنتی کے بعد کوئی فرق ہو تو یہاں درست کریں
              </p>
            </div>
            {!isEditingDirectStock ? (
              <button
                onClick={() => {
                  setManualFull(inventory.fullCylindersInStock);
                  setManualEmpty(inventory.emptyCylindersInStock);
                  setIsEditingDirectStock(true);
                }}
                className="text-xs bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-slate-800"
              >
                اسٹاک درست کریں / Edit Stock Counts
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingDirectStock(false)}
                  className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDirectStock}
                  className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-700"
                >
                  محفوظ کریں / Save Counts
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                دکان میں موجود بھرے سلنڈر / Full Cylinders in Shop:
              </label>
              {isEditingDirectStock ? (
                <input
                  type="number"
                  min={0}
                  value={manualFull}
                  onChange={(e) => setManualFull(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xl font-bold p-2 bg-white border border-slate-300 rounded-xl"
                />
              ) : (
                <div className="text-2xl font-black text-emerald-700">
                  {inventory.fullCylindersInStock} Cylinders
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                دکان میں موجود خالی سلنڈر / Empty Cylinders in Shop:
              </label>
              {isEditingDirectStock ? (
                <input
                  type="number"
                  min={0}
                  value={manualEmpty}
                  onChange={(e) => setManualEmpty(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xl font-bold p-2 bg-white border border-slate-300 rounded-xl"
                />
              ) : (
                <div className="text-2xl font-black text-amber-700">
                  {inventory.emptyCylindersInStock} Cylinders
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customer Empty Cylinders Ledger */}
      {activeTab === 'customers' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">گاہک / Customer</th>
                    <th className="py-3 px-4">موبائل / Phone</th>
                    <th className="py-3 px-4">پتہ / Address</th>
                    <th className="py-3 px-4 text-center">خالی سلنڈر / Empty Held</th>
                    <th className="py-3 px-4 text-center">ایکشن / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customersWithCylinders.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cust.customerId}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{cust.mobile}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{cust.address}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                            cust.currentEmpty > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cust.currentEmpty} Cylinders
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              openModal('EMPTY_RETURN');
                            }}
                            className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-200"
                            title="Record Empty Received from this customer"
                          >
                            + وصولی (Return)
                          </button>
                          <button
                            onClick={() => onViewCustomerLedger(cust.id)}
                            className="text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg"
                          >
                            کھاتہ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Movement Log */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">تاریخ / Date</th>
                  <th className="py-3 px-4">نوعیت / Type</th>
                  <th className="py-3 px-4">گاہک یا تفصیل / Details</th>
                  <th className="py-3 px-4 text-center">بھرے سلنڈر / Full Delta</th>
                  <th className="py-3 px-4 text-center">خالی سلنڈر / Empty Delta</th>
                  <th className="py-3 px-4 text-center">گاہک کھاتہ / Cust Empty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cylinderTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatDate(tx.date)}</div>
                      <div className="text-[10px] text-slate-400">{tx.time}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-xs text-slate-900">
                        {tx.type === 'INVOICE_SALE' && 'فروخت بل / Sale'}
                        {tx.type === 'PLANT_REFILL' && 'پلانٹ بھروائی / Plant Refill'}
                        {tx.type === 'EMPTY_RETURN' && 'خالی واپسی / Empty Return'}
                        {tx.type === 'EMPTY_GIVEN' && 'خالی جاری / Empty Given'}
                        {tx.type === 'STOCK_ADJUSTMENT' && 'اسٹاک درستگی / Adjustment'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {tx.customerName || 'Shop / Plant'}
                      </div>
                      <div className="text-[11px] text-slate-500">{tx.notes}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {tx.fullCylindersDelta !== 0 ? (
                        <span
                          className={
                            tx.fullCylindersDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }
                        >
                          {tx.fullCylindersDelta > 0 ? `+${tx.fullCylindersDelta}` : tx.fullCylindersDelta}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {tx.emptyCylindersDelta !== 0 ? (
                        <span
                          className={
                            tx.emptyCylindersDelta > 0 ? 'text-amber-700' : 'text-rose-600'
                          }
                        >
                          {tx.emptyCylindersDelta > 0 ? `+${tx.emptyCylindersDelta}` : tx.emptyCylindersDelta}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {tx.customerEmptyDelta !== 0 ? (
                        <span
                          className={
                            tx.customerEmptyDelta > 0 ? 'text-blue-600' : 'text-emerald-600'
                          }
                        >
                          {tx.customerEmptyDelta > 0 ? `+${tx.customerEmptyDelta}` : tx.customerEmptyDelta}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {entryType === 'PLANT_REFILL' && 'پلانٹ بھروائی گاڑی / Plant Refill'}
                {entryType === 'EMPTY_RETURN' && 'گاہک سے خالی سلنڈر وصولی / Empty Return'}
                {entryType === 'EMPTY_GIVEN' && 'گاہک کو خالی سلنڈر دینا / Issue Empty'}
                {entryType === 'STOCK_ADJUSTMENT' && 'اسٹاک درستگی / Stock Adjustment'}
              </h3>
              <button
                onClick={() => setShowEntryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5">
              {/* Customer Selector for Return/Given */}
              {(entryType === 'EMPTY_RETURN' || entryType === 'EMPTY_GIVEN') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    گاہک منتخب کریں / Select Customer *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile}) - Empty with him: {getCustomerEmptyCylinders(c.id)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {entryType === 'PLANT_REFILL' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      نئے بھرے سلنڈر موصول ہوئے / Full Cylinders Received (+):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={qtyFull}
                      onChange={(e) => setQtyFull(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm font-black p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      پلانٹ کو خالی سلنڈر بھیجے گئے / Empty Sent to Plant (-):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={qtyEmpty}
                      onChange={(e) => setQtyEmpty(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm font-black p-2 bg-amber-50 border border-amber-300 rounded-xl text-center"
                    />
                  </div>
                </>
              )}

              {(entryType === 'EMPTY_RETURN' || entryType === 'EMPTY_GIVEN') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    خالی سلنڈرز کی تعداد / Quantity of Cylinders:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qtyEmpty}
                    onChange={(e) => setQtyEmpty(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-sm font-black p-2 bg-slate-50 border border-slate-300 rounded-xl text-center"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تفصیل / Notes:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Vehicle number, plant name, receipt reference..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  منسوخ / Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md"
                >
                  محفوظ کریں / Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
