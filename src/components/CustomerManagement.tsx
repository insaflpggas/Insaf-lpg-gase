import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import {
  UserPlus,
  Search,
  Phone,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  BookOpen,
  X,
  MessageSquare,
  AlertCircle,
  Package,
  Wallet,
} from 'lucide-react';
import { formatCurrency, generateLedgerWhatsAppText } from '../utils/formatters';

interface CustomerManagementProps {
  onViewLedger: (customerId: string) => void;
  onNewInvoiceForCustomer?: (customer: Customer) => void;
  onNewPaymentForCustomer?: (customer: Customer) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  onViewLedger,
}) => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerBalance,
    getCustomerEmptyCylinders,
    settings,
    getNextCustomerId,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'baqaya' | 'clear'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<number>(0);
  const [formOpeningEmptyCylinders, setFormOpeningEmptyCylinders] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormMobile('');
    setFormAddress('');
    setFormCustomerId(getNextCustomerId());
    setFormOpeningBalance(0);
    setFormOpeningEmptyCylinders(0);
    setFormNotes('');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormMobile(cust.mobile);
    setFormAddress(cust.address);
    setFormCustomerId(cust.customerId);
    setFormOpeningBalance(cust.openingBalance);
    setFormOpeningEmptyCylinders(cust.openingEmptyCylinders);
    setFormNotes(cust.notes || '');
    setFormError('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('گاہک کا نام درج کریں / Please enter customer name');
      return;
    }
    if (!formMobile.trim()) {
      setFormError('موبائل نمبر درج کریں / Please enter mobile number');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        mobile: formMobile.trim(),
        address: formAddress.trim(),
        customerId: formCustomerId.trim() || editingCustomer.customerId,
        openingBalance: Number(formOpeningBalance) || 0,
        openingEmptyCylinders: Number(formOpeningEmptyCylinders) || 0,
        notes: formNotes.trim(),
      });
      setEditingCustomer(null);
    } else {
      addCustomer({
        name: formName.trim(),
        mobile: formMobile.trim(),
        address: formAddress.trim(),
        customerId: formCustomerId.trim() || getNextCustomerId(),
        openingBalance: Number(formOpeningBalance) || 0,
        openingEmptyCylinders: Number(formOpeningEmptyCylinders) || 0,
        notes: formNotes.trim(),
      });
      setShowAddModal(false);
    }
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    const ok = deleteCustomer(customerToDelete.id);
    if (!ok) {
      setDeleteError(
        'یہ گاہک ڈیلیٹ نہیں ہو سکتا کیونکہ اس کے بل یا لین دین موجود ہیں / Cannot delete customer with existing invoices.'
      );
    } else {
      setCustomerToDelete(null);
      setDeleteError('');
    }
  };

  // Filtered List
  const filteredList = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(search.toLowerCase()) ||
      cust.mobile.includes(search) ||
      cust.customerId.toLowerCase().includes(search.toLowerCase()) ||
      cust.address.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const balance = getCustomerBalance(cust.id);
    if (filterType === 'baqaya') return balance > 0;
    if (filterType === 'clear') return balance <= 0;
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Add Customer Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>گاہک مینجمنٹ / Customers</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {customers.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-urdu mt-0.5">
            تمام گاہکوں کے کھاتے، بقایا جات اور خالی سلنڈرز کی تفصیل
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ نیا گاہک شامل کریں / Add Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
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

        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex-1 md:flex-initial ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تمام / All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('baqaya')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex-1 md:flex-initial ${
              filterType === 'baqaya'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            صرف بقایا / Baqaya Only
          </button>
          <button
            onClick={() => setFilterType('clear')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex-1 md:flex-initial ${
              filterType === 'clear'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            صاف کھاتہ / Zero Balance
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-sm">
          کوئی گاہک نہیں ملا۔ تلاش تبدیل کریں یا نیا گاہک درج کریں۔
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((cust) => {
            const balance = getCustomerBalance(cust.id);
            const emptyCylinders = getCustomerEmptyCylinders(cust.id);

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 leading-snug">
                          {cust.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {cust.customerId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCustomerToDelete(cust);
                          setDeleteError('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${cust.mobile}`} className="hover:underline font-medium text-slate-700">
                        {cust.mobile}
                      </a>
                    </div>
                    {cust.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Balance & Cylinders Snapshot Boxes */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> بقایا / Balance
                      </span>
                      <div
                        className={`text-sm font-black mt-0.5 ${
                          balance > 0
                            ? 'text-rose-600'
                            : balance < 0
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {formatCurrency(balance)}
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {balance > 0 ? 'Baqaya واجب الادا' : balance < 0 ? 'Advance پیشگی' : 'Clear صاف'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Package className="w-3 h-3" /> خالی سلنڈر
                      </span>
                      <div className="text-sm font-black text-amber-700 mt-0.5">
                        {emptyCylinders} Cylinders
                      </div>
                      <span className="text-[9px] text-slate-500">گاہک کے پاس خالی</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onViewLedger(cust.id)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>کھاتہ دیکھیں / Ledger</span>
                  </button>

                  <a
                    href={`https://wa.me/${cust.mobile.replace(/[^0-9]/g, '')}?text=${generateLedgerWhatsAppText(
                      settings.businessName,
                      cust.name,
                      cust.mobile,
                      balance,
                      emptyCylinders
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
                    title="Send Balance Statement on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>

                  <a
                    href={`tel:${cust.mobile}`}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingCustomer ? 'گاہک کی معلومات تبدیل کریں / Edit Customer' : 'نیا گاہک شامل کریں / Add New Customer'}
                </h3>
                <p className="text-xs text-amber-400 font-urdu">گاہک کا مکمل ریکارڈ درج کریں</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    گاہک کا نام / Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood / طارق محمود"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    موبائل نمبر / Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    گاہک کوڈ / Customer ID
                  </label>
                  <input
                    type="text"
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    placeholder="CUST-001"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    پتہ / Address
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. Station Chowk, Gujranwala"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ابتدائی بقایا رقم / Opening Balance (PKR)
                  </label>
                  <input
                    type="number"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    اگر گاہک نے پہلے سے پیسے دینے ہیں تو رقم لکھیں
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ابتدائی خالی سلنڈر / Opening Empty Cylinders
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formOpeningEmptyCylinders}
                    onChange={(e) => setFormOpeningEmptyCylinders(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    گاہک کے پاس پہلے سے موجود خالی سلنڈرز
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوٹس / Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Special terms, cylinder size preference..."
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  منسوخ / Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors"
                >
                  محفوظ کریں / Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              گاہک حذف کریں؟ / Delete Customer?
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              کیا آپ واقعی <b>{customerToDelete.name}</b> کو ڈیلیٹ کرنا چاہتے ہیں؟
            </p>

            {deleteError && (
              <div className="mt-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-left">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => {
                  setCustomerToDelete(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                نہیں / Cancel
              </button>
              <button
                onClick={confirmDelete}
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
