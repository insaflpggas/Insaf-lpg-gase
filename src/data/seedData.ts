import { Customer, LPGInvoice, Payment, CylinderTransaction, Inventory, BusinessSettings } from '../types';

export const INITIAL_SETTINGS: BusinessSettings = {
  businessName: 'INSAAF LPG GAS',
  businessNameUrdu: 'انصاف ایل پی جی گیس',
  businessPhone: '',
  businessAddress: 'Kot Abdul Malik, Dosako Chowk, Khaki Bazar',
  businessAddressUrdu: 'کوٹ عبدالمالک، دوساکو چوک، خاکی بازار',
  invoiceFooter: 'شکریہ برائے تشریف آوری! سلنڈر احتیاط اور حفاظتی تدابیر کے ساتھ استعمال کریں۔',
  invoiceFooterUrdu: 'شکریہ برائے تشریف آوری! سلنڈر احتیاط کے ساتھ استعمال کریں۔',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  defaultCylinderPrice: 3200,
  cylinderSizes: [
    { id: '11.8kg', name: '11.8 KG (Domestic / گھریلو)', weight: '11.8 KG', defaultPrice: 3200, isDefault: true },
    { id: '15.0kg', name: '15.0 KG (Commercial / کمرشل)', weight: '15.0 KG', defaultPrice: 4100 },
    { id: '45.4kg', name: '45.4 KG (Commercial / کمرشل)', weight: '45.4 KG', defaultPrice: 12200 },
    { id: '6.0kg', name: '6.0 KG (Small / چھوٹا)', weight: '6.0 KG', defaultPrice: 1650 },
  ],
  securityPin: '1234',
  ownerName: 'Admin',
  languageMode: 'both',
};

// Initial Inventory starts clean with 0 stock on fresh setup
export const INITIAL_INVENTORY: Inventory = {
  fullCylindersInStock: 0,
  emptyCylindersInStock: 0,
  allowNegativeStock: true, // Allows shopkeeper to sell immediately before entering full stock count
  lowStockThresholdFull: 5,
  lowStockThresholdEmpty: 5,
  lastUpdated: new Date().toISOString(),
};

// ZERO demo / sample data - 100% clean brand new startup
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_INVOICES: LPGInvoice[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_CYLINDER_TRANSACTIONS: CylinderTransaction[] = [];

