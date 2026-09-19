import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Scale, 
  Clock, 
  TrendingUp, 
  Calculator, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  Receipt,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { AppTheme, FuelRates } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface OgraPricesWidgetProps {
  theme?: AppTheme;
  rates?: FuelRates;
  onNavigateToRates?: () => void;
}

interface OgraProductPrice {
  id: string;
  name: string;
  code: string;
  notifiedPrice: number;
  exRefinery: number;
  ifem: number;
  omcMargin: number;
  dealerMargin: number;
  pdl: number;
  gst: number;
  prevPrice: number;
  effectiveFrom: string;
  badge: string;
  color: string;
}

const OFFICIAL_OGRA_BENCHMARKS: OgraProductPrice[] = [
  {
    id: 'petrol',
    name: 'Motor Gasoline (Super 92 RON)',
    code: 'PMG-92',
    notifiedPrice: 269.43,
    exRefinery: 182.15,
    ifem: 12.64,
    omcMargin: 6.00,
    dealerMargin: 8.64,
    pdl: 60.00,
    gst: 0.00,
    prevPrice: 267.89,
    effectiveFrom: '1st of current cycle',
    badge: 'Standard Fuel',
    color: 'emerald',
  },
  {
    id: 'diesel',
    name: 'High Speed Diesel (Euro-V)',
    code: 'HSD-10ppm',
    notifiedPrice: 272.77,
    exRefinery: 184.90,
    ifem: 7.36,
    omcMargin: 6.00,
    dealerMargin: 8.64,
    pdl: 60.00,
    gst: 0.00,
    prevPrice: 274.50,
    effectiveFrom: '1st of current cycle',
    badge: 'Commercial Fleet',
    color: 'blue',
  },
  {
    id: 'hioctane',
    name: 'High Octane 97 RON (HOBC)',
    code: 'HOBC-97',
    notifiedPrice: 298.50,
    exRefinery: 204.00,
    ifem: 9.80,
    omcMargin: 12.00,
    dealerMargin: 12.70,
    pdl: 60.00,
    gst: 0.00,
    prevPrice: 295.00,
    effectiveFrom: 'De-regulated pricing',
    badge: 'Premium Performance',
    color: 'purple',
  },
  {
    id: 'ldo',
    name: 'Light Diesel Oil',
    code: 'LDO',
    notifiedPrice: 168.20,
    exRefinery: 104.30,
    ifem: 5.90,
    omcMargin: 4.00,
    dealerMargin: 4.00,
    pdl: 50.00,
    gst: 0.00,
    prevPrice: 168.20,
    effectiveFrom: 'Industrial cycle',
    badge: 'Industrial / Agri',
    color: 'amber',
  },
];

