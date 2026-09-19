import React, { useState } from 'react';
import { X, Save, Calculator, AlertTriangle, Fuel, Gauge, Sparkles } from 'lucide-react';
import { AppTheme, StationBalance, StationEntry } from '../types';
import { formatCurrency } from '../utils/formatters';

interface EditEntryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  entry: StationEntry | null;
  onSave: (updated: StationEntry) => void;
  stations?: StationBalance[];
  theme?: AppTheme;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  isOpen = true,
  onClose,
  entry,
  onSave,
  stations = [],
  theme = 'iphone-dark',
}) => {
  if (isOpen === false || !entry) return null;

  const isLight = theme === 'iphone-light';

  const [station, setStation] = useState<string>(entry.station);
  const [date, setDate] = useState<string>(entry.date);

  // Petrol
  const [petrolSales, setPetrolSales] = useState<number>(entry.petrolSales || 0);
  const [petrolPurchase, setPetrolPurchase] = useState<number>(entry.petrolPurchase || 0);
  const [petrolSaleRate, setPetrolSaleRate] = useState<number>(entry.petrolSaleRate || 0);
  const [petrolPurchaseRate, setPetrolPurchaseRate] = useState<number>(entry.petrolPurchaseRate || 0);
  const [petrolOldPurchaseRate, setPetrolOldPurchaseRate] = useState<number>(
    entry.petrolOldPurchaseRate || entry.petrolPurchaseRate || 0
  );
  const [petrolMarginMode, setPetrolMarginMode] = useState<'standard' | 'average_stock'>(
    entry.petrolMarginMode || 'average_stock'
  );
  const [petrolNozzleSaleReading, setPetrolNozzleSaleReading] = useState<number>(
    entry.petrolNozzleSaleReading || 0
  );
  const [petrolNozzlePurchaseReading, setPetrolNozzlePurchaseReading] = useState<number>(
    entry.petrolNozzlePurchaseReading || entry.petrolPurchase || 0
  );

  // Diesel
  const [dieselSales, setDieselSales] = useState<number>(entry.dieselSales || 0);
  const [dieselPurchase, setDieselPurchase] = useState<number>(entry.dieselPurchase || 0);
  const [dieselSaleRate, setDieselSaleRate] = useState<number>(entry.dieselSaleRate || 0);
  const [dieselPurchaseRate, setDieselPurchaseRate] = useState<number>(entry.dieselPurchaseRate || 0);
  const [dieselOldPurchaseRate, setDieselOldPurchaseRate] = useState<number>(
    entry.dieselOldPurchaseRate || entry.dieselPurchaseRate || 0
  );
  const [dieselMarginMode, setDieselMarginMode] = useState<'standard' | 'average_stock'>(
    entry.dieselMarginMode || 'average_stock'
  );
  const [dieselNozzleSaleReading, setDieselNozzleSaleReading] = useState<number>(
    entry.dieselNozzleSaleReading || 0
  );
  const [dieselNozzlePurchaseReading, setDieselNozzlePurchaseReading] = useState<number>(
    entry.dieselNozzlePurchaseReading || entry.dieselPurchase || 0
  );

  // Hi-Octane 97
  const [hiOctaneSales, setHiOctaneSales] = useState<number>(entry.hiOctaneSales || 0);
  const [hiOctanePurchase, setHiOctanePurchase] = useState<number>(entry.hiOctanePurchase || 0);
  const [hiOctaneSaleRate, setHiOctaneSaleRate] = useState<number>(entry.hiOctaneSaleRate || 395);
  const [hiOctanePurchaseRate, setHiOctanePurchaseRate] = useState<number>(entry.hiOctanePurchaseRate || 382);
  const [hiOctaneOldPurchaseRate, setHiOctaneOldPurchaseRate] = useState<number>(
    entry.hiOctaneOldPurchaseRate || entry.hiOctanePurchaseRate || 382
  );
  const [hiOctaneMarginMode, setHiOctaneMarginMode] = useState<'standard' | 'average_stock'>(
    entry.hiOctaneMarginMode || 'average_stock'
  );
  const [hiOctaneNozzleSaleReading, setHiOctaneNozzleSaleReading] = useState<number>(
    entry.hiOctaneNozzleSaleReading || 0
  );
  const [hiOctaneNozzlePurchaseReading, setHiOctaneNozzlePurchaseReading] = useState<number>(
    entry.hiOctaneNozzlePurchaseReading || entry.hiOctanePurchase || 0
  );

  // Lubes
  const [lubesSales, setLubesSales] = useState<number>(entry.lubesSales || 0);
  const [lubesPurchase, setLubesPurchase] = useState<number>(entry.lubesPurchase || 0);
  const [lubesSaleRate, setLubesSaleRate] = useState<number>(entry.lubesSaleRate || 0);
  const [lubesPurchaseRate, setLubesPurchaseRate] = useState<number>(entry.lubesPurchaseRate || 0);

  // Expenses
  const [salaries, setSalaries] = useState<number>(entry.salaries || 0);
  const [wages, setWages] = useState<number>(entry.wages || 0);
  const [food, setFood] = useState<number>(entry.food || 0);
  const [travel, setTravel] = useState<number>(entry.travel || 0);
  const [maintenance, setMaintenance] = useState<number>(entry.maintenance || 0);
  const [otherExpenses, setOtherExpenses] = useState<number>(entry.otherExpenses || 0);
  const [notes, setNotes] = useState<string>(entry.notes || '');

  // Dynamic calculations
  const effectivePetrolCost =
    petrolMarginMode === 'average_stock'
      ? (petrolOldPurchaseRate + petrolPurchaseRate) / 2
      : petrolPurchaseRate;
  const petrolMarginPerLiter = petrolSaleRate - effectivePetrolCost;
  const petrolGross = petrolSales * petrolMarginPerLiter;

  const effectiveDieselCost =
    dieselMarginMode === 'average_stock'
      ? (dieselOldPurchaseRate + dieselPurchaseRate) / 2
      : dieselPurchaseRate;
  const dieselMarginPerLiter = dieselSaleRate - effectiveDieselCost;
  const dieselGross = dieselSales * dieselMarginPerLiter;

  const effectiveHiOctaneCost =
    hiOctaneMarginMode === 'average_stock'
      ? (hiOctaneOldPurchaseRate + hiOctanePurchaseRate) / 2
      : hiOctanePurchaseRate;
  const hiOctaneMarginPerLiter = hiOctaneSaleRate - effectiveHiOctaneCost;
  const hiOctaneGross = hiOctaneSales * hiOctaneMarginPerLiter;

  const lubesMarginPerUnit = lubesSaleRate - lubesPurchaseRate;
  const lubesGross = lubesSales * lubesMarginPerUnit;

  const totalGrossProfit = petrolGross + dieselGross + hiOctaneGross + lubesGross;
  const totalExpenses = salaries + wages + food + travel + maintenance + otherExpenses;
  const netProfit = totalGrossProfit - totalExpenses;
  const revenue =
    petrolSales * petrolSaleRate +
    dieselSales * dieselSaleRate +
    hiOctaneSales * hiOctaneSaleRate +
    lubesSales * lubesSaleRate;

  const nozzleSaleVariance = Math.abs(
    (petrolNozzleSaleReading > 0 ? petrolNozzleSaleReading - petrolSales : 0) +
    (dieselNozzleSaleReading > 0 ? dieselNozzleSaleReading - dieselSales : 0) +
    (hiOctaneNozzleSaleReading > 0 ? hiOctaneNozzleSaleReading - hiOctaneSales : 0)
  );
  const isAuditFlag = nozzleSaleVariance > 10;

  const stationOptions = Array.from(
    new Set([
      'SWAT 1',
      'SWAT 2',
      'SWAT 3',
      'PCR 1',
      'PCR 2',
      ...stations.map(s => s.station),
    ])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: StationEntry = {
      ...entry,
      station: station as any,
      date,
      petrolSales,
      petrolPurchase,
      petrolSaleRate,
      petrolPurchaseRate,
      petrolOldPurchaseRate,
      petrolMarginMode,
      petrolNozzleSaleReading,
      petrolNozzlePurchaseReading,
      dieselSales,
      dieselPurchase,
      dieselSaleRate,
      dieselPurchaseRate,
      dieselOldPurchaseRate,
      dieselMarginMode,
      dieselNozzleSaleReading,
      dieselNozzlePurchaseReading,
      hiOctaneSales,
      hiOctanePurchase,
      hiOctaneSaleRate,
      hiOctanePurchaseRate,
      hiOctaneOldPurchaseRate,
      hiOctaneMarginMode,
      hiOctaneNozzleSaleReading,
      hiOctaneNozzlePurchaseReading,
      lubesSales,
      lubesPurchase,
      lubesSaleRate,
      lubesPurchaseRate,
      salaries,
      wages,
      food,
      travel,
      maintenance,
      otherExpenses,
      grossProfit: totalGrossProfit,
      totalExpenses,
      netProfit,
      revenue,
      nozzleVariance: nozzleSaleVariance,
      purchaseNozzleVariance: 0,
      auditFlag: isAuditFlag,
      notes,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl rounded-3xl p-5 sm:p-7 border shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-inherit pb-4 border-b border-inherit flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Edit Station Closing Entry (CEO Authority)
              </h2>
              <p className="text-xs text-slate-400">
                Correct volumes, nozzle readings & average stock margin formula
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Station & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Gas Station
              </label>
              <select
                value={station}
                onChange={e => setStation(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-850 border-slate-700 text-white'
                }`}
              >
                {stationOptions.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Entry Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-850 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* PETROL OPERATIONS */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-inherit pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-400">
                <Fuel className="w-4 h-4" />
                <span>Super Petrol Operations</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Margin Mode:</span>
                <select
                  value={petrolMarginMode}
                  onChange={e => setPetrolMarginMode(e.target.value as any)}
                  className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 font-bold border border-slate-700"
                >
                  <option value="average_stock">Avg (Old + New Stock)</option>
                  <option value="standard">Standard Purchase Rate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sales (L)</label>
                <input
                  type="number"
                  value={petrolSales}
                  onChange={e => setPetrolSales(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sale Rate (₨)</label>
                <input
                  type="number"
                  value={petrolSaleRate}
                  onChange={e => setPetrolSaleRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">New Purch Rate (₨)</label>
                <input
                  type="number"
                  value={petrolPurchaseRate}
                  onChange={e => setPetrolPurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Old Stock Rate (₨)</label>
                <input
                  type="number"
                  value={petrolOldPurchaseRate}
                  onChange={e => setPetrolOldPurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-inherit flex items-center justify-between text-xs text-slate-400">
              <span>
                Effective Cost: <b className="text-white">₨{effectivePetrolCost.toFixed(2)}/L</b> • Margin: <b className="text-emerald-400">₨{petrolMarginPerLiter.toFixed(2)}/L</b>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                Gross: ₨{petrolGross.toLocaleString()}
              </span>
            </div>
          </div>

          {/* DIESEL OPERATIONS */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-inherit pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <Fuel className="w-4 h-4" />
                <span>High Speed Diesel (HSD) Operations</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Margin Mode:</span>
                <select
                  value={dieselMarginMode}
                  onChange={e => setDieselMarginMode(e.target.value as any)}
                  className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 font-bold border border-slate-700"
                >
                  <option value="average_stock">Avg (Old + New Stock)</option>
                  <option value="standard">Standard Purchase Rate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sales (L)</label>
                <input
                  type="number"
                  value={dieselSales}
                  onChange={e => setDieselSales(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sale Rate (₨)</label>
                <input
                  type="number"
                  value={dieselSaleRate}
                  onChange={e => setDieselSaleRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">New Purch Rate (₨)</label>
                <input
                  type="number"
                  value={dieselPurchaseRate}
                  onChange={e => setDieselPurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Old Stock Rate (₨)</label>
                <input
                  type="number"
                  value={dieselOldPurchaseRate}
                  onChange={e => setDieselOldPurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-inherit flex items-center justify-between text-xs text-slate-400">
              <span>
                Effective Cost: <b className="text-white">₨{effectiveDieselCost.toFixed(2)}/L</b> • Margin: <b className="text-emerald-400">₨{dieselMarginPerLiter.toFixed(2)}/L</b>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                Gross: ₨{dieselGross.toLocaleString()}
              </span>
            </div>
          </div>

          {/* HI-OCTANE 97 */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-inherit pb-2">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span>Hi-Octane 97 Operations</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Margin Mode:</span>
                <select
                  value={hiOctaneMarginMode}
                  onChange={e => setHiOctaneMarginMode(e.target.value as any)}
                  className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 font-bold border border-slate-700"
                >
                  <option value="average_stock">Avg (Old + New)</option>
                  <option value="standard">Standard Rate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sales (L)</label>
                <input
                  type="number"
                  value={hiOctaneSales}
                  onChange={e => setHiOctaneSales(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Sale Rate (₨)</label>
                <input
                  type="number"
                  value={hiOctaneSaleRate}
                  onChange={e => setHiOctaneSaleRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">New Purch Rate (₨)</label>
                <input
                  type="number"
                  value={hiOctanePurchaseRate}
                  onChange={e => setHiOctanePurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Old Stock Rate (₨)</label>
                <input
                  type="number"
                  value={hiOctaneOldPurchaseRate}
                  onChange={e => setHiOctaneOldPurchaseRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* EXPENSES */}
          <div
            className={`p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="font-bold text-xs text-rose-400 uppercase tracking-wider mb-3">
              Operating Expenses
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Salaries</label>
                <input
                  type="number"
                  value={salaries}
                  onChange={e => setSalaries(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Wages</label>
                <input
                  type="number"
                  value={wages}
                  onChange={e => setWages(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Food/Mess</label>
                <input
                  type="number"
                  value={food}
                  onChange={e => setFood(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Travel</label>
                <input
                  type="number"
                  value={travel}
                  onChange={e => setTravel(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Maintenance</label>
                <input
                  type="number"
                  value={maintenance}
                  onChange={e => setMaintenance(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Other</label>
                <input
                  type="number"
                  value={otherExpenses}
                  onChange={e => setOtherExpenses(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* NET SUMMARY & SUBMIT */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              netProfit >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Recalculated Net Profit
              </div>
              <div className="text-xl font-black">{formatCurrency(netProfit)}</div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-inherit text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Overrides</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
