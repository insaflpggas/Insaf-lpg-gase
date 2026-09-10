import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MapPin,
  Share2,
  BookOpen,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../utils/formatters';

interface EmptyCylindersViewProps {
  onViewCustomerLedger: (customerId: string) => void;
}

export const EmptyCylindersView: React.FC<EmptyCylindersViewProps> = ({
  onViewCustomerLedger,
}) => {
  const {
    customers,
    inventory,
    cylinderTransactions,
    addCylinderTransaction,
    getCustomerEmptyCylinders,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterHoldingOnly, setFilterHoldingOnly] = useState(true);

  // Modal State for receiving/giving empty cylinders
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'RECEIVE_FROM_CUST' | 'GIVE_TO_CUST'>('RECEIVE_FROM_CUST');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [modalDate, setModalDate] = useState<string>(getTodayDateString());
  const [modalError, setModalError] = useState<string>('');

  // Total empty cylinders held by all customers combined
  const customerListWithStats = customers.map((c) => ({
    ...c,
    emptyHeld: getCustomerEmptyCylinders(c.id),
  }));

  const totalEmptyWithCustomers = customerListWithStats.reduce((acc, c) => acc + c.emptyHeld, 0);

  const filteredCustomers = customerListWithStats.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.customerId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterHoldingOnly && c.emptyHeld <= 0) return false;
    return true;
  });

  const openActionModal = (type: 'RECEIVE_FROM_CUST' | 'GIVE_TO_CUST', custId?: string) => {
    setActionType(type);
    if (custId) setSelectedCustomerId(custId);
    else if (!selectedCustomerId && customers.length > 0) setSelectedCustomerId(customers[0].id);
    setQty(1);
    setNotes('');
    setModalDate(getTodayDateString());
    setModalError('');
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) {
      setModalError('گاہک کا انتخاب کریں / Please select customer');
      return;
    }
    if (qty <= 0) {
      setModalError('سلنڈرز کی تعداد 1 یا اس سے زیادہ ہونی چاہیے / Quantity must be at least 1');
      return;
    }

    if (actionType === 'RECEIVE_FROM_CUST') {
      // Customer returns empty cylinder to shop
      // Shop Empty stock increases (+qty)
      // Customer empty count decreases (-qty)
      addCylinderTransaction({
        date: modalDate,
        time: getCurrentTimeString(),
        type: 'EMPTY_RETURN',
        customerId: cust.id,
        customerName: cust.name,
        fullCylindersDelta: 0,
        emptyCylindersDelta: qty,
        customerEmptyDelta: -qty,
        notes: notes.trim() || `گاہک ${cust.name} سے ${qty} خالی سلنڈر وصول ہوئے`,
      });
    } else {
      // Shop gives empty cylinder to customer
      // Shop Empty stock decreases (-qty)
      // Customer empty count increases (+qty)
      addCylinderTransaction({
        date: modalDate,
        time: getCurrentTimeString(),
        type: 'EMPTY_GIVEN',
        customerId: cust.id,
        customerName: cust.name,
        fullCylindersDelta: 0,
        emptyCylindersDelta: -qty,
        customerEmptyDelta: qty,
        notes: notes.trim() || `گاہک ${cust.name} کو ${qty} خالی سلنڈر جاری کیے`,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
              <Layers className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Cylinder Khata / خالی سلنڈرز کا حساب
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            خالی سلنڈر مینجمنٹ / Empty Cylinders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
            گاہکوں کے پاس موجود خالی سلنڈرز کا مکمل حساب، وصولی اور واپسی کا ریکارڈ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openActionModal('RECEIVE_FROM_CUST')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>خالی سلنڈر وصول کریں / Receive</span>
          </button>
          <button
            onClick={() => openActionModal('GIVE_TO_CUST')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>خالی سلنڈر دیں / Issue</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
          <span className="text-xs font-bold text-amber-900 uppercase block">
            گاہکوں کے پاس کل خالی سلنڈر / With Customers
          </span>
          <div className="text-3xl font-black text-amber-900 mt-1 font-mono">
            {totalEmptyWithCustomers}
          </div>
          <div className="text-xs text-amber-700 font-urdu mt-1">
            مارکیٹ میں موجود سلنڈرز جو دکان پر واپس آنے ہیں
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-600 uppercase block">
            دکان میں موجود خالی سلنڈر / In Shop Stock
          </span>
          <div className="text-3xl font-black text-slate-900 mt-1 font-mono">
            {inventory.emptyCylindersInStock}
          </div>
          <div className="text-xs text-slate-500 font-urdu mt-1">
            پلانٹ پر بھروائی کے لیے بھیجنے کے لیے دستیاب
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <span className="text-xs font-bold text-emerald-900 uppercase block">
            دکان میں بھرے سلنڈر / Full Cylinders
          </span>
          <div className="text-3xl font-black text-emerald-800 mt-1 font-mono">
            {inventory.fullCylindersInStock}
          </div>
          <div className="text-xs text-emerald-700 font-urdu mt-1">
            فروخت کے لیے تیار گیس سلنڈرز
          </div>
        </div>
      </div>

      {/* Customer Empty Cylinders List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گاہک تلاش کریں / Search customer name, mobile..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterHoldingOnly(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterHoldingOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              صرف سلنڈر والے گاہک ({customerListWithStats.filter((c) => c.emptyHeld > 0).length})
            </button>
            <button
              onClick={() => setFilterHoldingOnly(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                !filterHoldingOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              تمام گاہک ({customers.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Layers className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-base text-slate-600 font-urdu">
              ابھی کوئی ریکارڈ موجود نہیں
            </p>
            <p className="text-xs text-slate-400">
              No customers currently matching this empty cylinder filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c) => {
              const whatsappReminderText = encodeURIComponent(
                `السلام علیکم ${c.name} صاحب! \n${settings.businessName} کی طرف سے یاد دہانی:\nآپ کے پاس ہمارے ${c.emptyHeld} عدد خالی گیس سلنڈر موجود ہیں۔ براہ کرم جلد از جلد دکان پر واپس پہنچا دیں۔ شکریہ!\nپتہ: ${settings.businessAddress}\nفون: ${settings.businessPhone}`
              );

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{c.name}</h3>
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {c.customerId}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          خالی سلنڈر
                        </span>
                        <span
                          className={`text-xl font-black font-mono ${
                            c.emptyHeld > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {c.emptyHeld} عدد
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:${c.mobile}`} className="hover:underline font-mono">
                          {c.mobile}
                        </a>
                      </div>
                      {c.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => openActionModal('RECEIVE_FROM_CUST', c.id)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      + واپسی لیں
                    </button>
                    <button
                      onClick={() => onViewCustomerLedger(c.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>کھاتہ</span>
                    </button>
                    {c.emptyHeld > 0 && (
                      <a
                        href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${whatsappReminderText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                        title="واٹس ایپ پر سلنڈر واپسی کا میسج بھیجیں"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>یاد دہانی</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {actionType === 'RECEIVE_FROM_CUST'
                  ? 'خالی سلنڈر وصولی / Receive Empty from Customer'
                  : 'خالی سلنڈر جاری کریں / Issue Empty to Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  گاہک کا انتخاب / Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {customers.map((c) => {
                    const held = getCustomerEmptyCylinders(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile}) - پاس موجود: {held} عدد
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سلنڈرز کی تعداد / Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm font-black p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ / Date</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تفصیل / Note (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: گاہک نے دکان پر خود جمع کرایا"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow ${
                    actionType === 'RECEIVE_FROM_CUST'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  محفوظ کریں / Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
