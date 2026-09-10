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
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
  onViewLedger,
}) => {
  const { settings, deleteInvoice, getCustomerEmptyCylinders } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!invoice) return null;

  const currentEmptyWithCustomer = getCustomerEmptyCylinders(invoice.customerId);

  const handlePrint = () => {
    window.print();
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
              {settings.businessName}
            </h1>
            <div className="font-urdu text-base text-slate-800 font-bold mt-0.5">
              {settings.businessNameUrdu}
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              {settings.businessAddress}
            </p>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>فون / Phone: {settings.businessPhone}</span>
            </div>
            <div className="mt-2 inline-block bg-slate-900 text-white text-[11px] font-black tracking-wider uppercase px-3 py-0.5 rounded-full">
              LPG Gas Cash Memo / بل انوائس
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] block">بل نمبر / Invoice #:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] block">تاریخ / Date & Time:</span>
              <span className="font-bold text-slate-900">
                {formatDate(invoice.date)} {invoice.time}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-slate-100 mt-1">
              <span className="text-slate-500 text-[10px] block">محترم گاہک / Customer Details:</span>
              <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
              <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                <span>{invoice.customerMobile}</span>
                {invoice.customerAddress && <span>• {invoice.customerAddress}</span>}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700">
                <th className="py-1.5 text-left font-bold">تفصیل / Item</th>
                <th className="py-1.5 text-center font-bold">تعداد / Qty</th>
                <th className="py-1.5 text-right font-bold">ریٹ / Rate</th>
                <th className="py-1.5 text-right font-bold">رقم / Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 text-left font-bold text-slate-900">
                  {invoice.cylinderSize}
                </td>
                <td className="py-2 text-center font-bold text-slate-900">{invoice.quantity}</td>
                <td className="py-2 text-right font-mono text-slate-700">
                  {formatCurrency(invoice.pricePerCylinder)}
                </td>
                <td className="py-2 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Breakdown Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs mb-4">
            <div className="flex justify-between text-slate-600">
              <span>سب ٹوٹل / Subtotal:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>پچھلا بقایا / Previous Balance:</span>
              <span
                className={`font-mono font-bold ${
                  invoice.previousBalance > 0 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                {formatCurrency(invoice.previousBalance)}
              </span>
            </div>

            <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
              <span>کل واجب الادا رقم / Total Amount:</span>
              <span className="font-mono text-base">{formatCurrency(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-800 font-bold pt-1">
              <span>وصول شدہ رقم / Amount Paid:</span>
              <span className="font-mono">{formatCurrency(invoice.amountPaid)}</span>
            </div>

            <div className="flex justify-between items-center font-black pt-1.5 border-t border-slate-300">
              <span className="text-sm">باقی بقایا رقم / Baqaya:</span>
              <span
                className={`font-mono text-base font-black ${
                  invoice.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(invoice.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Empty Cylinder Status Box */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs mb-4">
            <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>خالی سلنڈرز کا ریکارڈ / Empty Cylinders Record:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900 mt-1">
              <div>
                <span>خالی سلنڈر وصول ہوئے:</span>{' '}
                <b>{invoice.emptyCylindersReceived} Cylinders</b>
              </div>
              <div>
                <span>خالی سلنڈر دیے گئے:</span>{' '}
                <b>{invoice.emptyCylindersGiven} Cylinders</b>
              </div>
              <div className="col-span-2 pt-1 border-t border-amber-200/80">
                <span>گاہک کے پاس موجود کل خالی سلنڈر:</span>{' '}
                <b className="text-amber-950">{currentEmptyWithCustomer} Cylinders</b>
              </div>
            </div>
          </div>

          {/* PAID / BAQAYA Large Stamp */}
          <div className="text-center my-3">
            <div
              className={`inline-block px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase border-2 ${
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
            <p className="text-[9px] text-slate-400 mt-1 font-sans">
              Software Powered by Insaf LPG Gas POS System
            </p>
          </div>
        </div>

        {/* Action Buttons Row (Print, Share, Download) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>پرنٹ کریں / Print Invoice</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Save as PDF using browser print dialog"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>واٹس ایپ شیئر / WhatsApp</span>
          </a>
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
