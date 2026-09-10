import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  TrendingUp,
  Receipt,
  Wallet,
  Package,
  Layers,
  FilePlus2,
  UserPlus,
  ArrowDownLeft,
  RefreshCw,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Phone,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import { LPGInvoice } from '../types';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onNewInvoice: () => void;
  onNewCustomer?: () => void;
  onReceivePayment: () => void;
  onCylinderEntry?: () => void;
  onViewLedger?: (customerId?: string) => void;
  onViewCustomerLedger?: (customerId?: string) => void;
  onOpenInvoiceReceipt?: (invoice: LPGInvoice) => void;
  onViewInvoiceReceipt?: (invoice: LPGInvoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onNewInvoice,
  onNewCustomer,
  onReceivePayment,
  onCylinderEntry,
  onViewLedger,
  onViewCustomerLedger,
  onOpenInvoiceReceipt,
  onViewInvoiceReceipt,
}) => {
  const { customers, invoices, payments, inventory, alerts, getCustomerBalance, getCustomerEmptyCylinders } =
    useApp();
  const today = getTodayDateString();

  const handleOpenReceipt = (inv: LPGInvoice) => {
    if (onViewInvoiceReceipt) onViewInvoiceReceipt(inv);
    else if (onOpenInvoiceReceipt) onOpenInvoiceReceipt(inv);
  };

  const handleOpenLedger = (cId?: string) => {
    if (onViewCustomerLedger) onViewCustomerLedger(cId);
    else if (onViewLedger) onViewLedger(cId);
    else if (onNavigate) onNavigate('ledger');
  };

  // 1. Calculate Metrics
  const totalCustomers = customers.length;

  // Today's Sales
  const todayInvoices = invoices.filter((inv) => inv.date === today);
  const todaySalesAmount = todayInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);

  // Total Receivable / Baqaya Amount (Sum of all positive customer balances)
  const totalReceivable = customers.reduce((acc, c) => {
    const bal = getCustomerBalance(c.id);
    return bal > 0 ? acc + bal : acc;
  }, 0);

  // Total Paid Amount (All invoice cash upfront + all separate payments)
  const totalPaidAmount =
    invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0) +
    payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Stock
  const fullStock = inventory.fullCylindersInStock;
  const emptyStock = inventory.emptyCylindersInStock;

  // Recent Transactions (Combine latest Invoices and Payments sorted by date/time)
  interface CombinedTx {
    id: string;
    type: 'INVOICE' | 'PAYMENT';
    title: string;
    customerName: string;
    date: string;
    time: string;
    amount: number;
    badgeText: string;
    statusColor: string;
    rawInvoice?: LPGInvoice;
    customerId: string;
  }

  const recentTransactions: CombinedTx[] = [
    ...invoices.map((inv) => ({
      id: `inv_${inv.id}`,
      type: 'INVOICE' as const,
      title: `${inv.invoiceNumber} • ${inv.quantity}x ${inv.cylinderSize}`,
      customerName: inv.customerName,
      date: inv.date,
      time: inv.time || '',
      amount: inv.subtotal,
      badgeText: inv.status === 'PAID' ? 'PAID / ادا شدہ' : `BAQAYA: ${formatCurrency(inv.remainingBalance)}`,
      statusColor: inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
      rawInvoice: inv,
      customerId: inv.customerId,
    })),
    ...payments.map((p) => ({
      id: `pay_${p.id}`,
      type: 'PAYMENT' as const,
      title: `${p.paymentNumber} • Payment via ${p.paymentMethod}`,
      customerName: p.customerName,
      date: p.date,
      time: p.time || '',
      amount: p.amount,
      badgeText: 'وصولی / Received',
      statusColor: 'bg-emerald-100 text-emerald-800',
      customerId: p.customerId,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Large Quick Action Buttons (Main Shopkeeper Controls) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            فوری اقدامات / Quick Shop Actions
          </h2>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Single-tap operations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* + New Invoice */}
          <button
            onClick={onNewInvoice}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FilePlus2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base leading-tight font-extrabold">+ New Invoice</span>
            <span className="text-xs font-urdu text-emerald-100 mt-0.5">نیا گیس بل</span>
          </button>

          {/* + New Customer */}
          <button
            onClick={onNewCustomer}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base leading-tight font-extrabold">+ New Customer</span>
            <span className="text-xs font-urdu text-blue-100 mt-0.5">نیا گاہک درج کریں</span>
          </button>

          {/* + Receive Payment */}
          <button
            onClick={onReceivePayment}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base leading-tight font-extrabold">+ Receive Payment</span>
            <span className="text-xs font-urdu text-amber-100 mt-0.5">رقم وصولی</span>
          </button>

          {/* + Cylinder Entry */}
          <button
            onClick={onCylinderEntry}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base leading-tight font-extrabold">+ Cylinder Entry</span>
            <span className="text-xs font-urdu text-orange-100 mt-0.5">خالی / بھرا سلنڈر</span>
          </button>

          {/* + View Ledger */}
          <button
            onClick={() => onViewLedger()}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm sm:text-base leading-tight font-extrabold">View Ledger</span>
            <span className="text-xs font-urdu text-slate-300 mt-0.5">گاہک کا کھاتہ دیکھیں</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div
          onClick={() => onViewLedger()}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Customers / گاہک</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCustomers}</div>
          <div className="text-xs text-slate-500 font-urdu mt-0.5">رجسٹرڈ گاہکوں کی تعداد</div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Sales / آج کی فروخت</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatCurrency(todaySalesAmount)}</div>
          <div className="text-xs text-slate-500 font-urdu mt-0.5">
            {todayInvoices.length} بل جاری ہوئے ({todayInvoices.length} Invoices)
          </div>
        </div>

        {/* Total Receivable / Baqaya Amount */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 to-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase">Total Baqaya / کل بقایا رقم</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{formatCurrency(totalReceivable)}</div>
          <div className="text-xs text-rose-600 font-urdu mt-0.5">مارکیٹ سے واجب الوصول رقم</div>
        </div>

        {/* Total Paid Amount */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Collected / کل وصولی</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalPaidAmount)}</div>
          <div className="text-xs text-slate-500 font-urdu mt-0.5">اب تک کی کل موصولہ رقم</div>
        </div>
      </div>

      {/* 3. Stock Level Counters (Full & Empty Cylinders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Full Cylinders in Stock */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-500">
                Full Cylinders in Stock / دکان میں بھرے سلنڈر
              </div>
              <div className="text-3xl font-black text-emerald-700">{fullStock}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {fullStock <= inventory.lowStockThresholdFull ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> کم اسٹاک! فوری پلانٹ سے گاڑی منگوائیں
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">اسٹاک تسلی بخش ہے / Normal Stock</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onCylinderEntry}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            Manage / تبدیل کریں
          </button>
        </div>

        {/* Empty Cylinders in Stock */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-slate-500">
                Empty Cylinders in Stock / دکان میں خالی سلنڈر
              </div>
              <div className="text-3xl font-black text-amber-700">{emptyStock}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {emptyStock <= inventory.lowStockThresholdEmpty ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> خالی سلنڈرز کم ہیں! گاہکوں سے وصول کریں
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">پلانٹ بھیجنے کے لیے دستیاب</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onCylinderEntry}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-300 transition-colors"
          >
            Plant Refill / بھروائی
          </button>
        </div>
      </div>

      {/* 4. Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                ضروری انتباہات / Important Dashboard Alerts ({alerts.length})
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-800">{alert.title}</div>
                  <div className="font-urdu text-amber-800 text-[11px]">{alert.titleUrdu}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{alert.message}</div>
                </div>
                {alert.customerId && (
                  <button
                    onClick={() => onViewLedger(alert.customerId)}
                    className="flex-shrink-0 text-[10px] bg-amber-600 text-white font-bold px-2 py-1 rounded-lg hover:bg-amber-700"
                  >
                    کھاتہ کھولیں
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Today's Invoices & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Invoices Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Today's Invoices / آج کے بل
              </h3>
              <p className="text-xs text-slate-500 font-urdu">آج جاری کیے گئے گیس بل</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {todayInvoices.length} Invoices
            </span>
          </div>

          {todayInvoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <CheckCircle2 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="font-urdu text-sm text-slate-600 font-bold mb-1">
                ابھی تک آج کا کوئی بل موجود نہیں ہے
              </p>
              <p className="text-slate-500">No invoices recorded today</p>
              <button
                onClick={onNewInvoice}
                className="mt-3 inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>+ نیا بل بنائیں / Create Bill</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {todayInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => handleOpenReceipt(inv)}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {inv.invoiceNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {inv.customerName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {inv.time || '12:00 PM'}
                      </span>
                      <span>•</span>
                      <span>
                        {inv.quantity}x {inv.cylinderSize}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(inv.subtotal)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'PAID / ادا' : `بقایا: ${formatCurrency(inv.remainingBalance)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions (Invoices + Payments) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Recent Transactions / حالیہ لین دین
              </h3>
              <p className="text-xs text-slate-500 font-urdu">تازہ ترین بل اور نقد وصولیاں</p>
            </div>
            <button
              onClick={() => handleOpenLedger()}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              All Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Clock className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="font-urdu text-sm text-slate-600 font-bold mb-1">
                ابھی کوئی ریکارڈ موجود نہیں
              </p>
              <p className="text-slate-500">No transactions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (tx.rawInvoice) {
                      handleOpenReceipt(tx.rawInvoice);
                    } else {
                      handleOpenLedger(tx.customerId);
                    }
                  }}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          tx.type === 'INVOICE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.type === 'INVOICE' ? 'بل / Sale' : 'وصولی / Paid'}
                      </span>
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {tx.customerName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {formatDate(tx.date)} • {tx.title}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-sm font-black ${
                        tx.type === 'INVOICE' ? 'text-slate-900' : 'text-emerald-700'
                      }`}
                    >
                      {tx.type === 'PAYMENT' ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tx.statusColor}`}>
                      {tx.badgeText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
