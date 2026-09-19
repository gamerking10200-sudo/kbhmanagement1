import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Lock, 
  KeyRound, 
  Share2, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  Eye, 
  Bell,
  PlusCircle,
  Coins,
  Sun,
  Moon,
  Sparkles,
  Wifi,
  BatteryMedium,
  Building2,
  Cloud,
  FileCode,
  Ruler
} from 'lucide-react';
import { AppTheme, TabType, UserSession } from '../types';

interface HeaderNavProps {
  session: UserSession;
  theme: AppTheme;
  currentTab: TabType;
  stationCount: number;
  unreadNotificationsCount: number;
  onSelectTab: (tab: TabType) => void;
  onToggleTheme: () => void;
  onLock: () => void;
  onOpenShareModal: () => void;
  onOpenPrintModal: () => void;
  onOpenPinModal: () => void;
  onOpenAddStationModal: () => void;
  onOpenFinalHtmlModal?: () => void;
  onOpenNotificationsModal: () => void;
  onOpenBankModal?: () => void;
  onOpenDipTestModal?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  session,
  theme,
  currentTab,
  stationCount,
  unreadNotificationsCount,
  onSelectTab,
  onToggleTheme,
  onLock,
  onOpenShareModal,
  onOpenPrintModal,
  onOpenPinModal,
  onOpenAddStationModal,
  onOpenFinalHtmlModal,
  onOpenNotificationsModal,
  onOpenBankModal,
  onOpenDipTestModal,
}) => {
  const [time, setTime] = useState<string>('');
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 no-print transition-colors duration-200">
      {/* iPhone 18 Top Status Bar & Dynamic Island */}
      <div
        className={`w-full px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-mono border-b backdrop-blur-xl ${
          isLight
            ? 'bg-slate-200/80 border-slate-300 text-slate-700'
            : 'bg-black/90 border-slate-800/80 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight">{time || '09:41'}</span>
          <span className="text-[10px] hidden sm:inline px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-semibold">
            5G Ultra
          </span>
        </div>

        {/* Dynamic Island Capsule */}
        <div
          onClick={onLock}
          title="Dynamic Island: Click to instantly Lock Terminal"
          className={`group flex items-center gap-2 px-3 py-0.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-inner border ${
            isLight
              ? 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
              : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-semibold tracking-wide">
            KBH Terminal • Active
          </span>
          <Lock className="w-2.5 h-2.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
        </div>

        <div className="flex items-center gap-2.5">
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1">
            <span className="text-[10px]">100%</span>
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Glass Navigation Bar */}
      <div
        className={`backdrop-blur-2xl border-b transition-colors duration-200 ${
          isLight
            ? 'bg-white/85 border-slate-200 shadow-sm'
            : 'bg-slate-900/90 border-slate-800 shadow-lg shadow-black/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Stations */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Fuel className="w-5 h-5 text-blue-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm sm:text-base font-black tracking-tight leading-none ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Kashfi Bro Holdings
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {stationCount} Stations
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5">
                iPhone 18 Pro Terminal • Petroleum Ledger & Oversight
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Multi-Scheme Switcher */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Active Theme: ${theme}. Click to switch theme (Ceramic Light, Nordic Frost, Sandstone Warm, Titanium Dark, Emerald Luxury, Midnight Amber)`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                theme === 'iphone-light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : theme === 'nordic-light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-900'
                  : theme === 'sandstone-light'
                  ? 'bg-[#f4efe8] hover:bg-[#eae3d8] border-stone-300 text-stone-900'
                  : theme === 'emerald-luxury'
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                  : theme === 'midnight-amber'
                  ? 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {theme === 'iphone-light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : theme === 'nordic-light' ? (
                <Sun className="w-3.5 h-3.5 text-sky-500" />
              ) : theme === 'sandstone-light' ? (
                <Sun className="w-3.5 h-3.5 text-orange-500" />
              ) : theme === 'emerald-luxury' ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              ) : theme === 'midnight-amber' ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden xl:inline text-[11px]">
                {theme === 'iphone-dark' 
                  ? 'Titanium' 
                  : theme === 'iphone-light' 
                  ? 'Ceramic' 
                  : theme === 'nordic-light'
                  ? 'Nordic Frost'
                  : theme === 'sandstone-light'
                  ? 'Sandstone'
                  : theme === 'emerald-luxury' 
                  ? 'Emerald' 
                  : 'Midnight'}
              </span>
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={onOpenNotificationsModal}
              title="System Notifications & Alerts Log"
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-sm">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Role Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
                session.role === 'ceo_jalees'
                  ? isLight
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-indigo-950/40 border-indigo-800 text-indigo-300'
                  : isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}
            >
              {session.role === 'ceo_jalees' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>CEO Jalees</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>Eyes Only</span>
                </>
              )}
            </div>

            {/* CEO EXCLUSIVE BUTTONS */}
            {session.role === 'ceo_jalees' && (
              <>
                {/* + Add New Gas Station */}
                <button
                  type="button"
                  onClick={onOpenAddStationModal}
                  title="Add New Gas Station, Tanks, and Nozzles"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Station +</span>
                </button>

                {/* Bank Accounts & Daily Treasury */}
                {onOpenBankModal && (
                  <button
                    type="button"
                    onClick={onOpenBankModal}
                    title="Manage Bank Accounts & Daily Cash/Profit Deposits"
                    className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden lg:inline">Bank Treasury</span>
                  </button>
                )}

                {/* Dip Test Quick Action */}
                {onOpenDipTestModal && (
                  <button
                    type="button"
                    onClick={onOpenDipTestModal}
                    title="Schedule & Log Physical Dip Test Calibration"
                    className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isLight
                        ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden lg:inline">Dip Test</span>
                  </button>
                )}

                {/* Final HTML for Sharing */}
                {onOpenFinalHtmlModal && (
                  <button
                    type="button"
                    onClick={onOpenFinalHtmlModal}
                    title="Download and Share Complete Standalone Final Executive HTML Statement"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer border border-indigo-400/40"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-200" />
                    <span className="hidden sm:inline">Final HTML for Sharing</span>
                    <span className="sm:hidden">Final HTML</span>
                  </button>
                )}

                {/* Change PINs */}
                <button
                  type="button"
                  onClick={onOpenPinModal}
                  title="Change Security PINs"
                  className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span className="hidden lg:inline">PINs</span>
                </button>
              </>
            )}

            {/* Google Drive Cloud */}
            <button
              type="button"
              onClick={() => onSelectTab('drive')}
              title="Google Drive Cloud Archiving & Backups"
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentTab === 'drive'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                  : isLight
                  ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Drive</span>
            </button>

            {/* Print / PDF Report */}
            <button
              type="button"
              onClick={onOpenPrintModal}
              title="Print / Save PDF Financial Statement"
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Share & Export */}
            <button
              type="button"
              onClick={onOpenShareModal}
              title="Share via WhatsApp, Email or Download Backup"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Lock / Log Out Button */}
            <button
              type="button"
              onClick={onLock}
              title="Lock Terminal (Return to PIN Screen)"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                  : 'bg-slate-800 hover:bg-rose-950/60 border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300'
              }`}
              aria-label="Lock terminal"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
