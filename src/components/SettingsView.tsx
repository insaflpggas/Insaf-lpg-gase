import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CylinderSizeConfig } from '../types';
import {
  Settings,
  Building,
  DollarSign,
  Shield,
  Save,
  Database,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const SettingsView: React.FC = () => {
  const {
    settings,
    inventory,
    updateSettings,
    updateInventory,
    resetToSeedData,
  } = useApp();

  // Local form state
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessNameUrdu, setBusinessNameUrdu] = useState(settings.businessNameUrdu);
  const [businessPhone, setBusinessPhone] = useState(settings.businessPhone);
  const [businessAddress, setBusinessAddress] = useState(settings.businessAddress);
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter);
  const [defaultCylinderPrice, setDefaultCylinderPrice] = useState(settings.defaultCylinderPrice);
  const [allowNegativeStock, setAllowNegativeStock] = useState(inventory.allowNegativeStock);
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState(
    inventory.lowStockAlertThreshold
  );

  // Cylinder sizes
  const [cylinderSizes, setCylinderSizes] = useState<CylinderSizeConfig[]>(
    settings.cylinderSizes
  );

  // Security PIN state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Handlers
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName,
      businessNameUrdu,
      businessPhone,
      businessAddress,
      invoiceFooter,
      defaultCylinderPrice: Number(defaultCylinderPrice) || 3100,
      cylinderSizes,
    });
    updateInventory({
      allowNegativeStock,
      lowStockAlertThreshold: Number(lowStockAlertThreshold) || 10,
    });
    setStatusMessage({
      type: 'success',
      text: 'ترتیبات کامیابی سے محفوظ ہو گئیں / Settings saved successfully!',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    const updated = [...cylinderSizes];
    updated[index].defaultPrice = newPrice;
    setCylinderSizes(updated);
  };

  const handleAddSize = () => {
    const newConfig: CylinderSizeConfig = {
      id: 'size_' + Date.now(),
      name: 'Custom KG',
      weight: '10 KG',
      defaultPrice: 3000,
      isDefault: false,
    };
    setCylinderSizes([...cylinderSizes, newConfig]);
  };

  const handleRemoveSize = (index: number) => {
    if (cylinderSizes.length <= 1) return;
    const updated = cylinderSizes.filter((_, i) => i !== index);
    setCylinderSizes(updated);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== settings.securityPin) {
      setStatusMessage({
        type: 'error',
        text: 'موجودہ پن کوڈ غلط ہے / Current PIN is incorrect',
      });
      return;
    }
    if (newPinInput.length < 4) {
      setStatusMessage({
        type: 'error',
        text: 'نیا پن کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے / New PIN must be at least 4 digits',
      });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setStatusMessage({
        type: 'error',
        text: 'نیا پن کوڈ مماثلت نہیں رکھتا / New PINs do not match',
      });
      return;
    }

    updateSettings({ securityPin: newPinInput });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setStatusMessage({
      type: 'success',
      text: 'سیکیورٹی پن کامیابی سے تبدیل ہو گیا / Security PIN updated successfully',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Database Backup Export (JSON)
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      customers: localStorage.getItem('insaf_lpg_customers'),
      invoices: localStorage.getItem('insaf_lpg_invoices'),
      payments: localStorage.getItem('insaf_lpg_payments'),
      inventory: localStorage.getItem('insaf_lpg_inventory'),
      cylinderTransactions: localStorage.getItem('insaf_lpg_cylinder_txs'),
      settings: localStorage.getItem('insaf_lpg_settings'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Insaf_LPG_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Database Backup Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.customers) localStorage.setItem('insaf_lpg_customers', data.customers);
        if (data.invoices) localStorage.setItem('insaf_lpg_invoices', data.invoices);
        if (data.payments) localStorage.setItem('insaf_lpg_payments', data.payments);
        if (data.inventory) localStorage.setItem('insaf_lpg_inventory', data.inventory);
        if (data.cylinderTransactions)
          localStorage.setItem('insaf_lpg_cylinder_txs', data.cylinderTransactions);
        if (data.settings) localStorage.setItem('insaf_lpg_settings', data.settings);

        alert('بیک اپ کامیابی سے بحال ہو گیا! ایپ کو ریفریش کیا جا رہا ہے۔');
        window.location.reload();
      } catch (err) {
        alert('خرابی: غلط بیک اپ فائل / Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <span>ترتیبات اور دکان سیٹنگز / Settings</span>
        </h1>
        <p className="text-xs text-slate-500 font-urdu mt-0.5">
          کاروبار کی معلومات، سلنڈر ریٹ لسٹ، سیکیورٹی پن اور بیک اپ
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form: Business Details */}
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base text-slate-900">
              کاروبار اور انوائس ہیڈر / Business Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                دکان کا نام (English) *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                دکان کا نام (اردو) *
              </label>
              <input
                type="text"
                value={businessNameUrdu}
                onChange={(e) => setBusinessNameUrdu(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابطہ نمبر / Phone Number *
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                دکان کا پتہ / Shop Address *
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                انوائس فوٹر پیغام / Invoice Footer Note
              </label>
              <input
                type="text"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-urdu"
              />
            </div>
          </div>
        </div>

        {/* Cylinder Sizes & Pricing Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-base text-slate-900">
                سلنڈر سائز اور ڈیفالٹ ریٹ / Cylinder Sizes & Rates
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddSize}
              className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + نیا سائز / Add Size
            </button>
          </div>

          <div className="space-y-3">
            {cylinderSizes.map((size, index) => (
              <div
                key={size.id}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center"
              >
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Cylinder Name & Weight:
                  </span>
                  <input
                    type="text"
                    value={size.name}
                    onChange={(e) => {
                      const updated = [...cylinderSizes];
                      updated[index].name = e.target.value;
                      setCylinderSizes(updated);
                    }}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Default Rate (PKR):
                  </span>
                  <input
                    type="number"
                    value={size.defaultPrice}
                    onChange={(e) =>
                      handleUpdatePrice(index, parseFloat(e.target.value) || 0)
                    }
                    className="w-full text-xs font-black p-2 bg-white border border-slate-300 rounded-lg text-right"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 sm:pt-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="defaultSizeRadio"
                      checked={size.isDefault}
                      onChange={() => {
                        const updated = cylinderSizes.map((s, i) => ({
                          ...s,
                          isDefault: i === index,
                        }));
                        setCylinderSizes(updated);
                      }}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold">ڈیفالٹ سائز</span>
                  </label>

                  {cylinderSizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock & Inventory Rules */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">
              اسٹاک رولز اور الرٹس / Stock Rules
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">
                  منفی اسٹاک کی اجازت دیں / Allow Negative Cylinder Stock
                </span>
                <span className="text-slate-500 font-urdu">
                  اگر دکان میں اسٹاک 0 ہو تب بھی بل بن سکے گا
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">
                  کم اسٹاک وارننگ حد / Low Stock Alert Threshold
                </span>
                <span className="text-slate-500 font-urdu">
                  جب بھرے سلنڈر اس تعداد سے کم ہوں تو الرٹ دکھائیں
                </span>
              </div>
              <input
                type="number"
                min={1}
                value={lowStockAlertThreshold}
                onChange={(e) =>
                  setLowStockAlertThreshold(parseInt(e.target.value, 10) || 5)
                }
                className="w-20 text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg text-center"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>تبدیلیاں محفوظ کریں / Save All Settings</span>
          </button>
        </div>
      </form>

      {/* Security PIN Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-purple-600" />
          <h2 className="font-bold text-base text-slate-900">
            سیکیورٹی پن کوڈ تبدیل کریں / Change Security PIN
          </h2>
        </div>

        <form onSubmit={handleChangePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              موجودہ پن کوڈ / Current PIN *
            </label>
            <input
              type="password"
              maxLength={6}
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="e.g. 1234"
              className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl tracking-widest text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نیا پن کوڈ / New PIN (4-6 digits) *
            </label>
            <input
              type="password"
              maxLength={6}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="New PIN"
              className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl tracking-widest text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نیا پن دوبارہ لکھیں / Confirm New PIN *
            </label>
            <input
              type="password"
              maxLength={6}
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="Confirm PIN"
              className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl tracking-widest text-center"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Lock className="w-4 h-4" />
              <span>پن اپ ڈیٹ کریں / Update PIN</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Data */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-base text-slate-900">
            ڈیٹا بیک اپ اور بحالی / Data Backup & Restore
          </h2>
        </div>

        <p className="text-xs text-slate-500 font-urdu leading-relaxed">
          اپنے تمام صارفین، گیس انوائسز، ادائیگیاں اور خالی سلنڈرز کا محفوظ بیک اپ فائل ڈاؤنلوڈ کریں۔ نئے موبائل یا کمپیوٹر میں وہی فائل اپلوڈ کر کے ڈیٹا دوبارہ دیکھا جا سکتا ہے۔
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>بیک اپ ڈاؤنلوڈ کریں / Download Backup JSON</span>
          </button>

          <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer border border-slate-300">
            <Upload className="w-4 h-4" />
            <span>بیک اپ فائل اپلوڈ کریں / Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'کیا آپ واقعی ڈیمو ڈیٹا بحال کرنا چاہتے ہیں؟ موجودہ اندراجات ختم ہو جائیں گی۔'
                )
              ) {
                resetToSeedData();
              }
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl flex items-center gap-1 border border-rose-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