export const OgraPricesWidget: React.FC<OgraPricesWidgetProps> = ({
  theme = 'iphone-dark',
  rates,
  onNavigateToRates,
}) => {
  const isLight = theme === 'iphone-light';
  const [selectedProduct, setSelectedProduct] = useState<string>('petrol');
  const [bowserLiters, setBowserLiters] = useState<number>(10000);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate countdown to next OGRA revision (1st or 16th of month at midnight)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentDay = now.getDate();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0);

      if (currentDay >= 16) {
        targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs > 0) {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeProduct = OFFICIAL_OGRA_BENCHMARKS.find(p => p.id === selectedProduct) || OFFICIAL_OGRA_BENCHMARKS[0];

  // Station specific rates comparison
  const stationSellingPrice = selectedProduct === 'petrol' 
    ? (rates?.psr || activeProduct.notifiedPrice)
    : selectedProduct === 'diesel'
    ? (rates?.dsr || activeProduct.notifiedPrice)
    : selectedProduct === 'hioctane'
    ? (rates?.hosr || activeProduct.notifiedPrice)
    : activeProduct.notifiedPrice;

  const stationPurchasePrice = selectedProduct === 'petrol'
    ? (rates?.ppr || (activeProduct.notifiedPrice - activeProduct.dealerMargin))
    : selectedProduct === 'diesel'
    ? (rates?.dpr || (activeProduct.notifiedPrice - activeProduct.dealerMargin))
    : selectedProduct === 'hioctane'
    ? (rates?.hopr || (activeProduct.notifiedPrice - activeProduct.dealerMargin))
    : (activeProduct.notifiedPrice - activeProduct.dealerMargin);

  const stationSpreadPerLiter = Math.max(0, stationSellingPrice - stationPurchasePrice);
  const totalBowserMargin = stationSpreadPerLiter * bowserLiters;

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/40'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/20 via-teal-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight">
                Official OGRA Price Schedule & Dealer Margins
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GOVT NOTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Regulatory ex-refinery breakdown, IFEM, PDL, and dealer commission structure
            </p>
          </div>
        </div>

        {/* Next OGRA Revision Countdown Capsule */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800 font-mono text-xs self-end sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400">Next Revision:</span>
          <span className="text-emerald-300 font-bold">
            {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </span>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-inherit bg-slate-950/30">
        {OFFICIAL_OGRA_BENCHMARKS.map(prod => {
          const isSelected = prod.id === selectedProduct;
          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => setSelectedProduct(prod.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>{prod.code}</span>
              <span className="font-mono text-[11px] opacity-90">₨{prod.notifiedPrice.toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Price Card & Official Breakdown */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Highlight Product Price Card */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950/80 border border-emerald-500/25 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">{activeProduct.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeProduct.badge}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white">
                ₨ {activeProduct.notifiedPrice.toFixed(2)}
                <span className="text-sm font-sans text-slate-400 font-normal"> / Liter</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Prev: ₨{activeProduct.prevPrice.toFixed(2)}</span>
                <span className={activeProduct.notifiedPrice >= activeProduct.prevPrice ? 'text-rose-400' : 'text-emerald-400'}>
                  ({activeProduct.notifiedPrice >= activeProduct.prevPrice ? '+' : ''}
                  {(activeProduct.notifiedPrice - activeProduct.prevPrice).toFixed(2)} ₨/L)
                </span>
              </div>
            </div>

            {/* Dealer Margin Callout */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/20 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Official Station Dealer Commission:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  ₨ {activeProduct.dealerMargin.toFixed(2)} / L
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Guaranteed by OGRA Gazette • Collected on every dispensed liter
              </div>
            </div>

            {onNavigateToRates && (
              <button
                type="button"
                onClick={onNavigateToRates}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                <span>Adjust Kashfi Bro Holdings Company Rates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Transparent Price Component Breakdown */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Official OGRA Gazette Price Structure Breakdown</span>
              <span className="text-slate-500 font-mono">1 Liter Basis</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Ex-Refinery */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-slate-300 font-semibold">Ex-Refinery Base Price</span>
                </div>
                <span className="font-mono font-bold text-white">₨ {activeProduct.exRefinery.toFixed(2)}</span>
              </div>

              {/* 2. IFEM */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-slate-300 font-semibold">Inland Freight Equalization (IFEM)</span>
                </div>
                <span className="font-mono font-bold text-white">₨ {activeProduct.ifem.toFixed(2)}</span>
              </div>

              {/* 3. OMC Margin */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-slate-300 font-semibold">Oil Marketing Company (OMC) Margin</span>
                </div>
                <span className="font-mono font-bold text-white">₨ {activeProduct.omcMargin.toFixed(2)}</span>
              </div>

              {/* 4. Dealer Commission */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300 font-bold">Station Dealer Commission (KBH Margin)</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400">₨ {activeProduct.dealerMargin.toFixed(2)}</span>
              </div>

              {/* 5. Petroleum Development Levy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300 font-semibold">Petroleum Development Levy (PDL)</span>
                </div>
                <span className="font-mono font-bold text-white">₨ {activeProduct.pdl.toFixed(2)}</span>
              </div>

              {/* 6. GST */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-slate-400 font-semibold">General Sales Tax (GST)</span>
                </div>
                <span className="font-mono font-bold text-slate-400">₨ {activeProduct.gst.toFixed(2)} (Exempt)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Bowser / Decanting Spread Calculator */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Decanting Tanker Bowser Margin Simulator</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Bowser Size:</span>
              <div className="flex items-center gap-1">
                {[5000, 10000, 20000, 40000].map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setBowserLiters(vol)}
                    className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      bowserLiters === vol
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {(vol / 1000).toFixed(0)}k L
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Company Selling Tariff</span>
              <div className="text-base font-black font-mono text-white">
                ₨ {stationSellingPrice.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ L</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Net Dealer Spread</span>
              <div className="text-base font-black font-mono text-emerald-400">
                ₨ {stationSpreadPerLiter.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ L</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 font-bold block mb-1">
                Gross Bowser Profit ({bowserLiters.toLocaleString()} L)
              </span>
              <div className="text-base font-black font-mono text-emerald-300">
                {formatCurrency(totalBowserMargin)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
