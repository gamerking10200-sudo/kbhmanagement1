import React, { useState, useEffect } from 'react';
import { Shield, Eye, Lock, Delete, KeyRound, AlertCircle, Fuel, Sparkles, Moon, Sun } from 'lucide-react';
import { AppCredentials, AppTheme, UserSession } from '../types';
import { StorageService } from '../utils/storage';

interface PinLoginProps {
  credentials?: AppCredentials;
  theme?: AppTheme;
  onToggleTheme?: () => void;
  onLoginSuccess?: (session: UserSession) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({
  credentials,
  theme = 'iphone-dark',
  onToggleTheme,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const isLight = theme === 'iphone-light';
  const activeCredentials = credentials || StorageService.getCredentials();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 4) {
      setIsSubmitting(true);
      setTimeout(() => {
        verifyPin(nextPin);
        setIsSubmitting(false);
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (enteredPin: string) => {
    const creds = activeCredentials || { partnerPin: '1234', managerPin: '5678', adminPin: '1122' };

    if (enteredPin === creds.adminPin) {
      // CEO / Admin Jalees: Full authority
      onLoginSuccess?.({
        role: 'ceo_jalees',
        label: 'CEO / Admin Jalees',
        name: 'Jalees (CEO)',
        canEdit: true,
        canEditRates: true,
        canEditPartners: true,
        canDeleteEntries: true,
      });
      return;
    }

    if (enteredPin === creds.partnerPin) {
      // Partner: Eyes Only (Read-Only)
      onLoginSuccess?.({
        role: 'partner',
        label: 'Partner (Eyes Only)',
        name: 'Partner (View Only)',
        canEdit: false,
        canEditRates: false,
        canEditPartners: false,
        canDeleteEntries: false,
      });
      return;
    }

    if (enteredPin === creds.managerPin) {
      // Station Manager: Eyes Only (Read-Only)
      onLoginSuccess?.({
        role: 'manager',
        label: 'Station Manager (Eyes Only)',
        name: 'Manager (View Only)',
        canEdit: false,
        canEditRates: false,
        canEditPartners: false,
        canDeleteEntries: false,
      });
      return;
    }

    // Invalid PIN
    setError('Incorrect Security PIN. Please verify and try again.');
    setPin('');
  };

  // Keyboard support for typing PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
        isLight
          ? 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl transition-opacity duration-300 ${
            isLight ? 'bg-blue-400/15' : 'bg-blue-600/10'
          }`}
        />
        <div
          className={`absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl transition-opacity duration-300 ${
            isLight ? 'bg-indigo-400/15' : 'bg-emerald-600/10'
          }`}
        />
      </div>

      {/* iPhone 18 Frame Container */}
      <div
        className={`relative w-full max-w-[420px] rounded-[36px] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 shadow-2xl flex flex-col items-center border ${
          isLight
            ? 'bg-white/80 border-slate-300/80 shadow-slate-300/50'
            : 'bg-slate-900/80 border-slate-800 shadow-black/70'
        }`}
      >
        {/* iPhone 18 Dynamic Island */}
        <div
          className={`w-44 h-7 rounded-full flex items-center justify-between px-3.5 mb-6 shadow-inner ${
            isLight ? 'bg-slate-900 text-white' : 'bg-black text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium">
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] tracking-wide">Locked</span>
          </div>
          <div className="text-[11px] font-mono font-medium text-slate-300">
            {currentTime || '09:41'}
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Theme Toggle in top right */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={`Switch to ${isLight ? 'Dark Titanium' : 'Light Ceramic'} Theme`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        )}

        {/* Brand Icon & Heading */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-blue-500/25 mb-2.5 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Fuel className="w-7 h-7 text-blue-400" />
          </div>
        </div>

        <h1
          className={`text-xl font-black tracking-tight text-center ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          Kashfi Bro Holdings
        </h1>
        <p className={`text-xs mt-0.5 mb-4 text-center font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Petroleum Terminal • Enter 4-Digit Security PIN
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-3.5 mb-4">
          {[0, 1, 2, 3].map(index => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? 'bg-blue-600 border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                    : isLight
                    ? 'border-slate-300 bg-slate-100'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full mb-3 text-center">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* iOS 18 Smart Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDigit(num)}
              className={`h-14 rounded-2xl text-xl font-bold transition-all duration-100 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-800 active:bg-blue-50'
                  : 'bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-white active:bg-blue-600/30'
              }`}
            >
              <span>{num}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className={`h-14 rounded-2xl text-[11px] font-bold tracking-wider uppercase transition-all duration-100 flex items-center justify-center cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400'
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDigit('0')}
            className={`h-14 rounded-2xl text-xl font-bold transition-all duration-100 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-800 active:bg-blue-50'
                : 'bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-white active:bg-blue-600/30'
            }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`h-14 rounded-2xl transition-all duration-100 flex items-center justify-center cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                : 'bg-slate-800/40 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400'
            }`}
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials Reference Box (Mandated by user) */}
        <div
          className={`w-full rounded-2xl p-3.5 text-xs space-y-2 border transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-1.5 border-inherit">
            <div className="flex items-center gap-1.5 font-bold">
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Eyes Only Credentials (Read-Only)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Terminal v18</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="text-slate-400 font-medium">Partner (Eyes Only)</div>
              <div className="font-mono text-xs font-bold text-blue-500 mt-0.5">
                PIN: {activeCredentials.partnerPin || '1234'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">View-only analytics</div>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="text-slate-400 font-medium">Manager (Eyes Only)</div>
              <div className="font-mono text-xs font-bold text-emerald-500 mt-0.5">
                PIN: {activeCredentials.managerPin || '5678'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">View-only closing</div>
            </div>
          </div>

          {/* CEO / Admin Notice: Invisible PIN, no link bypass */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isLight
                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                : 'bg-indigo-950/30 border-indigo-900/40 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <div className="font-bold text-[11px]">CEO / Admin Jalees</div>
                <div className="text-[10px] text-slate-400">
                  Full Authority • PIN is invisible (Default: 1122)
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0">
              ••••
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
