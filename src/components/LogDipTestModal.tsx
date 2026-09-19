import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Droplet, 
  Layers, 
  Gauge, 
  UserCheck, 
  Fuel,
  Info,
  Clock
} from 'lucide-react';
import { AppTheme, DipShift, DipTestRecord, StationBalance, StationName, UserSession } from '../types';
import { formatCurrency } from '../utils/formatters';

interface LogDipTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDipTest: (record: Omit<DipTestRecord, 'id' | 'createdAt'>) => void;
  stationBalances: StationBalance[];
  session: UserSession;
  theme?: AppTheme;
  initialStation?: StationName;
}

export const LogDipTestModal: React.FC<LogDipTestModalProps> = ({
  isOpen,
  onClose,
  onSaveDipTest,
  stationBalances,
  session,
  theme = 'iphone-dark',
  initialStation,
}) => {
  const isLight = theme === 'iphone-light';

  const [selectedStation, setSelectedStation] = useState<StationName>(
    initialStation || (stationBalances[0]?.station as StationName) || 'SWAT 1'
  );
  const [shift, setShift] = useState<DipShift>('Morning (06:00)');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState<'Petrol' | 'Diesel' | 'Hi-Octane'>('Petrol');
  const [tankNumber, setTankNumber] = useState<number>(1);
  const [dipReadingMm, setDipReadingMm] = useState<number>(1420);
  const [calculatedLiters, setCalculatedLiters] = useState<number>(14250);
  const [ledgerLiters, setLedgerLiters] = useState<number>(14300);
  const [waterDipMm, setWaterDipMm] = useState<number>(0);
  const [conductedBy, setConductedBy] = useState<string>(session.name || 'Dip Attendant');
  const [notes, setNotes] = useState<string>('');

  const currentStationObj = stationBalances.find(s => s.station === selectedStation);
  const personResponsible = currentStationObj?.managerInCharge || 'Station Manager';

  // Sync default ledger volume when station or fuelType changes
  useEffect(() => {
    if (!currentStationObj) return;
    if (fuelType === 'Petrol') {
      const stock = currentStationObj.petrolStock || 14000;
      setLedgerLiters(stock);
      // Rough calibration for standard 25,000L tank (2000mm diameter)
      const approxMm = Math.round((stock / 25000) * 1950);
      setDipReadingMm(approxMm);
      setCalculatedLiters(stock);
    } else if (fuelType === 'Diesel') {
      const stock = currentStationObj.dieselStock || 12000;
      setLedgerLiters(stock);
      const approxMm = Math.round((stock / 25000) * 1950);
      setDipReadingMm(approxMm);
      setCalculatedLiters(stock);
    } else {
      const stock = currentStationObj.hiOctaneStock || 4500;
      setLedgerLiters(stock);
      const approxMm = Math.round((stock / 10000) * 1800);
      setDipReadingMm(approxMm);
      setCalculatedLiters(stock);
    }
  }, [selectedStation, fuelType]);

  // Update calculated liters when dip rod mm is adjusted (Tank strapping calibration curve)
  const handleDipMmChange = (mm: number) => {
    setDipReadingMm(mm);
    // Standard cylindrical horizontal tank calibration conversion formula:
    // Capacity 25,000L at 2000mm height
    const maxCapacity = fuelType === 'Hi-Octane' ? (currentStationObj?.hiOctaneCapacity || 10000) : 25000;
    const maxHeightMm = fuelType === 'Hi-Octane' ? 1850 : 2050;
    const ratio = Math.min(1, Math.max(0, mm / maxHeightMm));
    
    // Cylindrical volume correction factor:
    // S-curve approximation for horizontal cylinder dip chart
    const rad = (ratio - 0.5) * Math.PI;
    const correctedRatio = 0.5 + Math.sin(rad) * 0.5;
    const estimatedLiters = Math.round(correctedRatio * maxCapacity);
    setCalculatedLiters(estimatedLiters);
  };

  const varianceLiters = calculatedLiters - ledgerLiters;
  const variancePercent = ledgerLiters > 0 ? (varianceLiters / ledgerLiters) * 100 : 0;
  const isToleranceBreached = Math.abs(varianceLiters) > 150 || Math.abs(variancePercent) > 0.5;
  const hasWater = waterDipMm > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let status: DipTestRecord['status'] = 'normal';
    if (hasWater) {
      status = 'water_detected';
    } else if (Math.abs(varianceLiters) > 250 || Math.abs(variancePercent) > 1.0) {
      status = 'critical_variance';
    } else if (isToleranceBreached) {
      status = 'minor_variance';
    }

    onSaveDipTest({
      station: selectedStation,
      date,
      shift,
      fuelType,
      tankNumber,
      dipReadingMm,
      calculatedLiters,
      ledgerLiters,
      varianceLiters,
      variancePercent,
      waterDipMm,
      conductedBy,
      personResponsible,
      status,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-950/60'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Log Physical Tank Dip Test &amp; Calibration
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Brass rod measurement vs digital ATG volume with automated discrepancy audit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Station & Shift Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Station
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value as StationName)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {stationBalances.map(s => (
                  <option key={s.station} value={s.station}>
                    {s.station} ({s.managerInCharge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Dip Schedule Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as DipShift)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Morning (06:00)">Morning Opening Shift (06:00 AM)</option>
                <option value="Evening (18:00)">Evening Closing Shift (06:00 PM)</option>
                <option value="Post-Decanting">Post-Decanting Verification</option>
                <option value="Special Audit">Special Forensic Audit</option>
              </select>
            </div>
          </div>

          {/* Date, Fuel Type, Tank Number */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Fuel Grade
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Petrol">Super Petrol (92 RON)</option>
                <option value="Diesel">High-Speed Diesel (HSD)</option>
                <option value="Hi-Octane">Hi-Octane (97 RON)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Tank Chamber
              </label>
              <select
                value={tankNumber}
                onChange={(e) => setTankNumber(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value={1}>Tank Chamber #1 (Primary)</option>
                <option value={2}>Tank Chamber #2 (Reserve)</option>
                <option value={3}>Tank Chamber #3</option>
              </select>
            </div>
          </div>

          {/* Physical Measurements & Calibration Strapping Card */}
          <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/70 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                Physical Dip Rod &amp; Calibration Converter
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tolerance: ±0.5% (Max 150L)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Brass Dip Rod Height (mm)
                </label>
                <input
                  type="number"
                  min={0}
                  max={2500}
                  value={dipReadingMm}
                  onChange={(e) => handleDipMmChange(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold font-mono outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <span className="text-[9px] text-slate-400">e.g. 1420 mm = {(dipReadingMm / 10).toFixed(1)} cm</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Calculated Volume (Liters)
                </label>
                <input
                  type="number"
                  value={calculatedLiters}
                  onChange={(e) => setCalculatedLiters(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold font-mono outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <span className="text-[9px] text-slate-400">Via tank strapping chart</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Digital Ledger / ATG Stock (L)
                </label>
                <input
                  type="number"
                  value={ledgerLiters}
                  onChange={(e) => setLedgerLiters(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-bold font-mono outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <span className="text-[9px] text-slate-400">Book balance in system</span>
              </div>
            </div>

            {/* Water paste reading */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-cyan-500" />
                  Water Paste Test (Kolor Kut Bottom Ingress)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={waterDipMm}
                    onChange={(e) => setWaterDipMm(Number(e.target.value))}
                    className={`w-28 px-3 py-1.5 rounded-xl border text-sm font-bold font-mono outline-none ${
                      waterDipMm > 0 
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300' 
                        : isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-500">mm water trace</span>
                </div>
              </div>

              <div>
                {hasWater ? (
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>WATER INGRESS DETECTED: Automated emergency audit will be initiated!</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Clean tank bottom: 0mm water ingress.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Variance Calculation Display */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isToleranceBreached 
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-300' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              <div className="flex items-center gap-2">
                {isToleranceBreached ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-extrabold">
                    {isToleranceBreached ? 'TOLERANCE BREACH DETECTED' : 'VARIANCE WITHIN COMPLIANCE'}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {isToleranceBreached 
                      ? 'Discrepancy exceeds ±0.5% threshold. An automated forensic audit will be ordered upon save.'
                      : 'Physical dip matches digital book balance within standard allowable evaporation limits.'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-black font-mono">
                  {varianceLiters > 0 ? `+${varianceLiters.toFixed(0)}` : varianceLiters.toFixed(0)} L
                </div>
                <div className="text-[10px] font-bold">
                  {variancePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Attendant & Person Responsible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Conducted By (Dip Attendant)
              </label>
              <input
                type="text"
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value)}
                placeholder="Name of attendant holding dip rod"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-sans outline-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Person Responsible (Assigned Manager)</span>
                <span className="text-[9px] text-amber-500 font-bold uppercase">Accountable Officer</span>
              </label>
              <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}>
                <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{personResponsible}</span>
                <span className="text-[10px] text-slate-400 font-normal">({selectedStation} Manager)</span>
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Field Notes / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tank decanted 2 hours prior, temperature 28°C, dip rod verified clean"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-sans outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-600/30 flex items-center gap-2"
            >
              <Ruler className="w-4 h-4" />
              <span>Record Dip Test &amp; Verify</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
