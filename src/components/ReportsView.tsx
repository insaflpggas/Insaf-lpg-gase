import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Printer,
  Download,
  Share2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Package,
  Layers,
  Wallet,
  ArrowDownLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  generateLedgerWhatsAppText,
} from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    payments,
    customers,
    inventory,
    settings,
    getCustomerBalance,
    getCustomerEmptyCylinders,
  } = useApp();

  const [activeReport, setActiveReport] = useState<
    'daily' | 'monthly' | 'baqaya' | 'stock' | 'payments'
  >('daily');

  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(today.slice(0, 7)); // YYYY-MM

  // 1. Daily Sales Data
  const dailyInvoices = invoices.filter((inv) => inv.date === selectedDate);
  const dailySalesTotal = dailyInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  const dailyPaidTotal = dailyInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const dailyBaqayaTotal = dailyInvoices.reduce((acc, inv) => acc + (inv.remainingBalance || 0), 0);
  const dailyCylindersSold = dailyInvoices.reduce((acc, inv) => acc + (inv.quantity || 0), 0);
  const dailyEmptyReceived = dailyInvoices.reduce((acc, inv) => acc + (inv.emptyCylindersReceived || 0), 0);

  // Daily standalone payments
  const dailyPaymentsList = payments.filter((p) => p.date === selectedDate);
  const dailyPaymentsTotal = dailyPaymentsList.reduce((acc, p) => acc + (p.amount || 0), 0);

  // 2. Monthly Sales Data
  const monthlyInvoices = invoices.filter((inv) => inv.date.startsWith(selectedMonth));
  const monthlySalesTotal = monthlyInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  const monthlyPaidTotal = monthlyInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const monthlyCylindersSold = monthlyInvoices.reduce((acc, inv) => acc + (inv.quantity || 0), 0);

  // 3. Outstanding Baqaya list
  const customersWithBaqaya = customers
    .map((c) => ({
      ...c,
      currentBalance: getCustomerBalance(c.id),
      emptyHeld: getCustomerEmptyCylinders(c.id),
    }))
    .filter((c) => c.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance);

  const totalOutstandingBaqaya = customersWithBaqaya.reduce(
    (acc, c) => acc + c.currentBalance,
    0
  );

  // 4. Payment Collection Breakdown by Method
  const paymentMethodsSummary = ['Cash', 'Bank', 'Easypaisa', 'JazzCash'].map((method) => {
    const total = payments
      .filter((p) => p.paymentMethod === method)
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    return { method, total };
  });

  const totalAllPayments = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // CSV Export Utility
  const downloadCSV = (filename: string, rows: string[][]) => {
    // Add UTF-8 BOM for Urdu support in Excel
    const bom = '\uFEFF';
    const csvContent =
      bom + rows.map((e) => e.map((x) => `"${(x || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (activeReport === 'daily') {
      const rows = [
        ['Daily Sales Report - ' + settings.businessName, selectedDate],
        ['Invoice #', 'Customer', 'Mobile', 'Item', 'Qty', 'Rate', 'Subtotal', 'Paid', 'Baqaya', 'Status'],
        ...dailyInvoices.map((inv) => [
          inv.invoiceNumber,
          inv.customerName,
          inv.customerMobile,
          inv.cylinderSize,
          inv.quantity.toString(),
          inv.pricePerCylinder.toString(),
          inv.subtotal.toString(),
          inv.amountPaid.toString(),
          inv.remainingBalance.toString(),
          inv.status,
        ]),
        [],
        ['Total Sales', dailySalesTotal.toString()],
        ['Total Collected', dailyPaidTotal.toString()],
        ['Total Baqaya', dailyBaqayaTotal.toString()],
        ['Cylinders Sold', dailyCylindersSold.toString()],
      ];
      downloadCSV(`Daily_Sales_${selectedDate}`, rows);
    } else if (activeReport === 'baqaya') {
      const rows = [
        ['Outstanding Baqaya Balances Report - ' + settings.businessName],
        ['Customer ID', 'Customer Name', 'Mobile', 'Address', 'Outstanding Baqaya (PKR)', 'Empty Cylinders Held'],
        ...customersWithBaqaya.map((c) => [
          c.customerId,
          c.name,
          c.mobile,
          c.address,
          c.currentBalance.toString(),
          c.emptyHeld.toString(),
        ]),
        [],
        ['Total Outstanding Baqaya', totalOutstandingBaqaya.toString()],
      ];
      downloadCSV(`Baqaya_Balances_${today}`, rows);
    } else if (activeReport === 'stock') {
      const rows = [
        ['Cylinder Stock & Market Holding Report'],
        ['Metric', 'Count'],
        ['Full Cylinders in Shop', inventory.fullCylindersInStock.toString()],
        ['Empty Cylinders in Shop', inventory.emptyCylindersInStock.toString()],
        [],
        ['Customer', 'Mobile', 'Empty Cylinders with Customer'],
        ...customers
          .map((c) => [c.name, c.mobile, getCustomerEmptyCylinders(c.id).toString()])
          .filter((row) => parseInt(row[2], 10) > 0),
      ];
      downloadCSV(`Cylinder_Stock_${today}`, rows);
    } else {
      // Payments
      const rows = [
        ['Payment Collection Report'],
        ['Payment #', 'Date', 'Customer', 'Method', 'Ref #', 'Amount (PKR)'],
        ...payments.map((p) => [
          p.paymentNumber,
          p.date,
          p.customerName,
          p.paymentMethod,
          p.referenceNumber || '',
          p.amount.toString(),
        ]),
      ];
      downloadCSV(`Payments_Report_${today}`, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Daily Summary to Owner
  const sendDailyWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 *${settings.businessName} - Daily Business Summary*\n` +
        `📅 Date: ${selectedDate}\n\n` +
        `💰 Today's Sales: Rs. ${dailySalesTotal.toLocaleString()}\n` +
        `💵 Cash Collected: Rs. ${(dailyPaidTotal + dailyPaymentsTotal).toLocaleString()}\n` +
        `📉 Today's Baqaya: Rs. ${dailyBaqayaTotal.toLocaleString()}\n` +
        `🔥 Cylinders Sold: ${dailyCylindersSold}\n` +
        `🔄 Empty Returned: ${dailyEmptyReceived}\n\n` +
        `📦 *Current Shop Stock:*\n` +
        `🟢 Full in Shop: ${inventory.fullCylindersInStock}\n` +
        `🟡 Empty in Shop: ${inventory.emptyCylindersInStock}\n\n` +
        `⚠️ *Total Market Baqaya:* Rs. ${totalOutstandingBaqaya.toLocaleString()}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>رپورٹس اور کھاتہ خلاصہ / Reports</span>
          </h1>
          <p className="text-xs text-slate-500 font-urdu mt-0.5">
            روزانہ، ماہانہ سیلز، بقایا جات، اسٹاک اور وصولیوں کی تفصیلی رپورٹس
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={sendDailyWhatsApp}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Summary</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport('daily')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeReport === 'daily'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          روزانہ سیلز / Daily Sales
        </button>
        <button
          onClick={() => setActiveReport('monthly')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeReport === 'monthly'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          ماہانہ سیلز / Monthly Sales
        </button>
        <button
          onClick={() => setActiveReport('baqaya')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeReport === 'baqaya'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          بقایا جات رپورٹ / Outstanding Baqaya ({customersWithBaqaya.length})
        </button>
        <button
          onClick={() => setActiveReport('stock')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeReport === 'stock'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          سلنڈر اسٹاک / Cylinder Stock
        </button>
        <button
          onClick={() => setActiveReport('payments')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeReport === 'payments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          وصولیاں / Payment Collections
        </button>
      </div>

      {/* REPORT 1: DAILY SALES */}
      {activeReport === 'daily' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">تاریخ منتخب کریں / Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Sales</span>
              <span className="text-lg font-black text-slate-900">{formatCurrency(dailySalesTotal)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Collected</span>
              <span className="text-lg font-black text-emerald-700">
                {formatCurrency(dailyPaidTotal + dailyPaymentsTotal)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Baqaya</span>
              <span className="text-lg font-black text-rose-600">{formatCurrency(dailyBaqayaTotal)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cylinders Sold</span>
              <span className="text-lg font-black text-amber-600">{dailyCylindersSold} Full</span>
            </div>
          </div>

          {/* Daily Invoice List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
            <h3 className="font-bold text-sm text-slate-900 mb-3">
              تاریخ {formatDate(selectedDate)} کے جاری کردہ بل ({dailyInvoices.length})
            </h3>
            {dailyInvoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                اس تاریخ پر کوئی سیل درج نہیں ہوئی / No sales recorded on this date.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2 px-3">بل #</th>
                    <th className="py-2 px-3">گاہک / Customer</th>
                    <th className="py-2 px-3 text-center">تعداد / Qty</th>
                    <th className="py-2 px-3 text-right">سب ٹوٹل</th>
                    <th className="py-2 px-3 text-right">وصول شدہ</th>
                    <th className="py-2 px-3 text-right">بقایا</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="py-2 px-3 text-center">{inv.quantity}x {inv.cylinderSize}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(inv.subtotal)}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatCurrency(inv.amountPaid)}</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600">{formatCurrency(inv.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* REPORT 2: MONTHLY SALES */}
      {activeReport === 'monthly' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">مہینہ منتخب کریں / Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-400 block">Monthly Total Sales</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(monthlySalesTotal)}</div>
              <span className="text-xs text-slate-500 font-urdu">ماہانہ مجموعی فروخت</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-400 block">Total Payments Received</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(monthlyPaidTotal)}</div>
              <span className="text-xs text-slate-500 font-urdu">ماہانہ کل وصولی</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-400 block">Total Cylinders Sold</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{monthlyCylindersSold} Cylinders</div>
              <span className="text-xs text-slate-500 font-urdu">ماہانہ کل فروخت شدہ سلنڈرز</span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: OUTSTANDING BAQAYA REPORT */}
      {activeReport === 'baqaya' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-800 uppercase block">
                Total Outstanding Baqaya / کل مارکیٹ بقایا جات
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-0.5">
                {formatCurrency(totalOutstandingBaqaya)}
              </div>
              <p className="text-xs text-rose-700 font-urdu mt-0.5">
                {customersWithBaqaya.length} گاہکوں سے رقم وصول کرنا باقی ہے
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">گاہک / Customer</th>
                  <th className="py-3 px-4">موبائل / Phone</th>
                  <th className="py-3 px-4">پتہ / Address</th>
                  <th className="py-3 px-4 text-center">خالی سلنڈر</th>
                  <th className="py-3 px-4 text-right">واجب الادا بقایا رقم</th>
                  <th className="py-3 px-4 text-center">یاد دہانی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersWithBaqaya.map((c) => (
                  <tr key={c.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.customerId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{c.mobile}</td>
                    <td className="py-3 px-4 text-slate-500">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-amber-800">{c.emptyHeld} Cylinders</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `محترم ${c.name} صاحب، آپ کے انصاف ایل پی جی گیس کھاتہ میں بقایا رقم ${formatCurrency(
                            c.currentBalance
                          )} واجب الادا ہے۔ برائے مہربانی جلد از جلد ادائیگی فرما کر رسید حاصل کریں۔ شکریہ۔`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp Reminder</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: CYLINDER STOCK */}
      {activeReport === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Shop Full Cylinders / دکان میں بھرے
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {inventory.fullCylindersInStock}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Shop Empty Cylinders / دکان میں خالی
              </span>
              <div className="text-3xl font-black text-amber-700 mt-1">
                {inventory.emptyCylindersInStock}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: PAYMENTS */}
      {activeReport === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentMethodsSummary.map((m) => (
              <div key={m.method} className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.method}</span>
                <span className="text-lg font-black text-slate-900">{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total All Recorded Payments:</span>
            <span className="text-xl font-black text-emerald-700">{formatCurrency(totalAllPayments)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
