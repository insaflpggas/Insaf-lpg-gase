import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Printer,
  Share2,
  Plus,
  ArrowDownLeft,
  Calendar,
  Layers,
  Phone,
  MapPin,
  FileText,
  Search,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  generateLedgerWhatsAppText,
} from '../utils/formatters';

interface CustomerLedgerViewProps {
  initialCustomerId?: string;
  onNewInvoiceForCustomer: (customerId: string) => void;
  onReceivePaymentForCustomer: (customerId: string) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  initialCustomerId,
  onNewInvoiceForCustomer,
  onReceivePaymentForCustomer,
}) => {
  const {
    customers,
    getCustomerLedger,
    getCustomerBalance,
    getCustomerEmptyCylinders,
    settings,
  } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers, selectedCustomerId]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filtered customer list for quick dropdown/search
  const matchedCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.mobile.includes(searchFilter) ||
      c.customerId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const ledgerEntries = activeCustomer ? getCustomerLedger(activeCustomer.id) : [];
  const currentBalance = activeCustomer ? getCustomerBalance(activeCustomer.id) : 0;
  const currentEmpty = activeCustomer ? getCustomerEmptyCylinders(activeCustomer.id) : 0;

  // Calculate Total Purchases and Total Payments for active customer
  const totalPurchases = ledgerEntries
    .filter((e) => e.type === 'INVOICE')
    .reduce((acc, e) => acc + (e.debit || 0), 0);

  const totalPayments = ledgerEntries
    .filter((e) => e.type === 'PAYMENT')
    .reduce((acc, e) => acc + (e.credit || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const whatsappUrl = activeCustomer
    ? `https://wa.me/${activeCustomer.mobile.replace(
        /[^0-9]/g,
        ''
      )}?text=${generateLedgerWhatsAppText(
        settings.businessName,
        activeCustomer.name,
        activeCustomer.mobile,
        currentBalance,
        currentEmpty
      )}`
    : '#';

  return (
    <div className="space-y-5 pb-12">
      {/* Customer Selector Top Bar */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            گاہک کا کھاتہ منتخب کریں / Select Customer Ledger
          </label>
          <div className="relative">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            >
              {customers.map((c) => {
                const b = getCustomerBalance(c.id);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerId}) - {b > 0 ? `Baqaya: Rs.${b.toLocaleString()}` : 'Clear'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {activeCustomer && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNewInvoiceForCustomer(activeCustomer.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ نیا بل / Invoice</span>
            </button>
            <button
              onClick={() => onReceivePaymentForCustomer(activeCustomer.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ وصولی / Receive</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>پرنٹ کھاتہ / Print</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>واٹس ایپ کھاتہ / WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Ledger Document */}
      {!activeCustomer ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
          براہ کرم کھاتہ دیکھنے کے لیے گاہک منتخب کریں۔
        </div>
      ) : (
        <div className="printable-invoice-a4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          {/* Printable Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
              {settings.businessName}
            </h1>
            <div className="text-base font-urdu font-bold text-slate-800 mt-0.5">
              {settings.businessNameUrdu}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{settings.businessAddress}</p>
            <p className="text-xs text-slate-700 font-bold">فون: {settings.businessPhone}</p>
            <div className="mt-2 inline-block bg-slate-900 text-white text-xs font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full">
              Customer Ledger Statement / گاہک کھاتہ تفصیل
            </div>
          </div>

          {/* Customer Profile Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                گاہک کا نام / Customer Name:
              </span>
              <div className="text-base font-black text-slate-900">{activeCustomer.name}</div>
              <div className="text-[11px] font-mono text-slate-500">{activeCustomer.customerId}</div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                رابطہ / Contact & Address:
              </span>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeCustomer.mobile}</span>
              </div>
              <div className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{activeCustomer.address || 'Gujranwala'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                ابتدائی کھاتہ / Opening Record:
              </span>
              <div className="text-slate-700 font-medium">
                Balance: <b>{formatCurrency(activeCustomer.openingBalance)}</b>
              </div>
              <div className="text-slate-700 font-medium">
                Opening Cylinders: <b>{activeCustomer.openingEmptyCylinders}</b>
              </div>
            </div>
          </div>

          {/* 4 Summary Cards (as explicitly requested in Section 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* Total Purchases */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-blue-900 uppercase block">
                Total Purchases / کل خریداری
              </span>
              <div className="text-lg sm:text-xl font-black text-blue-950 mt-0.5">
                {formatCurrency(totalPurchases)}
              </div>
              <span className="text-[10px] text-blue-800 font-urdu">مجموعی گیس خریداری</span>
            </div>

            {/* Total Payments */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-900 uppercase block">
                Total Payments / کل وصولی
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
                {formatCurrency(totalPayments)}
              </div>
              <span className="text-[10px] text-emerald-800 font-urdu">موصول شدہ رقوم</span>
            </div>

            {/* Current Balance */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-rose-900 uppercase block">
                Current Balance / موجودہ بقایا
              </span>
              <div
                className={`text-lg sm:text-xl font-black mt-0.5 ${
                  currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(currentBalance)}
              </div>
              <span className="text-[10px] text-rose-800 font-urdu">
                {currentBalance > 0 ? 'واجب الادا بقایا رقم' : 'کھاتہ صاف ہے'}
              </span>
            </div>

            {/* Empty Cylinders with Customer */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase block">
                Empty Cylinders / خالی سلنڈر
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-900 mt-0.5">
                {currentEmpty} Cylinders
              </div>
              <span className="text-[10px] text-amber-800 font-urdu">گاہک کے پاس خالی</span>
            </div>
          </div>

          {/* Ledger Table: Date | Invoice | Description | Debit | Credit | Balance | Empty Cylinders */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2.5 px-3">تاریخ / Date</th>
                  <th className="py-2.5 px-3">انوائس / حوالہ</th>
                  <th className="py-2.5 px-3">تفصیل / Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (بنام)</th>
                  <th className="py-2.5 px-3 text-right">Credit (جمع)</th>
                  <th className="py-2.5 px-3 text-right">بقایا / Balance</th>
                  <th className="py-2.5 px-3 text-center">خالی سلنڈر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {entry.reference}
                    </td>

                    <td className="py-2.5 px-3 text-slate-800">
                      <div>{entry.description}</div>
                      <div className="text-[10px] text-slate-500 font-urdu">
                        {entry.descriptionUrdu}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      {entry.credit > 0 ? `+${formatCurrency(entry.credit)}` : '-'}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right font-mono font-black ${
                        entry.balance > 0 ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {formatCurrency(entry.balance)}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                          entry.runningEmptyCylinders > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {entry.runningEmptyCylinders}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ledger Statement Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p>دستخط دکاندار / Shopkeeper Signature: __________________</p>
            </div>
            <div className="text-right font-urdu text-slate-600">
              <p>{settings.invoiceFooter}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
