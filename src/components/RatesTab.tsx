import React, { useState } from 'react';
import { Tag, Save, Lock, Calculator, TrendingUp, History, ShieldAlert } from 'lucide-react';
import { FuelRates, RateHistoryItem, UserSession } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface RatesTabProps {
  session: UserSession;
  rates: FuelRates;
  rateHistory: RateHistoryItem[];
  onSaveRates: (updated: FuelRates) => void;
}

export const RatesTab: React.FC<RatesTabProps> = ({
  session,
  rates,
  rateHistory,
  onSaveRates,
}) => {
  const canEdit = session.canEditRates;

  const [psr, setPsr] = useState<number>(rates.psr);
  const [ppr, setPpr] = useState<number>(rates.ppr);
  const [dsr, setDsr] = useState<number>(rates.dsr);
  const [dpr, setDpr] = useState<number>(rates.dpr);
  const [lsr, setLsr] = useState<number>(rates.lsr);
  const [lpr, setLpr] = useState<number>(rates.lpr);

  // Average stock simulator state
  const [simOldPetrol, setSimOldPetrol] = useState<number>(rates.ppr);
  const [simNewPetrol, setSimNewPetrol] = useState<number>(rates.ppr + 3);

  const petMargin = psr - ppr;
  const dieMargin = dsr - dpr;
  const lubMargin = lsr - lpr;

  const simAvgPetrolCost = (simOldPetrol + simNewPetrol) / 2;
  const simAvgMargin = psr - simAvgPetrolCost;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    onSaveRates({
      psr,
      ppr,
      dsr,
      dpr,
      lsr,
      lpr,
      lastUpdated: new Date().toISOString(),
      updatedBy: session.name,
    });
    alert('Benchmark fuel rates successfully updated and broadcasted!');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Fuel Benchmark Rates & Margins
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Official sale tariffs, refinery purchase rates & stock cost averaging
          </p>
        </div>
      </div>

      {/* Lock Notice for Partners & Managers */}
      {!canEdit && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Rate editing requires CEO / Admin Jalees authority (PIN 1122). Partners and station managers have eyes-only tariff viewing access.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Petrol Rates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                P
              </div>
              <h3 className="text-sm font-bold text-white">Petrol Official Tariff</h3>
            </div>
            <div className="text-xs font-bold text-emerald-400">
              Live Margin: ₨{petMargin.toFixed(2)} / L
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Sale Rate (₨/L)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={psr || ''}
                onChange={e => setPsr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Refinery Purchase Rate (₨/L)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={ppr || ''}
                onChange={e => setPpr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Diesel Rates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                D
              </div>
              <h3 className="text-sm font-bold text-white">Diesel Official Tariff</h3>
            </div>
            <div className="text-xs font-bold text-amber-400">
              Live Margin: ₨{dieMargin.toFixed(2)} / L
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Sale Rate (₨/L)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={dsr || ''}
                onChange={e => setDsr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Refinery Purchase Rate (₨/L)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={dpr || ''}
                onChange={e => setDpr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Lubes Rates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center">
                L
              </div>
              <h3 className="text-sm font-bold text-white">Lubricants & Engine Oils</h3>
            </div>
            <div className="text-xs font-bold text-purple-400">
              Live Margin: ₨{lubMargin.toFixed(2)} / Unit
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Sale Rate (₨)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={lsr || ''}
                onChange={e => setLsr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Wholesale Purchase Rate (₨)</label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={lpr || ''}
                onChange={e => setLpr(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Save Button for CEO Jalees */}
        {canEdit && (
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>Save Benchmark Rates & Broadcast</span>
          </button>
        )}
      </form>

      {/* MANDATED FEATURE EXPLANATION & SIMULATOR: "margin will be avg of purchase rate of old stock plus purchase rate of new stock" */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Stock Cost Averaging Formula Simulator
            </h3>
            <p className="text-[11px] text-slate-400">
              Formula: Margin = Sale Rate - ((Old Stock Purchase Rate + New Stock Purchase Rate) / 2)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Old Stock Rate (₨/L)</label>
            <input
              type="number"
              step="0.01"
              value={simOldPetrol || ''}
              onChange={e => setSimOldPetrol(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">New Tanker Purchase Rate (₨/L)</label>
            <input
              type="number"
              step="0.01"
              value={simNewPetrol || ''}
              onChange={e => setSimNewPetrol(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Resulting Average Cost & Margin</label>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono">
              <div className="text-[11px] text-slate-300">Avg Cost: ₨{simAvgPetrolCost.toFixed(2)}/L</div>
              <div className="text-xs font-bold text-emerald-400">Simulated Margin: ₨{simAvgMargin.toFixed(2)}/L</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rates History Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Historical Rate Revisions</span>
        </h3>

        {rateHistory.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 italic">
            Current tariff is the initial baseline revision.
          </div>
        ) : (
          <div className="space-y-2">
            {rateHistory.map(item => (
              <div
                key={item.id}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{formatDateTime(item.effectiveDate)}</div>
                  <div className="text-[11px] text-slate-400">
                    Updated by {item.updatedBy || 'CEO Jalees'}
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono">
                  <span className="text-emerald-400">P Margin: ₨{(item.psr - item.ppr).toFixed(2)}</span> •{' '}
                  <span className="text-amber-400">D Margin: ₨{(item.dsr - item.dpr).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
