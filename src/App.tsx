import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CustomerManagement } from './components/CustomerManagement';
import { NewBillView } from './components/NewBillView';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { EmptyCylindersView } from './components/EmptyCylindersView';
import { StockView } from './components/StockView';
import { CylinderManagement } from './components/CylinderManagement';
import { PaymentList } from './components/PaymentList';
import { PaymentModal } from './components/PaymentModal';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AuthLockScreen } from './components/AuthLockScreen';
import { LPGInvoice } from './types';
import {
  Home,
  Users,
  FileText,
  Layers,
  BookOpen,
  Plus,
  MapPin,
  Flame,
  PlusCircle,
  CreditCard,
  Package,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, login, settings } = useApp();

  // Navigation views matching the 9 Main Menu items:
  // 'dashboard' | 'customers' | 'new-bill' | 'ledger' | 'payments' | 'empty-cylinders' | 'stock' | 'reports' | 'settings'
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Active modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedCustomerIdForInvoice, setSelectedCustomerIdForInvoice] = useState<string | undefined>();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerIdForPayment, setSelectedCustomerIdForPayment] = useState<string | undefined>();

  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<LPGInvoice | null>(null);
  const [activeLedgerCustomerId, setActiveLedgerCustomerId] = useState<string | undefined>();

  // If locked & security PIN required on start, show AuthLockScreen
  if (!isAuthenticated && settings.requirePinOnStart) {
    return <AuthLockScreen onUnlock={() => login(settings.securityPin)} />;
  }

  // Navigation handlers
  const handleOpenNewInvoice = (customerId?: string) => {
    setSelectedCustomerIdForInvoice(customerId);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenReceivePayment = (customerId?: string) => {
    setSelectedCustomerIdForPayment(customerId);
    setIsPaymentModalOpen(true);
  };

  const handleViewCustomerLedger = (customerId: string) => {
    setActiveLedgerCustomerId(customerId);
    setCurrentView('ledger');
  };

  const handleInvoiceCreated = (invoice: LPGInvoice) => {
    setActiveReceiptInvoice(invoice);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-amber-500 selection:text-white pb-16 md:pb-6">
      {/* Top Header with 9 Tabs & Search Bar */}
      <Header
        activeTab={currentView}
        setActiveTab={setCurrentView}
        onOpenCustomerLedger={handleViewCustomerLedger}
        onOpenInvoiceReceipt={(inv) => setActiveReceiptInvoice(inv)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {currentView === 'dashboard' && (
          <Dashboard
            onNavigate={setCurrentView}
            onNewInvoice={() => setCurrentView('new-bill')}
            onNewPayment={() => handleOpenReceivePayment()}
            onViewInvoiceReceipt={(inv) => setActiveReceiptInvoice(inv)}
            onViewCustomerLedger={handleViewCustomerLedger}
          />
        )}

        {currentView === 'customers' && (
          <CustomerManagement
            onViewLedger={handleViewCustomerLedger}
            onNewInvoiceForCustomer={(cId) => {
              setSelectedCustomerIdForInvoice(cId);
              setCurrentView('new-bill');
            }}
            onReceivePaymentForCustomer={(cId) => handleOpenReceivePayment(cId)}
          />
        )}

        {currentView === 'new-bill' && (
          <NewBillView
            onInvoiceCreated={handleInvoiceCreated}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'invoices' && (
          <InvoiceList
            onNewInvoice={() => setCurrentView('new-bill')}
            onOpenReceipt={(inv) => setActiveReceiptInvoice(inv)}
          />
        )}

        {currentView === 'ledger' && (
          <CustomerLedgerView
            initialCustomerId={activeLedgerCustomerId}
            onNewInvoiceForCustomer={(cId) => {
              setSelectedCustomerIdForInvoice(cId);
              setCurrentView('new-bill');
            }}
            onReceivePaymentForCustomer={(cId) => handleOpenReceivePayment(cId)}
          />
        )}

        {currentView === 'payments' && (
          <PaymentList
            onNewPayment={() => handleOpenReceivePayment()}
            onViewCustomerLedger={handleViewCustomerLedger}
          />
        )}

        {(currentView === 'empty-cylinders' || currentView === 'cylinders') && (
          <EmptyCylindersView onViewCustomerLedger={handleViewCustomerLedger} />
        )}

        {currentView === 'stock' && <StockView />}

        {currentView === 'reports' && <ReportsView />}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Business Footer displaying Business Name and Address */}
      <footer className="mt-8 py-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm text-center text-xs text-slate-500 space-y-1.5 print:hidden">
        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>{settings.businessName}</span>
          <span>•</span>
          <span className="font-urdu text-sm">{settings.businessNameUrdu}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-slate-600 text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>{settings.businessAddress}</span>
        </div>
        <div className="text-[10px] text-slate-400">
          LPG Gas Business Management • Invoices, Khata & Cylinder Stock
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
            currentView === 'dashboard' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>ڈیش بورڈ</span>
        </button>

        <button
          onClick={() => setCurrentView('customers')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
            currentView === 'customers' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>گاہک</span>
        </button>

        {/* Center Floating Plus Action for New Sale Bill */}
        <button
          onClick={() => setCurrentView('new-bill')}
          className="flex flex-col items-center -mt-5 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 p-3 rounded-full shadow-xl active:scale-95 transition-transform font-black border-2 border-slate-900"
          title="نیا بل بنائیں / New LPG Bill"
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setCurrentView('ledger')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
            currentView === 'ledger' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>کھاتہ</span>
        </button>

        <button
          onClick={() => setCurrentView('empty-cylinders')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
            currentView === 'empty-cylinders' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>سلنڈر</span>
        </button>
      </nav>

      {/* Global Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedCustomerIdForInvoice(undefined);
        }}
        onInvoiceCreated={handleInvoiceCreated}
        initialCustomerId={selectedCustomerIdForInvoice}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedCustomerIdForPayment(undefined);
        }}
        initialCustomerId={selectedCustomerIdForPayment}
      />

      <InvoiceReceiptModal
        invoice={activeReceiptInvoice}
        onClose={() => setActiveReceiptInvoice(null)}
        onViewLedger={handleViewCustomerLedger}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

