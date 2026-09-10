import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthLockScreen: React.FC = () => {
  const { settings, login } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('براہ کرم سیکیورٹی پن درج کریں / Please enter PIN');
      return;
    }

    const success = login(pin);
    if (!success) {
      setError('غلط سیکیورٹی پن / Incorrect PIN. Try again.');
      setPin('');
    } else {
      setError('');
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      // Auto-submit if reaches configured PIN length
      if (nextPin.length === settings.securityPin.length) {
        const success = login(nextPin);
        if (!success) {
          setError('غلط سیکیورٹی پن / Incorrect PIN');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        {/* Brand Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg mb-3">
            <Flame className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{settings.businessName}</h1>
          <p className="text-lg font-urdu text-amber-400 mt-0.5">{settings.businessNameUrdu}</p>
          <p className="text-xs text-slate-400 mt-1">LPG Gas Business Management & POS</p>
        </div>

        {/* Lock Notice */}
        <div className="bg-slate-700/50 rounded-xl p-3 mb-6 border border-slate-600/60 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200">مالک کا محفوظ لاگ ان / Owner Login</p>
            <p className="text-xs text-slate-400">Enter your secure 4-digit PIN</p>
          </div>
        </div>

        {/* PIN dots display */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex justify-center items-center gap-3 mb-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    filled
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'border-slate-500 bg-slate-900/60'
                  }`}
                />
              );
            })}
          </div>

          <div className="relative mb-2">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full text-center bg-slate-900 border border-slate-600 text-white rounded-xl py-2.5 px-4 text-lg tracking-widest focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium py-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <span>ان لاگ ان کریں / Unlock App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Keypad for mobile touch */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 text-white text-xl font-bold flex items-center justify-center transition-transform active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPin(settings.securityPin);
              setError('');
            }}
            title="Quick Auto-fill Default PIN"
            className="h-12 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 text-amber-300 text-xs font-semibold flex flex-col items-center justify-center p-1"
          >
            <KeyRound className="w-3.5 h-3.5 mb-0.5" />
            <span>Auto PIN</span>
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 text-white text-xl font-bold flex items-center justify-center transition-transform active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 text-rose-300 text-sm font-bold flex items-center justify-center transition-transform active:scale-95"
          >
            ⌫ Del
          </button>
        </div>

        {/* Demo Helper Hint */}
        <div className="text-center pt-2 border-t border-slate-700/60">
          <p className="text-xs text-slate-400">
            ڈیفالٹ پن کوڈ / Default PIN:{' '}
            <span className="font-mono font-bold text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
              {settings.securityPin}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
