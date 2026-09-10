import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Customer,
  LPGInvoice,
  Payment,
  CylinderTransaction,
  Inventory,
  BusinessSettings,
  LedgerEntry,
  AppNotification,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_CYLINDER_TRANSACTIONS,
  INITIAL_INVENTORY,
  INITIAL_SETTINGS,
} from '../data/seedData';
import { getTodayDateString } from '../utils/formatters';

interface AppContextType {
  customers: Customer[];
  invoices: LPGInvoice[];
  payments: Payment[];
  cylinderTransactions: CylinderTransaction[];
  inventory: Inventory;
  settings: BusinessSettings;
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  lockApp: () => void;
  // CRUD Customers
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  // CRUD Invoices
  addInvoice: (data: Omit<LPGInvoice, 'id' | 'invoiceNumber' | 'createdAt'>) => LPGInvoice;
  updateInvoice: (id: string, updates: Partial<LPGInvoice>) => void;
  deleteInvoice: (id: string) => void;
  // CRUD Payments
  addPayment: (data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>) => Payment;
  deletePayment: (id: string) => void;
  // Stock & Cylinder Transactions
  addCylinderTransaction: (entry: Omit<CylinderTransaction, 'id' | 'createdAt'>) => CylinderTransaction;
  updateInventory: (updates: Partial<Inventory>) => void;
  // Business Settings
  updateSettings: (updates: Partial<BusinessSettings>) => void;
  // Dynamic Calculators
  getCustomerBalance: (customerId: string) => number;
  getCustomerEmptyCylinders: (customerId: string) => number;
  getCustomerLedger: (customerId: string) => LedgerEntry[];
  getNextInvoiceNumber: () => string;
  getNextPaymentNumber: () => string;
  getNextCustomerId: () => string;
  // Alerts & Notifications
  alerts: AppNotification[];
  // Backup & Restore
  exportBackup: () => void;
  importBackup: (jsonString: string) => boolean;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Execute full purge of any legacy demo data from localStorage
const LEGACY_STORAGE_KEYS = [
  'insaf_lpg_customers_v1',
  'insaf_lpg_invoices_v1',
  'insaf_lpg_payments_v1',
  'insaf_lpg_cylinders_v1',
  'insaf_lpg_inventory_v1',
  'insaf_lpg_customers',
  'insaf_lpg_invoices',
  'insaf_lpg_payments',
  'insaf_lpg_cylinders',
  'insaf_lpg_inventory',
];
try {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
} catch {
  // safe fallback
}

const STORAGE_KEYS = {
  CUSTOMERS: 'insaf_lpg_prod_2026_customers',
  INVOICES: 'insaf_lpg_prod_2026_invoices',
  PAYMENTS: 'insaf_lpg_prod_2026_payments',
  CYLINDERS: 'insaf_lpg_prod_2026_cylinders',
  INVENTORY: 'insaf_lpg_prod_2026_inventory',
  SETTINGS: 'insaf_lpg_prod_2026_settings',
  AUTH: 'insaf_lpg_prod_2026_auth',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State loading from LocalStorage or Seed Data
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try {
        const parsed: Customer[] = JSON.parse(saved);
        // Discard any previous demo customers
        return parsed.filter(
          (c) =>
            !c.name.includes('Tariq') &&
            !c.name.includes('Imran') &&
            !c.name.includes('Bilal') &&
            !c.name.includes('Saleem')
        );
      } catch {
        // fallback
      }
    }
    return INITIAL_CUSTOMERS;
  });

  const [invoices, setInvoices] = useState<LPGInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (saved) {
      try {
        const parsed: LPGInvoice[] = JSON.parse(saved);
        return parsed.filter((inv) => !inv.customerName.includes('Tariq'));
      } catch {
        // fallback
      }
    }
    return INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (saved) {
      try {
        const parsed: Payment[] = JSON.parse(saved);
        return parsed.filter((p) => !p.customerName.includes('Tariq'));
      } catch {
        // fallback
      }
    }
    return INITIAL_PAYMENTS;
  });

  const [cylinderTransactions, setCylinderTransactions] = useState<CylinderTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CYLINDERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_CYLINDER_TRANSACTIONS;
  });

  const [inventory, setInventory] = useState<Inventory>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_INVENTORY;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_SETTINGS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authStatus = localStorage.getItem(STORAGE_KEYS.AUTH);
    return authStatus === 'true';
  });

  // 2. LocalStorage Persistence Sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CYLINDERS, JSON.stringify(cylinderTransactions));
  }, [cylinderTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  // Auth Functions
  const login = (pin: string) => {
    if (pin.trim() === settings.securityPin.trim()) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const lockApp = () => {
    setIsAuthenticated(false);
  };

  // Sequence Generators
  const getNextInvoiceNumber = useCallback(() => {
    const numbers = invoices.map((inv) => {
      const match = inv.invoiceNumber.match(/INV-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = maxNumber + 1;
    return `INV-${String(next).padStart(6, '0')}`;
  }, [invoices]);

  const getNextPaymentNumber = useCallback(() => {
    const numbers = payments.map((p) => {
      const match = p.paymentNumber.match(/PAY-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = maxNumber + 1;
    return `PAY-${String(next).padStart(6, '0')}`;
  }, [payments]);

  const getNextCustomerId = useCallback(() => {
    const numbers = customers.map((c) => {
      const match = c.customerId.match(/CUST-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = maxNumber + 1;
    return `CUST-${String(next).padStart(3, '0')}`;
  }, [customers]);

  // Dynamic Accounting Rule Implementation:
  // Customer Balance = Opening Balance + All Invoice Debits - All Payments/Credits
  const getCustomerBalance = useCallback(
    (customerId: string): number => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return 0;

      const opening = customer.openingBalance || 0;

      // Invoices: Subtotal is the debit; amountPaid is credit received with invoice
      const customerInvoices = invoices.filter((inv) => inv.customerId === customerId);
      const totalInvoiceDebits = customerInvoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
      const totalInvoiceImmediatePayments = customerInvoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);

      // Separate Payments (excluding payments auto-generated from invoices)
      const customerPayments = payments.filter((p) => p.customerId === customerId);
      const standalonePayments = customerPayments.filter(
        (p) => !p.referenceNumber || !customerInvoices.some((inv) => inv.invoiceNumber === p.referenceNumber)
      );
      const totalStandalonePayments = standalonePayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      return opening + totalInvoiceDebits - totalInvoiceImmediatePayments - totalStandalonePayments;
    },
    [customers, invoices, payments]
  );

  // Dynamic Cylinder Balance Implementation:
  // Customer Empty Cylinders = Previous Empty Cylinders + Empty Cylinders Given - Empty Cylinders Received
  const getCustomerEmptyCylinders = useCallback(
    (customerId: string): number => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return 0;

      const opening = customer.openingEmptyCylinders || 0;

      // From cylinder transactions specifically linked to this customer
      const custTxns = cylinderTransactions.filter((tx) => tx.customerId === customerId);
      const totalChange = custTxns.reduce((acc, tx) => acc + (tx.customerEmptyDelta || 0), 0);

      return Math.max(0, opening + totalChange);
    },
    [customers, cylinderTransactions]
  );

  // Customer Ledger Calculation
  const getCustomerLedger = useCallback(
    (customerId: string): LedgerEntry[] => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return [];

      const entries: LedgerEntry[] = [];

      // Opening balance entry
      let currentBal = customer.openingBalance || 0;
      let currentEmpty = customer.openingEmptyCylinders || 0;

      entries.push({
        id: `opening_${customer.id}`,
        date: customer.createdAt.split('T')[0],
        time: '00:00',
        reference: 'OPENING',
        type: 'OPENING_BALANCE',
        description: 'Opening Balance & Empty Cylinders',
        descriptionUrdu: 'ابتدائی بقایا اور خالی سلنڈر',
        debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
        credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
        balance: currentBal,
        emptyCylindersDelta: 0,
        runningEmptyCylinders: currentEmpty,
        rawItem: customer,
      });

      // Gather transactions: Invoices, Standalone Payments, Cylinder Entries
      interface RawTransaction {
        timestamp: number;
        date: string;
        time: string;
        type: 'INVOICE' | 'PAYMENT' | 'CYLINDER_ENTRY';
        item: LPGInvoice | Payment | CylinderTransaction;
      }

      const rawTxns: RawTransaction[] = [];

      // Invoices
      invoices
        .filter((inv) => inv.customerId === customerId)
        .forEach((inv) => {
          rawTxns.push({
            timestamp: new Date(inv.date + ' ' + (inv.time || '12:00 PM')).getTime() || new Date(inv.createdAt).getTime(),
            date: inv.date,
            time: inv.time || '',
            type: 'INVOICE',
            item: inv,
          });
        });

      // Payments (excluding invoice upfront cash payments to prevent duplicates in ledger)
      const customerInvoices = invoices.filter((inv) => inv.customerId === customerId);
      payments
        .filter(
          (p) =>
            p.customerId === customerId &&
            (!p.referenceNumber || !customerInvoices.some((inv) => inv.invoiceNumber === p.referenceNumber))
        )
        .forEach((p) => {
          rawTxns.push({
            timestamp: new Date(p.date + ' ' + (p.time || '12:00 PM')).getTime() || new Date(p.createdAt).getTime(),
            date: p.date,
            time: p.time || '',
            type: 'PAYMENT',
            item: p,
          });
        });

      // Standalone cylinder transactions (excluding those created by invoice)
      cylinderTransactions
        .filter((tx) => tx.customerId === customerId && !tx.relatedInvoiceId)
        .forEach((tx) => {
          rawTxns.push({
            timestamp: new Date(tx.date + ' ' + (tx.time || '12:00 PM')).getTime() || new Date(tx.createdAt).getTime(),
            date: tx.date,
            time: tx.time || '',
            type: 'CYLINDER_ENTRY',
            item: tx,
          });
        });

      // Sort chronologically
      rawTxns.sort((a, b) => a.timestamp - b.timestamp);

      // Sequentially construct ledger rows
      rawTxns.forEach((tx) => {
        if (tx.type === 'INVOICE') {
          const inv = tx.item as LPGInvoice;

          // 1. Debit for sale
          currentBal += inv.subtotal;
          // Empty cylinder delta: (given - received)
          const emptyDelta = (inv.emptyCylindersGiven || 0) - (inv.emptyCylindersReceived || 0);
          currentEmpty = Math.max(0, currentEmpty + emptyDelta);

          entries.push({
            id: `inv_debit_${inv.id}`,
            date: inv.date,
            time: inv.time,
            reference: inv.invoiceNumber,
            type: 'INVOICE',
            description: `LPG Sale: ${inv.quantity}x ${inv.cylinderSize} @ Rs.${inv.pricePerCylinder}`,
            descriptionUrdu: `ایل پی جی فروخت: ${inv.quantity} سلنڈر (${inv.cylinderSize})`,
            debit: inv.subtotal,
            credit: 0,
            balance: currentBal,
            emptyCylindersDelta: emptyDelta,
            runningEmptyCylinders: currentEmpty,
            rawItem: inv,
          });

          // 2. If immediate payment was made on this invoice, show credit row
          if (inv.amountPaid > 0) {
            currentBal -= inv.amountPaid;
            entries.push({
              id: `inv_credit_${inv.id}`,
              date: inv.date,
              time: inv.time,
              reference: `${inv.invoiceNumber}-PAY`,
              type: 'PAYMENT',
              description: `Cash received with invoice ${inv.invoiceNumber}`,
              descriptionUrdu: `بل کے ساتھ نقد وصولی (${inv.invoiceNumber})`,
              debit: 0,
              credit: inv.amountPaid,
              balance: currentBal,
              emptyCylindersDelta: 0,
              runningEmptyCylinders: currentEmpty,
              rawItem: inv,
            });
          }
        } else if (tx.type === 'PAYMENT') {
          const p = tx.item as Payment;
          currentBal -= p.amount;
          entries.push({
            id: `pay_${p.id}`,
            date: p.date,
            time: p.time,
            reference: p.paymentNumber,
            type: 'PAYMENT',
            description: `Payment Received via ${p.paymentMethod} ${p.referenceNumber ? `(Ref: ${p.referenceNumber})` : ''}`,
            descriptionUrdu: `رقم وصولی بذریعہ ${p.paymentMethod} ${p.referenceNumber ? `(حوالہ: ${p.referenceNumber})` : ''}`,
            debit: 0,
            credit: p.amount,
            balance: currentBal,
            emptyCylindersDelta: 0,
            runningEmptyCylinders: currentEmpty,
            rawItem: p,
          });
        } else if (tx.type === 'CYLINDER_ENTRY') {
          const cTx = tx.item as CylinderTransaction;
          const delta = cTx.customerEmptyDelta || 0;
          currentEmpty = Math.max(0, currentEmpty + delta);
          entries.push({
            id: `cyl_${cTx.id}`,
            date: cTx.date,
            time: cTx.time,
            reference: 'CYL-TXN',
            type: 'CYLINDER_ENTRY',
            description: cTx.notes || (delta > 0 ? 'Empty Cylinder Given to customer' : 'Empty Cylinder Received from customer'),
            descriptionUrdu: delta > 0 ? 'گاہک کو خالی سلنڈر دیا گیا' : 'گاہک سے خالی سلنڈر وصول ہوا',
            debit: 0,
            credit: 0,
            balance: currentBal,
            emptyCylindersDelta: delta,
            runningEmptyCylinders: currentEmpty,
            rawItem: cTx,
          });
        }
      });

      return entries;
    },
    [customers, invoices, payments, cylinderTransactions]
  );

  // Customer CRUD
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const id = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...data,
      id,
      customerId: data.customerId || getNextCustomerId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCustomer = (id: string): boolean => {
    // Check if customer has invoices
    const hasInvoices = invoices.some((inv) => inv.customerId === id);
    if (hasInvoices) {
      return false; // Cannot delete customer with existing invoices
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setPayments((prev) => prev.filter((p) => p.customerId !== id));
    setCylinderTransactions((prev) => prev.filter((t) => t.customerId !== id));
    return true;
  };

  // Invoice CRUD
  const addInvoice = (data: Omit<LPGInvoice, 'id' | 'invoiceNumber' | 'createdAt'>): LPGInvoice => {
    const id = `inv_${Date.now()}`;
    const invoiceNumber = getNextInvoiceNumber();
    const newInvoice: LPGInvoice = {
      ...data,
      id,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    // 1. Save invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // 2. If Amount Paid > 0, record in payments database
    if (newInvoice.amountPaid > 0) {
      const payId = `pay_${Date.now()}`;
      const paymentNumber = getNextPaymentNumber();
      const newPayment: Payment = {
        id: payId,
        paymentNumber,
        customerId: newInvoice.customerId,
        customerName: newInvoice.customerName,
        customerMobile: newInvoice.customerMobile,
        date: newInvoice.date,
        time: newInvoice.time,
        amount: newInvoice.amountPaid,
        paymentMethod: 'Cash',
        referenceNumber: invoiceNumber,
        notes: `Cash received with Invoice #${invoiceNumber}`,
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    // 3. Update stock & create Cylinder Transaction
    // Rule: Full Stock decreases by quantity sold
    // Empty Stock increases by empty received
    // Empty given decreases Empty Stock
    const fullDelta = -newInvoice.quantity;
    const emptyDelta = (newInvoice.emptyCylindersReceived || 0) - (newInvoice.emptyCylindersGiven || 0);
    const customerEmptyDelta = (newInvoice.emptyCylindersGiven || 0) - (newInvoice.emptyCylindersReceived || 0);

    const cylinderTxn: CylinderTransaction = {
      id: `cyl_${Date.now()}`,
      date: newInvoice.date,
      time: newInvoice.time,
      type: 'INVOICE_SALE',
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      relatedInvoiceId: id,
      fullCylindersDelta: fullDelta,
      emptyCylindersDelta: emptyDelta,
      customerEmptyDelta: customerEmptyDelta,
      notes: `Invoice ${invoiceNumber}: ${newInvoice.quantity} Full Sold, ${newInvoice.emptyCylindersReceived} Empty Received, ${newInvoice.emptyCylindersGiven} Empty Given`,
      createdAt: new Date().toISOString(),
    };

    setCylinderTransactions((prev) => [cylinderTxn, ...prev]);

    // 3. Update shop inventory
    setInventory((prev) => ({
      ...prev,
      fullCylindersInStock: prev.fullCylindersInStock + fullDelta,
      emptyCylindersInStock: prev.emptyCylindersInStock + emptyDelta,
      lastUpdated: new Date().toISOString(),
    }));

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<LPGInvoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
  };

  const deleteInvoice = (id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;

    // Restore inventory by reversing the cylinder transaction
    const relatedTx = cylinderTransactions.find((tx) => tx.relatedInvoiceId === id);
    if (relatedTx) {
      setInventory((prev) => ({
        ...prev,
        fullCylindersInStock: prev.fullCylindersInStock - relatedTx.fullCylindersDelta,
        emptyCylindersInStock: prev.emptyCylindersInStock - relatedTx.emptyCylindersDelta,
        lastUpdated: new Date().toISOString(),
      }));
      // Remove transaction
      setCylinderTransactions((prev) => prev.filter((tx) => tx.relatedInvoiceId !== id));
    }

    // Remove auto-generated payment if any
    setPayments((prev) => prev.filter((p) => p.referenceNumber !== target.invoiceNumber));

    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // Payment CRUD
  const addPayment = (data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>): Payment => {
    const id = `pay_${Date.now()}`;
    const paymentNumber = getNextPaymentNumber();
    const newPayment: Payment = {
      ...data,
      id,
      paymentNumber,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Cylinder Transactions & Stock Adjustments
  const addCylinderTransaction = (entry: Omit<CylinderTransaction, 'id' | 'createdAt'>): CylinderTransaction => {
    const id = `cyl_${Date.now()}`;
    const newTx: CylinderTransaction = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };

    setCylinderTransactions((prev) => [newTx, ...prev]);

    // Apply to inventory
    setInventory((prev) => ({
      ...prev,
      fullCylindersInStock: prev.fullCylindersInStock + (entry.fullCylindersDelta || 0),
      emptyCylindersInStock: prev.emptyCylindersInStock + (entry.emptyCylindersDelta || 0),
      lastUpdated: new Date().toISOString(),
    }));

    return newTx;
  };

  const updateInventory = (updates: Partial<Inventory>) => {
    setInventory((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateSettings = (updates: Partial<BusinessSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // System Alerts (Low stock, outstanding balances)
  const alerts = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const today = getTodayDateString();

    // 1. Low Full Cylinder Stock
    if (inventory.fullCylindersInStock <= inventory.lowStockThresholdFull) {
      list.push({
        id: 'alert_low_full',
        type: 'danger',
        title: 'Low Full Stock Alert!',
        titleUrdu: 'بھرے سلنڈر کا اسٹاک کم ہے!',
        message: `Only ${inventory.fullCylindersInStock} full cylinders left in shop. Please order plant refill immediately.`,
        messageUrdu: `دکان میں صرف ${inventory.fullCylindersInStock} بھرے سلنڈر باقی ہیں۔ فوری پلانٹ سے گاڑی منگوائیں۔`,
        date: today,
      });
    }

    // 2. Low Empty Cylinder Stock
    if (inventory.emptyCylindersInStock <= inventory.lowStockThresholdEmpty) {
      list.push({
        id: 'alert_low_empty',
        type: 'warning',
        title: 'Low Empty Cylinder Stock',
        titleUrdu: 'خالی سلنڈرز کا اسٹاک کم ہے',
        message: `Only ${inventory.emptyCylindersInStock} empty cylinders in shop. Collect empty cylinders from customers.`,
        messageUrdu: `دکان میں صرف ${inventory.emptyCylindersInStock} خالی سلنڈر موجود ہیں۔ گاہکوں سے خالی سلنڈر واپس لیں۔`,
        date: today,
      });
    }

    // 3. Customers with High Outstanding Balances (> Rs. 10,000)
    customers.forEach((cust) => {
      const balance = getCustomerBalance(cust.id);
      if (balance > 10000) {
        list.push({
          id: `alert_high_baqaya_${cust.id}`,
          type: 'warning',
          title: `High Balance: ${cust.name}`,
          titleUrdu: `زیادہ بقایا رقم: ${cust.name}`,
          message: `Customer owes Rs. ${balance.toLocaleString()}. Collect payment soon.`,
          messageUrdu: `گاہک کے ذمہ Rs. ${balance.toLocaleString()} بقایا ہیں۔ جلد وصولی کریں۔`,
          customerId: cust.id,
          date: today,
        });
      }
    });

    return list;
  }, [inventory, customers, getCustomerBalance]);

  // Export / Import Data
  const exportBackup = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      businessName: settings.businessName,
      customers,
      invoices,
      payments,
      cylinderTransactions,
      inventory,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INSAF_LPG_BACKUP_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers && parsed.invoices) {
        setCustomers(parsed.customers);
        setInvoices(parsed.invoices);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.cylinderTransactions) setCylinderTransactions(parsed.cylinderTransactions);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.settings) setSettings(parsed.settings);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetToDefaults = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setPayments(INITIAL_PAYMENTS);
    setCylinderTransactions(INITIAL_CYLINDER_TRANSACTIONS);
    setInventory(INITIAL_INVENTORY);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        invoices,
        payments,
        cylinderTransactions,
        inventory,
        settings,
        isAuthenticated,
        login,
        logout,
        lockApp,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addPayment,
        deletePayment,
        addCylinderTransaction,
        updateInventory,
        updateSettings,
        getCustomerBalance,
        getCustomerEmptyCylinders,
        getCustomerLedger,
        getNextInvoiceNumber,
        getNextPaymentNumber,
        getNextCustomerId,
        alerts,
        exportBackup,
        importBackup,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
