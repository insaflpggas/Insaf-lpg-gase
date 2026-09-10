export interface Customer {
  id: string;
  customerId: string; // e.g. "CUST-001"
  name: string;
  mobile: string;
  address: string;
  openingBalance: number; // positive: customer owes money; negative: advance
  openingEmptyCylinders: number; // empty cylinders already with customer at signup
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LPGInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-000001"
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "02:30 PM"
  cylinderSize: string; // e.g. "11.8 KG (Domestic)"
  quantity: number; // full cylinders sold
  pricePerCylinder: number;
  emptyCylindersReceived: number; // empty cylinder returned by customer today
  emptyCylindersGiven: number; // empty cylinder given to customer today
  subtotal: number; // quantity * pricePerCylinder
  previousBalance: number; // customer balance right before this invoice
  totalAmount: number; // subtotal + previousBalance
  amountPaid: number; // cash/payment received during invoice
  remainingBalance: number; // totalAmount - amountPaid
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Easypaisa' | 'JazzCash';

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. "PAY-000001"
  customerId: string;
  customerName: string;
  customerMobile: string;
  date: string;
  time: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export type CylinderTransactionType =
  | 'INVOICE_SALE'
  | 'EMPTY_RETURN'
  | 'EMPTY_GIVEN'
  | 'PLANT_REFILL'
  | 'STOCK_ADJUSTMENT';

export interface CylinderTransaction {
  id: string;
  date: string;
  time: string;
  type: CylinderTransactionType;
  customerId?: string;
  customerName?: string;
  relatedInvoiceId?: string;
  fullCylindersDelta: number; // change to shop full stock (+ or -)
  emptyCylindersDelta: number; // change to shop empty stock (+ or -)
  customerEmptyDelta: number; // change to customer cylinder hold (+ or -)
  notes?: string;
  createdAt: string;
}

export interface CylinderSizeConfig {
  id: string;
  name: string; // e.g. "11.8 KG (Domestic / گھریلو)"
  weight: string; // e.g. "11.8 KG"
  defaultPrice: number;
  isDefault?: boolean;
}

export interface Inventory {
  fullCylindersInStock: number;
  emptyCylindersInStock: number;
  allowNegativeStock: boolean;
  lowStockThresholdFull: number;
  lowStockThresholdEmpty: number;
  lastUpdated: string;
}

export interface BusinessSettings {
  businessName: string;
  businessNameUrdu: string;
  businessPhone: string;
  businessAddress: string;
  businessAddressUrdu?: string;
  invoiceFooter: string;
  invoiceFooterUrdu?: string;
  currency: string;
  currencySymbol: string;
  defaultCylinderPrice: number;
  cylinderSizes: CylinderSizeConfig[];
  securityPin: string; // default "1234"
  ownerName: string;
  languageMode: 'both' | 'ur' | 'en';
}

export interface LedgerEntry {
  id: string;
  date: string;
  time?: string;
  reference: string;
  type: 'INVOICE' | 'PAYMENT' | 'OPENING_BALANCE' | 'CYLINDER_ENTRY';
  description: string;
  descriptionUrdu: string;
  debit: number; // Banam / Addition to what customer owes
  credit: number; // Jama / Customer paid
  balance: number; // Running balance
  emptyCylindersDelta: number;
  runningEmptyCylinders: number;
  rawItem?: LPGInvoice | Payment | Customer | CylinderTransaction;
}

export interface AppNotification {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  titleUrdu: string;
  message: string;
  messageUrdu: string;
  customerId?: string;
  link?: string;
  date: string;
}
