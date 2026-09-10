/**
 * Utility functions for Insaf LPG Gas App
 */

export function formatCurrency(amount: number, currencySymbol: string = 'Rs.'): string {
  const formatted = Math.abs(amount).toLocaleString('en-PK', {
    maximumFractionDigits: 0,
  });
  if (amount < 0) {
    return `-${currencySymbol} ${formatted}`;
  }
  return `${currencySymbol} ${formatted}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Generate printable / WhatsApp share text for invoice
export function generateInvoiceWhatsAppText(
  businessName: string,
  businessPhone: string,
  invoiceNumber: string,
  customerName: string,
  date: string,
  time: string,
  cylinderSize: string,
  quantity: number,
  pricePerCylinder: number,
  subtotal: number,
  previousBalance: number,
  totalAmount: number,
  amountPaid: number,
  remainingBalance: number,
  emptyReceived: number,
  currentEmptyWithCustomer: number,
  footerMessage: string
): string {
  const lines = [
    `*🔥 ${businessName} 🔥*`,
    `*ایل پی جی گیس بل / LPG INVOICE*`,
    `--------------------------------`,
    `📄 *بل نمبر / Inv #:* ${invoiceNumber}`,
    `📅 *تاریخ / Date:* ${date} ${time}`,
    `👤 *گاہک / Customer:* ${customerName}`,
    `--------------------------------`,
    `📦 *سلنڈر سائز / Size:* ${cylinderSize}`,
    `🔢 *تعداد / Qty:* ${quantity}`,
    `💰 *ریٹ / Rate:* Rs. ${pricePerCylinder.toLocaleString()}`,
    `💵 *سب ٹوٹل / Subtotal:* Rs. ${subtotal.toLocaleString()}`,
    `--------------------------------`,
    `⏮️ *پچھلا بقایا / Prev Balance:* Rs. ${previousBalance.toLocaleString()}`,
    `📊 *کل بل / Total Amount:* Rs. ${totalAmount.toLocaleString()}`,
    `✅ *وصول شدہ رقم / Paid:* Rs. ${amountPaid.toLocaleString()}`,
    `⚠️ *بقایا رقم / Remaining Baqaya:* Rs. ${remainingBalance.toLocaleString()}`,
    `--------------------------------`,
    `🔄 *خالی سلنڈر وصول / Empty Received:* ${emptyReceived}`,
    `📦 *گاہک کے پاس خالی سلنڈر / Empty with Customer:* ${currentEmptyWithCustomer}`,
    `--------------------------------`,
    `📞 رابطہ / Contact: ${businessPhone}`,
    footerMessage ? `\n_${footerMessage}_` : '',
  ];

  return encodeURIComponent(lines.filter(Boolean).join('\n'));
}

export function generateLedgerWhatsAppText(
  businessName: string,
  customerName: string,
  mobile: string,
  currentBalance: number,
  emptyCylinders: number
): string {
  const lines = [
    `*🔥 ${businessName} 🔥*`,
    `*کھاتہ تفصیل / Customer Account Statement*`,
    `--------------------------------`,
    `👤 *گاہک / Customer:* ${customerName}`,
    `📱 *موبائل / Mobile:* ${mobile}`,
    `--------------------------------`,
    `⚠️ *موجودہ بقایا رقم / Net Balance:* Rs. ${currentBalance.toLocaleString()} ${currentBalance > 0 ? '(Baqaya/واجب الادا)' : '(Advance)'}`,
    `📦 *آپ کے پاس خالی سلنڈر / Empty Cylinders with you:* ${emptyCylinders}`,
    `--------------------------------`,
    `براہ کرم بقایا رقم کی جلد ادائیگی اور خالی سلنڈر واپسی کو یقینی بنائیں۔ شکریہ!`,
  ];
  return encodeURIComponent(lines.join('\n'));
}
