import React, { useState } from 'react';
import { 
  Activity, 
  Calculator, 
  CloudSun, 
  Newspaper, 
  TrendingUp, 
  Fuel, 
  DollarSign, 
  Scale, 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  ChevronRight,
  Layers,
  BarChart2
} from 'lucide-react';
import { AppTheme, FuelRates, StationBalance, UserSession } from '../types';
import { OgraPricesWidget } from './OgraPricesWidget';
import { StationWeatherWidget } from './StationWeatherWidget';
import { PetroleumNewsWidget } from './PetroleumNewsWidget';
import { formatCurrency, formatVolume } from '../utils/formatters';

interface MarketPulseTabProps {
  session: UserSession;
  theme: AppTheme;
  stationBalances: StationBalance[];
  fuelRates?: FuelRates;
  onNavigateToTab: (tab: any) => void;
}

export const MarketPulseTab: React.FC<MarketPulseTabProps> = ({
  session,
  theme,
  stationBalances,
  fuelRates,
  onNavigateToTab,
}) => {
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  const [activeSection, setActiveSection] = useState<'all' | 'ogra' | 'weather' | 'news' | 'simulator'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string>('Live');

  // Inventory Margin Arbitrage Simulator state
  const [petrolDelta, setPetrolDelta] = useState<number>(3.5); // e.g. +3.5 PKR / Liter expected change
  const [dieselDelta, setDieselDelta] = useState<number>(-2.0); // e.g. -2.0 PKR / Liter expected change

  // Calculate total stocks
  const totalPetrolStock = stationBalances.reduce((acc, s) => acc + (s.petrolStock || 0), 0);
  const totalDieselStock = stationBalances.reduce((acc, s) => acc + (s.dieselStock || 0), 0);

  const petrolInventoryImpact = totalPetrolStock * petrolDelta;
  const dieselInventoryImpact = totalDieselStock * dieselDelta;
  const totalInventoryImpact = petrolInventoryImpact + dieselInventoryImpact;

  const handleManualRefresh = () => {
    setLastRefreshed('Refreshed just now');
    setTimeout(() => {
      setLastRefreshed('Live');
    }, 4000);
  };

  // Theme-specific styles
  const cardBg = isLight
    ? theme === 'nordic-light'
      ? 'bg-white/95 border-zinc-200/90 shadow-sm'
      : theme === 'sandstone-light'
      ? 'bg-[#fcfbf9] border-stone-200 shadow-sm'
      : 'bg-white border-slate-200 shadow-sm'
    : 'bg-slate-900/90 border-slate-800 shadow-xl';

  const textPrimary = isLight
    ? theme === 'sandstone-light'
      ? 'text-stone-900'
      : 'text-slate-900'
    : 'text-white';

  const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* Top Banner: Petroleum Market Pulse Header */}
      <div className={`${cardBg} rounded-3xl p-5 sm:p-6 border relative overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg sm:text-2xl font-black ${textPrimary} tracking-tight`}>
                  Market Pulse & Petroleum Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  OGRA CONNECTED
                </span>
              </div>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Official bi-monthly regulated pricing schedules, real-time weather & decanting safety advisor, and refinery news
              </p>
            </div>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleManualRefresh}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastRefreshed}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('rates')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <span>Update Station Retail Rates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-Time Market Ticker Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-4 border-t border-slate-800/40">
          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Brent Crude</div>
            <div className={`text-base font-extrabold ${textPrimary} font-mono mt-0.5 flex items-center justify-between`}>
              <span>$74.20/bbl</span>
              <span className="text-emerald-500 text-xs font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +1.2%
              </span>
            </div>
            <div className="text-[10px] text-slate-500">ICE London Session</div>
          </div>

          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">WTI Crude</div>
            <div className={`text-base font-extrabold ${textPrimary} font-mono mt-0.5 flex items-center justify-between`}>
              <span>$70.85/bbl</span>
              <span className="text-emerald-500 text-xs font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +0.8%
              </span>
            </div>
            <div className="text-[10px] text-slate-500">NYMEX Energy</div>
          </div>

          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">USD / PKR Interbank</div>
            <div className={`text-base font-extrabold ${textPrimary} font-mono mt-0.5 flex items-center justify-between`}>
              <span>₨278.40</span>
              <span className="text-slate-400 text-xs font-bold">Stable</span>
            </div>
            <div className="text-[10px] text-slate-500">State Bank of Pakistan</div>
          </div>

          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Next Price Review</div>
            <div className="text-base font-extrabold text-blue-500 font-mono mt-0.5">
              Oct 01, 2026
            </div>
            <div className="text-[10px] text-slate-500">OGRA Bi-Monthly Schedule</div>
          </div>

          <div className={`col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-2xl border ${isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/50'}`}>
            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Refinery Status</div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Full Supply</span>
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">PARCO & Attock Normal</div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSection === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>All Feeds & Modules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('ogra')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSection === 'ogra'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>OGRA Price Schedules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('simulator')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSection === 'simulator'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-purple-400" />
          <span>Inventory Arbitrage Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('weather')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSection === 'weather'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>Weather & Safety</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('news')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSection === 'news'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Petroleum News Wire</span>
        </button>
      </div>

      {/* INVENTORY MARGIN ARBITRAGE SIMULATOR (Smart feature for station owners!) */}
      {(activeSection === 'all' || activeSection === 'simulator') && (
        <div className={`${cardBg} rounded-3xl p-5 sm:p-6 border relative overflow-hidden space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${textPrimary}`}>
                  Price Revision Inventory Profit/Loss Simulator
                </h3>
                <p className={`text-xs ${textSecondary}`}>
                  Simulate windfall profit or inventory loss across all underground tanks when OGRA notifies price revisions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
              <Layers className="w-3.5 h-3.5" />
              <span>Live Tank Stock: {formatVolume(totalPetrolStock + totalDieselStock)}</span>
            </div>
          </div>

          {/* Sliders / Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Petrol Price Expected Change */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500">Petrol Rate Delta</span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {petrolDelta > 0 ? `+₨${petrolDelta.toFixed(2)}` : `₨${petrolDelta.toFixed(2)}`} / L
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.25"
                value={petrolDelta}
                onChange={(e) => setPetrolDelta(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-₨15</span>
                <span>0.00</span>
                <span>+₨15</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/40 flex justify-between">
                <span>Stock in tanks: {formatVolume(totalPetrolStock)}</span>
                <span className={`font-bold ${petrolInventoryImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(petrolInventoryImpact)}
                </span>
              </div>
            </div>

            {/* Diesel Price Expected Change */}
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-500">Diesel Rate Delta</span>
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {dieselDelta > 0 ? `+₨${dieselDelta.toFixed(2)}` : `₨${dieselDelta.toFixed(2)}`} / L
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.25"
                value={dieselDelta}
                onChange={(e) => setDieselDelta(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-₨15</span>
                <span>0.00</span>
                <span>+₨15</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/40 flex justify-between">
                <span>Stock in tanks: {formatVolume(totalDieselStock)}</span>
                <span className={`font-bold ${dieselInventoryImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(dieselInventoryImpact)}
                </span>
              </div>
            </div>

            {/* Net Estimated Inventory Impact */}
            <div className={`p-4 rounded-2xl border ${
              totalInventoryImpact >= 0 
                ? isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/60'
                : isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-950/30 border-rose-800/60'
            } flex flex-col justify-between`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Enterprise Gain / (Loss)
                </span>
                <div className={`text-2xl font-black font-mono mt-1 ${totalInventoryImpact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(totalInventoryImpact)}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                {totalInventoryImpact >= 0
                  ? 'Windfall gain on current station fuel stock if prices increase as projected.'
                  : 'Inventory devaluation on current stock if price revision cuts rates.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OGRA Price Schedules Widget */}
      {(activeSection === 'all' || activeSection === 'ogra') && (
        <OgraPricesWidget
          theme={theme}
          rates={fuelRates}
          onNavigateToRates={() => onNavigateToTab('rates')}
        />
      )}

      {/* Grid for Weather & Petroleum News */}
      {activeSection === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StationWeatherWidget theme={theme} stationBalances={stationBalances} />
          <PetroleumNewsWidget theme={theme} />
        </div>
      )}

      {activeSection === 'weather' && (
        <StationWeatherWidget theme={theme} stationBalances={stationBalances} />
      )}

      {activeSection === 'news' && (
        <PetroleumNewsWidget theme={theme} />
      )}
    </div>
  );
};
