import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  Layers,
  Truck,
  RefreshCw,
  Plus,
  AlertTriangle,
  History,
  CheckCircle2,
  Calendar,
  Search,
  Edit2,
  X,
} from 'lucide-react';
import { formatDate, getTodayDateString, getCurrentTimeString } from '../utils/formatters';

export const StockView: React.FC = () => {
  const {
    inventory,
    cylinderTransactions,
    addCylinderTransaction,
    updateInventory,
    settings,
    customers,
    getCustomerEmptyCylinders,
  } = useApp();

  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Plant Refill Form State
  const [plantFullReceived, setPlantFullReceived] = useState<number>(30);
  const [plantEmptySent, setPlantEmptySent] = useState<number>(30);
  const [plantNotes, setPlantNotes] = useState<string>('');
  const [plantDate, setPlantDate] = useState<string>(getTodayDateString());

  // Stock Adjustment Form State
  const [newFullStock, setNewFullStock] = useState<number>(inventory.fullCylindersInStock);
  const [newEmptyStock, setNewEmptyStock] = useState<number>(inventory.emptyCylindersInStock);
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Total empty held with customers
  const totalWithCustomers = customers.reduce((acc, c) => acc + getCustomerEmptyCylinders(c.id), 0);
  const totalBusinessCylinders =
    inventory.fullCylindersInStock + inventory.emptyCylindersInStock + totalWithCustomers;

  const handleSavePlantRefill = (e: React.FormEvent) => {
    e.preventDefault();
    addCylinderTransaction({
      date: plantDate,
      time: getCurrentTimeString(),
      type: 'PLANT_REFILL',
      fullCylindersDelta: Number(plantFullReceived) || 0,
      emptyCylindersDelta: -(Number(plantEmptySent) || 0),
      customerEmptyDelta: 0,
      notes:
        plantNotes.trim() ||
        `پلانٹ سے گاڑی آئی: ${plantFullReceived} بھرے سلنڈر وصول، ${plantEmptySent} خالی روانہ`,
    });
    setShowPlantModal(false);
    setPlantNotes('');
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const fullDiff = (Number(newFullStock) || 0) - inventory.fullCylindersInStock;
    const emptyDiff = (Number(newEmptyStock) || 0) - inventory.emptyCylindersInStock;

    addCylinderTransaction({
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      type: 'STOCK_ADJUSTMENT',
      fullCylindersDelta: fullDiff,
      emptyCylindersDelta: emptyDiff,
      customerEmptyDelta: 0,
      notes: adjustNotes.trim() || 'دکان میں سلنڈرز کی فزیکل گنتی اور ایڈجسٹمنٹ',
    });

    updateInventory({
      fullCylindersInStock: Number(newFullStock) || 0,
      emptyCylindersInStock: Number(newEmptyStock) || 0,
    });

    setShowAdjustModal(false);
    setAdjustNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
              <Package className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Warehouse & Shop Stock / دکان کا اسٹاک
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            گیس سلنڈر اسٹاک / Cylinder Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
            بھرے اور خالی سلنڈرز کا لائیو اسٹاک، پلانٹ سے بھروائی اور انوینٹری کنٹرول
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPlantFullReceived(30);
              setPlantEmptySent(30);
              setPlantNotes('');
              setShowPlantModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition-colors"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>پلانٹ گاڑی اندراج / Plant Refill</span>
          </button>

          <button
            onClick={() => {
              setNewFullStock(inventory.fullCylindersInStock);
              setNewEmptyStock(inventory.emptyCylindersInStock);
              setShowAdjustModal(true);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 border border-slate-300 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>اسٹاک درست کریں / Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* Main Stock Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Full Cylinders */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase">
              Full Cylinders / بھرے ہوئے سلنڈر
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-emerald-700 font-mono">
            {inventory.fullCylindersInStock}
          </div>
          <div className="text-xs text-emerald-800 font-urdu mt-1">
            فروخت کے لیے دکان میں موجود فل سلنڈر
          </div>
        </div>

        {/* 2. Empty Cylinders in Shop */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase">
              Empty Cylinders / خالی سلنڈر (دکان)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-amber-700 font-mono">
            {inventory.emptyCylindersInStock}
          </div>
          <div className="text-xs text-amber-800 font-urdu mt-1">
            پلانٹ گاڑی پر بھروائی کے لیے بھیجنے کے قابل
          </div>
        </div>

        {/* 3. Total Cylinders in System */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Business Cylinders / کل اثاثہ
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 font-mono">
            {totalBusinessCylinders}
          </div>
          <div className="text-xs text-slate-500 font-urdu mt-1">
            دکان اسٹاک ({inventory.fullCylindersInStock + inventory.emptyCylindersInStock}) + گاہکوں کے پاس ({totalWithCustomers})
          </div>
        </div>
      </div>

      {/* Stock Movement Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-base text-slate-900">
              اسٹاک نقل و حرکت کی ہسٹری / Stock Movement History
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
            {cylinderTransactions.length} Transactions
          </span>
        </div>

        {cylinderTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-base text-slate-600 font-urdu">
              ابھی کوئی ریکارڈ موجود نہیں
            </p>
            <p className="text-xs text-slate-400">
              No stock movements recorded yet. Plant refills or bill sales will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">تاریخ / Date</th>
                  <th className="py-2.5 px-3">قسم / Type</th>
                  <th className="py-2.5 px-3">گاہک یا پلانٹ / Party</th>
                  <th className="py-2.5 px-3 text-center">بھرے سلنڈر / Full</th>
                  <th className="py-2.5 px-3 text-center">خالی سلنڈر / Empty</th>
                  <th className="py-2.5 px-3">تفصیل / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cylinderTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{formatDate(tx.date)}</div>
                      <div className="text-[10px] text-slate-400">{tx.time}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'SALE_DELIVERY'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.type === 'PLANT_REFILL'
                            ? 'bg-purple-100 text-purple-800'
                            : tx.type === 'EMPTY_RETURN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {tx.customerName || (tx.type === 'PLANT_REFILL' ? 'Gas Plant' : 'Shop Audit')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {tx.fullCylindersDelta > 0 ? (
                        <span className="text-emerald-700">+{tx.fullCylindersDelta}</span>
                      ) : tx.fullCylindersDelta < 0 ? (
                        <span className="text-rose-700">{tx.fullCylindersDelta}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {tx.emptyCylindersDelta > 0 ? (
                        <span className="text-emerald-700">+{tx.emptyCylindersDelta}</span>
                      ) : tx.emptyCylindersDelta < 0 ? (
                        <span className="text-amber-700">{tx.emptyCylindersDelta}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-urdu text-xs">
                      {tx.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plant Refill Modal */}
      {showPlantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                پلانٹ گاڑی اندراج / Plant Refill Entry
              </h3>
              <button onClick={() => setShowPlantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlantRefill} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پلانٹ سے موصول شدہ بھرے سلنڈر / Full Received *
                </label>
                <input
                  type="number"
                  min="0"
                  value={plantFullReceived}
                  onChange={(e) => setPlantFullReceived(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-black p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-mono text-center text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پلانٹ کو بھیجے گئے خالی سلنڈر / Empty Sent *
                </label>
                <input
                  type="number"
                  min="0"
                  value={plantEmptySent}
                  onChange={(e) => setPlantEmptySent(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-black p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-mono text-center text-amber-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ / Date</label>
                <input
                  type="date"
                  value={plantDate}
                  onChange={(e) => setPlantDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پلانٹ نام یا ڈرائیور تفصیل / Note
                </label>
                <input
                  type="text"
                  value={plantNotes}
                  onChange={(e) => setPlantNotes(e.target.value)}
                  placeholder="مثال: میاں گیس پلانٹ گاڑی # 1234"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlantModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl shadow"
                >
                  محفوظ کریں / Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                فزیکل اسٹاک ایڈجسٹمنٹ / Stock Audit & Adjust
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  دکان میں موجود اصل بھرے سلنڈر / Correct Full Cylinders
                </label>
                <input
                  type="number"
                  min="0"
                  value={newFullStock}
                  onChange={(e) => setNewFullStock(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  دکان میں موجود اصل خالی سلنڈر / Correct Empty Cylinders
                </label>
                <input
                  type="number"
                  min="0"
                  value={newEmptyStock}
                  onChange={(e) => setNewEmptyStock(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ایڈجسٹمنٹ کی وجہ / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="مثال: ماہانہ فزیکل گنتی کے بعد درستگی"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl shadow"
                >
                  اپ ڈیٹ کریں / Apply Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
