import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  ShieldCheck, 
  Building2, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { AppTheme, Partner, StationBalance } from '../types';

interface EditInvestmentsModalProps {
  theme?: AppTheme;
  stations: StationBalance[];
  partners: Partner[];
  onClose: () => void;
  onOverrideStation: (stationName: string, investment: number, cashOnHand: number) => void;
  onOverridePartner: (partnerId: string, investment: number) => void;
}

export const EditInvestmentsModal: React.FC<EditInvestmentsModalProps> = ({
  theme = 'iphone-dark',
  stations,
  partners,
  onClose,
  onOverrideStation,
  onOverridePartner,
}) => {
  const isLight = theme === 'iphone-light';
  const [activeSubTab, setActiveSubTab] = useState<'stations' | 'partners'>('stations');

  // Station local state
  const [stationEdits, setStationEdits] = useState<Record<string, { investment: number; cash: number }>>(() => {
    const init: Record<string, { investment: number; cash: number }> = {};
    stations.forEach(s => {
      init[s.station] = {
        investment: s.allocatedInvestment,
        cash: s.cashOnHand,
      };
    });
    return init;
  });

  // Partner local state
  const [partnerEdits, setPartnerEdits] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    partners.forEach(p => {
      init[p.id] = p.investment;
    });
    return init;
  });

  const [savedMessage, setSavedMessage] = useState('');

  const handleStationChange = (stationName: string, field: 'investment' | 'cash', val: number) => {
    setStationEdits(prev => ({
      ...prev,
      [stationName]: {
        ...prev[stationName],
        [field]: val,
      },
    }));
  };

  const handlePartnerChange = (partnerId: string, val: number) => {
    setPartnerEdits(prev => ({
      ...prev,
      [partnerId]: val,
    }));
  };

  const handleSaveStation = (stationName: string) => {
    const edit = stationEdits[stationName];
    if (!edit) return;
    onOverrideStation(stationName, Number(edit.investment) || 0, Number(edit.cash) || 0);
    setSavedMessage(`Updated ${stationName} capital and till float.`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleSavePartner = (partner: Partner) => {
    const newInv = partnerEdits[partner.id];
    if (newInv === undefined) return;
    onOverridePartner(partner.id, Number(newInv) || 0);
    setSavedMessage(`Updated ${partner.name}'s equity capital.`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const totalStationCapital: number = (Object.values(stationEdits) as Array<{ investment: number; cash: number }>).reduce(
    (sum: number, item) => sum + (Number(item?.investment) || 0),
    0
  );
  const totalPartnerCapital: number = (Object.values(partnerEdits) as number[]).reduce(
    (sum: number, val) => sum + (Number(val) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all my-8 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Executive Investment & Capital Override</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  CEO Override Authority
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Adjust allocated capital floats, station till funds, and partner equity stakes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 p-1 rounded-2xl border bg-slate-950/40 border-inherit">
          <button
            type="button"
            onClick={() => setActiveSubTab('stations')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'stations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Gas Station Allocations ({stations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('partners')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'partners'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Partner Equity Investments ({partners.length})</span>
          </button>
        </div>

        {/* STATIONS TAB */}
        {activeSubTab === 'stations' && (
          <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-400">Total Station Float Deployed:</span>
              <span className="font-mono font-black text-sm text-blue-300">
                ₨{totalStationCapital.toLocaleString()}
              </span>
            </div>

            {stations.map(station => {
              const currentEdit = stationEdits[station.station] || {
                investment: station.allocatedInvestment,
                cash: station.cashOnHand,
              };

              return (
                <div
                  key={station.station}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-850 border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{station.station}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            station.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {station.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        In-Charge: {station.managerInCharge} • {station.location || 'Highway'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveStation(station.station)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-end sm:self-auto"
                    >
                      Override & Save
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-400">
                        Allocated Capital Float (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentEdit.investment}
                        onChange={e =>
                          handleStationChange(station.station, 'investment', Number(e.target.value))
                        }
                        className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-400">
                        Drawer Float / Cash-in-Hand (PKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentEdit.cash}
                        onChange={e =>
                          handleStationChange(station.station, 'cash', Number(e.target.value))
                        }
                        className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PARTNERS TAB */}
        {activeSubTab === 'partners' && (
          <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-400">Total Partner Capital Committed:</span>
              <span className="font-mono font-black text-sm text-amber-300">
                ₨{totalPartnerCapital.toLocaleString()}
              </span>
            </div>

            {partners.map(partner => {
              const currentVal = partnerEdits[partner.id] ?? partner.investment;
              const equityPercentage =
                totalPartnerCapital > 0
                  ? ((Number(currentVal) / totalPartnerCapital) * 100).toFixed(1)
                  : '0.0';

              return (
                <div
                  key={partner.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-850 border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{partner.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {partner.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Equity Share: <b className="text-amber-400">{equityPercentage}%</b> • Onboarded: {partner.joinedDate}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePartner(partner)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-end sm:self-auto"
                    >
                      Override & Save
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-400">
                      Capital Investment Balance (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentVal}
                      onChange={e => handlePartnerChange(partner.id, Number(e.target.value))}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-inherit mt-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>All overrides create an unalterable executive audit log.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
