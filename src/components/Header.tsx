import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Search,
  Lock,
  Bell,
  X,
  User,
  FileText,
  CreditCard,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Home,
  Users,
  BookOpen,
  Layers,
  Package,
  BarChart3,
  Settings,
  PlusCircle,
  MapPin,
} from 'lucide-react';
import { Customer, LPGInvoice, Payment } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  onOpenCustomerLedger: (customerId: string) => void;
  onOpenInvoiceReceipt: (invoice: LPGInvoice) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCustomerLedger,
  onOpenInvoiceReceipt,
  activeTab,
  setActiveTab,
}) => {
  const { settings, inventory, alerts, lockApp, customers, invoices, payments, getCustomerBalance } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAlertsPopover, setShowAlertsPopover] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowAlertsPopover(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchModal]);

  // Global Search Filters
  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.mobile.includes(searchQuery) ||
          c.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredInvoices = searchQuery.trim()
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerMobile.includes(searchQuery)
      )
    : [];

  const filteredPayments = searchQuery.trim()
    ? payments.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const hasResults =
    filteredCustomers.length > 0 || filteredInvoices.length > 0 || filteredPayments.length > 0;

  // The 9 Main Menu items requested by the user
  const menuItems = [
    { id: 'dashboard', labelEn: 'Dashboard', labelUrdu: 'ڈیش بورڈ', icon: Home },
    { id: 'customers', labelEn: 'Customers', labelUrdu: 'گاہک', icon: Users },
    { id: 'new-bill', labelEn: 'New Bill', labelUrdu: 'نیا بل', icon: PlusCircle, isPrimary: true },
    { id: 'ledger', labelEn: 'Khata', labelUrdu: 'کھاتہ', icon: BookOpen },
    { id: 'payments', labelEn: 'Payments', labelUrdu: 'وصولی', icon: CreditCard },
    { id: 'empty-cylinders', labelEn: 'Empty Cylinders', labelUrdu: 'خالی سلنڈر', icon: Layers },
    { id: 'stock', labelEn: 'Stock', labelUrdu: 'اسٹاک', icon: Package },
    { id: 'reports', labelEn: 'Reports', labelUrdu: 'رپورٹس', icon: BarChart3 },
    { id: 'settings', labelEn: 'Settings', labelUrdu: 'سیٹنگز', icon: Settings },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        {/* Top Brand & Search Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg leading-tight uppercase">
                  {settings.businessName}
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  LPG POS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-urdu leading-tight">
                <span>{settings.businessNameUrdu}</span>
                <span className="text-slate-500 hidden md:inline">•</span>
                <span className="hidden md:inline text-slate-400 text-[10px] font-sans flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {settings.businessAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Search Trigger Button */}
          <div className="flex-1 max-w-md mx-1 sm:mx-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center justify-between gap-2 bg-slate-800 hover:bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-colors text-left shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">تلاش / Search customer, mobile, bill #...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Stock Badges & Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Stock Snapshot */}
            <div
              onClick={() => setActiveTab('stock')}
              className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
              title="Click to view stock"
            >
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span className="text-slate-400 font-urdu">بھرے:</span>
                <span className="font-bold text-emerald-400 font-mono">{inventory.fullCylindersInStock}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span className="text-slate-400 font-urdu">خالی:</span>
                <span className="font-bold text-amber-400 font-mono">{inventory.emptyCylindersInStock}</span>
              </div>
            </div>

            {/* Notifications Bell with Popover */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsPopover(!showAlertsPopover)}
                className={`p-2 rounded-xl border relative transition-colors ${
                  alerts.length > 0
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Alerts & Notices"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Popover */}
              {showAlertsPopover && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm">اطلاعات اور تنبیہات / Alerts</span>
                    </div>
                    <button
                      onClick={() => setShowAlertsPopover(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      <span>تمام نظام درست ہے! کوئی فوری الرٹ نہیں ہے۔</span>
                      <span>All stocks and balances are normal.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            alert.type === 'danger'
                              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                              : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                          }`}
                        >
                          <div className="font-bold mb-0.5">{alert.title}</div>
                          <div className="font-urdu text-amber-300 text-xs mb-1">{alert.titleUrdu}</div>
                          <div className="text-slate-300 text-[11px] leading-relaxed">{alert.message}</div>
                          {alert.customerId && (
                            <button
                              onClick={() => {
                                setShowAlertsPopover(false);
                                onOpenCustomerLedger(alert.customerId!);
                              }}
                              className="mt-2 inline-block text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/40"
                            >
                              کھاتہ کھولیں / Open Ledger →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Lock Button */}
            <button
              onClick={lockApp}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
              title="Lock App / لاگ آؤٹ"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 9 Main Menu Navigation Tabs */}
        <nav className="bg-slate-950/90 border-t border-slate-800/80 px-2 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-1.5 py-1.5 min-w-max">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : item.isPrimary
                      ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 stroke-[2.5]' : ''}`} />
                  <span className="font-urdu text-[13px]">{item.labelUrdu}</span>
                  <span className="opacity-70 text-[11px] font-sans">/ {item.labelEn}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden mt-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, mobile 03xx, invoice INV-..., payment PAY-..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700"
              >
                ESC
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-4 space-y-4">
              {!searchQuery.trim() ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                  <p className="font-urdu text-sm text-slate-300">
                    گاہک کا نام، موبائل نمبر، انوائس یا وصولی تلاش کریں
                  </p>
                  <p>Type to search across Customers, Invoices, and Payments</p>
                </div>
              ) : !hasResults ? (
                <div className="text-center py-8 text-slate-400 text-xs font-urdu space-y-1">
                  <p className="text-base text-slate-300 font-bold">ابھی کوئی ریکارڈ موجود نہیں</p>
                  <p>No matching customers, invoices, or payments found for "{searchQuery}"</p>
                </div>
              ) : (
                <>
                  {/* Customers Section */}
                  {filteredCustomers.length > 0 && (
                    <div>
                      <div className="text-[11px] uppercase font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>گاہک / Customers ({filteredCustomers.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {filteredCustomers.map((cust) => {
                          const bal = getCustomerBalance(cust.id);
                          return (
                            <div
                              key={cust.id}
                              onClick={() => {
                                setShowSearchModal(false);
                                onOpenCustomerLedger(cust.id);
                              }}
                              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <div className="font-bold text-white text-sm">{cust.name}</div>
                                <div className="text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                                  <span>{cust.mobile}</span>
                                  <span>•</span>
                                  <span>{cust.customerId}</span>
                                  {cust.address && <span>• {cust.address}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    bal > 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {bal > 0 ? `Baqaya: ${formatCurrency(bal)}` : 'Clear'}
                                </span>
                                <div className="text-[10px] text-amber-400 font-urdu">
                                  کھاتہ کھولیں →
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Invoices Section */}
                  {filteredInvoices.length > 0 && (
                    <div>
                      <div className="text-[11px] uppercase font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>انوائسز اور بل / Invoices ({filteredInvoices.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {filteredInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onOpenInvoiceReceipt(inv);
                            }}
                            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <div className="font-mono font-bold text-amber-400 text-sm">
                                {inv.invoiceNumber}
                              </div>
                              <div className="text-slate-300 font-semibold mt-0.5">
                                {inv.customerName} ({inv.cylinderSize} × {inv.quantity})
                              </div>
                              <div className="text-slate-500 text-[10px]">
                                {inv.date} {inv.time}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-white text-sm">
                                {formatCurrency(inv.totalAmount)}
                              </div>
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  inv.remainingBalance <= 0
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {inv.remainingBalance <= 0 ? 'PAID' : `Baqaya: ${formatCurrency(inv.remainingBalance)}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payments Section */}
                  {filteredPayments.length > 0 && (
                    <div>
                      <div className="text-[11px] uppercase font-bold text-purple-400 mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>وصولیاں / Payments ({filteredPayments.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {filteredPayments.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onOpenCustomerLedger(p.customerId);
                            }}
                            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-mono text-purple-400 font-bold">
                                {p.paymentNumber}
                              </span>
                              <span className="text-slate-300 font-bold ml-2">
                                {p.customerName}
                              </span>
                              <div className="text-slate-500 text-[10px] mt-0.5">
                                {p.date} • Method: {p.paymentMethod} {p.referenceNumber && `• Ref: ${p.referenceNumber}`}
                              </div>
                            </div>
                            <div className="text-right font-mono font-bold text-emerald-400 text-sm">
                              +{formatCurrency(p.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

