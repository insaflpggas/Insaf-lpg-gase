import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LPGInvoice } from '../types';
import {
  Printer,
  Share2,
  Download,
  X,
  Flame,
  CheckCircle2,
  Trash2,
  Layers,
  Phone,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  generateInvoiceWhatsAppText,
} from '../utils/formatters';

interface InvoiceReceiptModalProps {
  invoice: LPGInvoice | null;
  onClose: () => void;
  onViewLedger?: (customerId: string) => void;
  onNavigate?: (view: string) => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
  onViewLedger,
  onNavigate,
}) => {
  const { settings, deleteInvoice, getCustomerEmptyCylinders } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!invoice) return null;

  const currentEmptyWithCustomer = getCustomerEmptyCylinders(invoice.customerId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Generate standalone printable receipt file for offline archival
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${invoice.invoiceNumber} - INSAAF LPG GAS</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .business-name { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; }
          .address { font-size: 13px; color: #444; margin: 4px 0; }
          .memo { display: inline-block; background: #000; color: #fff; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-top: 6px; }
          .meta-table, .items-table, .calc-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
          .meta-table td { padding: 4px 0; }
          .items-table th, .items-table td { border-bottom: 1px solid #ddd; padding: 8px 4px; }
          .items-table th { border-bottom: 2px solid #000; }
          .calc-table td { padding: 4px 0; }
          .bold { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .highlight { font-size: 15px; font-weight: 900; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; }
          .empty-box { background: #fff8e6; border: 1px solid #e0c570; padding: 10px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; }
          .footer { text-align: center; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="business-name">INSAAF LPG GAS</h1>
          <p class="address">Kot Abdul Malik, Dosako Chowk, Khaki Bazar</p>
          <p class="address">Phone: ${settings.businessPhone}</p>
          <div class="memo">LPG GAS CASH MEMO / انوائس</div>
        </div>
        <table class="meta-table">
          <tr><td><strong>Invoice No:</strong> ${invoice.invoiceNumber}</td><td class="text-right"><strong>Date:</strong> ${invoice.date}</td></tr>
          <tr><td><strong>Customer:</strong> ${invoice.customerName}</td><td class="text-right"><strong>Time:</strong> ${invoice.time || ''}</td></tr>
          <tr><td><strong>Mobile:</strong> ${invoice.customerMobile}</td><td class="text-right"><strong>Status:</strong> ${invoice.remainingBalance <= 0 ? 'PAID' : 'BAQAYA'}</td></tr>
        </table>
        <table class="items-table">
          <thead>
            <tr>
              <th class="text-left">Cylinder Size</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.cylinderSize}</td>
              <td class="text-center">${invoice.quantity}</td>
              <td class="text-right">Rs. ${invoice.pricePerCylinder.toLocaleString()}</td>
              <td class="text-right bold">Rs. ${invoice.subtotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <table class="calc-table">
          <tr><td>Subtotal (Today's Bill):</td><td class="text-right bold">Rs. ${invoice.subtotal.toLocaleString()}</td></tr>
          <tr><td>Previous Baqaya:</td><td class="text-right">Rs. ${invoice.previousBalance.toLocaleString()}</td></tr>
          <tr class="highlight"><td>Grand Total:</td><td class="text-right">Rs. ${invoice.totalAmount.toLocaleString()}</td></tr>
          <tr><td>Amount Paid:</td><td class="text-right bold" style="color: #0d8a43;">Rs. ${invoice.amountPaid.toLocaleString()}</td></tr>
          <tr class="highlight" style="color: ${invoice.remainingBalance > 0 ? '#b91c1c' : '#0d8a43'};">
            <td>Remaining Baqaya:</td><td class="text-right">Rs. ${invoice.remainingBalance.toLocaleString()}</td>
          </tr>
        </table>
        <div class="empty-box">
          <strong>Empty Cylinder Status:</strong><br/>
          • Empty Cylinder Received: ${invoice.emptyCylindersReceived}<br/>
          • Empty Cylinder Given: ${invoice.emptyCylindersGiven}<br/>
          • Total Empty Cylinders with Customer: ${currentEmptyWithCustomer}
        </div>
        <div class="footer">
          <p>${settings.invoiceFooter}</p>
          <p>Thank you for your business! INSAAF LPG GAS</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.invoiceNumber}_${invoice.customerName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also trigger native print for users who want to "Save as PDF"
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleShare = async () => {
    const shareText = generateInvoiceWhatsAppText(
      settings.businessName,
      settings.businessPhone,
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.date,
      invoice.time || '',
      invoice.cylinderSize,
      invoice.quantity,
      invoice.pricePerCylinder,
      invoice.subtotal,
      invoice.previousBalance,
      invoice.totalAmount,
      invoice.amountPaid,
      invoice.remainingBalance,
      invoice.emptyCylindersReceived,
      currentEmptyWithCustomer,
      settings.invoiceFooter
    );

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber} - INSAAF LPG GAS`,
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to WhatsApp
      }
    }

    // Direct WhatsApp fallback
    window.open(whatsappUrl, '_blank');
  };

  const handleBackToDashboard = () => {
    onClose();
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const whatsappUrl = `https://wa.me/${invoice.customerMobile.replace(
    /[^0-9]/g,
    ''
  )}?text=${generateInvoiceWhatsAppText(
    settings.businessName,
    settings.businessPhone,
    invoice.invoiceNumber,
    invoice.customerName,
    invoice.date,
    invoice.time || '',
    invoice.cylinderSize,
    invoice.quantity,
    invoice.pricePerCylinder,
    invoice.subtotal,
    invoice.previousBalance,
    invoice.totalAmount,
    invoice.amountPaid,
    invoice.remainingBalance,
    invoice.emptyCylindersReceived,
    currentEmptyWithCustomer,
    settings.invoiceFooter
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar (hidden in print) */}
        <div className="no-print bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400">{invoice.invoiceNumber}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                invoice.status === 'PAID'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {invoice.status === 'PAID' ? 'PAID / ادا' : 'BAQAYA / بقایا'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Delete Invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area (Clean Pakistani Receipt Layout) */}
        <div
          id="printable-invoice"
          className="p-5 sm:p-6 bg-white text-slate-900 font-sans printable-receipt"
        >
          {/* Business Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white mb-1.5">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900">
              INSAAF LPG GAS
            </h1>
            <div className="font-urdu text-sm text-slate-800 font-bold mt-0.5">
              انصاف ایل پی جی گیس
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1 max-w-xs mx-auto">
              Kot Abdul Malik, Dosako Chowk, Khaki Bazar
            </p>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>Phone: {settings.businessPhone}</span>
            </div>
            <div className="mt-2 inline-block bg-slate-900 text-white text-[11px] font-black tracking-wider uppercase px-3 py-0.5 rounded-full">
              LPG Gas Invoice / بل انوائس
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-bold">Invoice No.</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">Date & Time</span>
              <span className="font-bold text-slate-900">
                {invoice.date} • {invoice.time}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100 mt-1 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Customer</span>
                <div className="font-extrabold text-sm text-slate-900">{invoice.customerName}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Mobile</span>
                <div className="font-mono font-bold text-xs text-slate-800">{invoice.customerMobile}</div>
              </div>
              {invoice.customerAddress && (
                <div className="col-span-2 text-[11px] text-slate-500 truncate">
                  Address: {invoice.customerAddress}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-800">
                <th className="py-1.5 text-left font-bold uppercase">Cylinder</th>
                <th className="py-1.5 text-center font-bold uppercase">Quantity</th>
                <th className="py-1.5 text-right font-bold uppercase">Rate</th>
                <th className="py-1.5 text-right font-bold uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 text-left font-extrabold text-slate-900">
                  {invoice.cylinderSize}
                </td>
                <td className="py-2.5 text-center font-mono font-black text-slate-900">
                  {invoice.quantity}
                </td>
                <td className="py-2.5 text-right font-mono text-slate-700">
                  {formatCurrency(invoice.pricePerCylinder)}
                </td>
                <td className="py-2.5 text-right font-mono font-black text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Breakdown Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs mb-4">
            <div className="flex justify-between text-slate-700">
              <span className="font-medium">Today's Bill (Subtotal):</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span className="font-medium">Previous Baqaya:</span>
              <span
                className={`font-mono font-bold ${
                  invoice.previousBalance > 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {formatCurrency(invoice.previousBalance)}
              </span>
            </div>

            <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{formatCurrency(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-800 font-bold pt-1">
              <span>Paid (Amount Paid):</span>
              <span className="font-mono text-sm">{formatCurrency(invoice.amountPaid)}</span>
            </div>

            <div className="flex justify-between items-center font-black pt-1.5 border-t border-slate-300">
              <span className="text-sm">Remaining Baqaya:</span>
              <span
                className={`font-mono text-base font-black ${
                  invoice.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(invoice.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Empty Cylinder Status Box */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs mb-4">
            <div className="font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>خالی سلنڈر تفصیل / Empty Cylinders Record:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-amber-900 mt-1">
              <div>
                <span className="text-amber-800">Empty Cylinder Received:</span>{' '}
                <b className="font-mono text-amber-950 text-sm block">{invoice.emptyCylindersReceived}</b>
              </div>
              <div>
                <span className="text-amber-800">Empty Cylinder Given:</span>{' '}
                <b className="font-mono text-amber-950 text-sm block">{invoice.emptyCylindersGiven}</b>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-amber-200/80 text-[11px] text-amber-950">
                <span>گاہک کے پاس موجود کل خالی سلنڈر / Total with Customer:</span>{' '}
                <b className="font-mono font-bold text-sm">{currentEmptyWithCustomer}</b>
              </div>
            </div>
          </div>

          {/* PAID / BAQAYA Large Stamp */}
          <div className="text-center my-3">
            <div
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border-2 ${
                invoice.remainingBalance <= 0
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-rose-600 text-rose-700 bg-rose-50'
              }`}
            >
              {invoice.remainingBalance <= 0 ? 'PAID / مکمل ادا شدہ' : 'BAQAYA / بقایا رقم'}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 font-urdu leading-relaxed">
            <p>{settings.invoiceFooter}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-sans font-semibold">
              INSAAF LPG GAS • Kot Abdul Malik, Dosako Chowk, Khaki Bazar
            </p>
          </div>
        </div>

        {/* 4 Working Action Buttons */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. PRINT INVOICE */}
            <button
              onClick={handlePrint}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>PRINT INVOICE</span>
            </button>

            {/* 2. DOWNLOAD PDF */}
            <button
              onClick={handleDownloadPdf}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PDF</span>
            </button>

            {/* 3. SHARE INVOICE */}
            <button
              onClick={handleShare}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE INVOICE</span>
            </button>

            {/* 4. BACK TO DASHBOARD */}
            <button
              onClick={handleBackToDashboard}
              className="w-full bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>BACK TO DASHBOARD</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="no-print p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between gap-3">
            <div className="text-xs text-rose-800 font-medium">
              کیا آپ واقعی یہ انوائس ڈیلیٹ کرنا چاہتے ہیں؟ (اسٹاک خودکار طریقے سے بحال ہو جائے گا)
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-slate-600 px-2 py-1 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-xs font-bold text-white px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded-lg shadow"
              >
                ہاں، ڈیلیٹ کریں
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
