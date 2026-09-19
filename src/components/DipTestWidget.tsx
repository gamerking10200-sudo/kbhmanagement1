import React, { useState } from 'react';
import { 
  Ruler, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Droplet, 
  Plus, 
  History, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  UserCheck, 
  Gauge, 
  Fuel,
  Calendar
} from 'lucide-react';
import { 
  AppTheme, 
  DipTestRecord, 
  DipTestScheduleItem, 
  StationBalance, 
  StationName, 
  UserSession 
} from '../types';
import { formatDate } from '../utils/formatters';

interface DipTestWidgetProps {
  dipTests: DipTestRecord[];
  dipSchedules: DipTestScheduleItem[];
  stationBalances: StationBalance[];
  session: UserSession;
  theme?: AppTheme;
  onOpenLogModal: (station?: StationName) => void;
}

export const DipTestWidget: React.FC<DipTestWidgetProps> = ({
  dipTests,
  dipSchedules,
  stationBalances,
  session,
  theme = 'iphone-dark',
  onOpenLogModal,
}) => {
  const isLight = theme === 'iphone-light';
  const [showHistory, setShowHistory] = useState(false);

  const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400';
  const innerBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80';

  const today = new Date().toISOString().split('T')[0];

  // Count overdue or critical
  const overdueCount = dipSchedules.filter(s => s.isOverdue || s.lastDipDate !== today).length;
  const criticalDips = dipTests.filter(d => d.status === 'critical_variance' || d.status === 'water_detected');

  return (
    <div className={`${cardBg} rounded-3xl p-5 sm:p-6 border space-y-4`}>
      {/* Widget Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${textPrimary}`}>
                Physical Tank Dip Test &amp; Calibration Schedule
              </h3>
              {overdueCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueCount} STATIONS DUE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  ALL VERIFIED TODAY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Shift-wise brass dip measurements, tolerance checks (±0.5%) &amp; instant discrepancy audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Hide Dip Logs' : `View Dip Logs (${dipTests.length})`}</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {session.canEdit && (
            <button
              type="button"
              onClick={() => onOpenLogModal()}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-amber-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Physical Dip</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Alert Banner if water or critical variance detected */}
      {criticalDips.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-rose-500 font-extrabold">
            <ShieldAlert className="w-4 h-4" />
            <span>ACTIVE DIP DISCREPANCY DIRECTIVE IN EFFECT</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Forensic discrepancy surfaced for <b>{criticalDips[0].station}</b>: Physical brass rod indicates <b>{criticalDips[0].calculatedLiters.toLocaleString()} L</b> vs ATG ledger <b>{criticalDips[0].ledgerLiters.toLocaleString()} L</b> (Variance: {criticalDips[0].varianceLiters} L). Assigned Person Responsible: <b>{criticalDips[0].personResponsible}</b>. Immediate reconciliation mandatory.
          </p>
        </div>
      )}

      {/* Station Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {stationBalances.map(st => {
          const scheduleItem = dipSchedules.find(s => s.station === st.station);
          const isDoneToday = scheduleItem?.lastDipDate === today;
          const lastVariance = scheduleItem?.lastDipVarianceLiters ?? 0;

          return (
            <div
              key={st.station}
              className={`rounded-2xl p-4 border transition-all space-y-3 ${innerBg}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-black text-sm ${textPrimary}`}>{st.station}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-400" />
                    <span>Mgr: <b className={textPrimary}>{st.managerInCharge}</b></span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  isDoneToday
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                }`}>
                  {isDoneToday ? 'VERIFIED TODAY' : 'DUE / PENDING'}
                </span>
              </div>

              {/* Schedule Shift Details */}
              <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Mandatory Schedule:</span>
                  </span>
                  <span className={`font-bold ${textPrimary}`}>06:00 AM &amp; 06:00 PM</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Last Verified Dip:</span>
                  <span className="font-mono text-slate-300">
                    {scheduleItem?.lastDipDate ? formatDate(scheduleItem.lastDipDate) : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Recorded Discrepancy:</span>
                  <span className={`font-mono font-bold ${
                    Math.abs(lastVariance) > 150 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {lastVariance > 0 ? `+${lastVariance} L` : `${lastVariance} L`}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Underground Tanks: {st.tanksCount || 2}
                </span>
                {session.canEdit && (
                  <button
                    type="button"
                    onClick={() => onOpenLogModal(st.station as StationName)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Test Dip</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable History Log Table */}
      {showHistory && (
        <div className={`rounded-2xl border overflow-hidden transition-all pt-2 ${innerBg}`}>
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Physical Dip Inspection Log Archive</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{dipTests.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-950/80 text-slate-400'}`}>
                <tr>
                  <th className="p-3 font-bold">Date / Shift</th>
                  <th className="p-3 font-bold">Station / Tank</th>
                  <th className="p-3 font-bold">Dip Rod (mm)</th>
                  <th className="p-3 font-bold">Physical Volume</th>
                  <th className="p-3 font-bold">ATG Ledger</th>
                  <th className="p-3 font-bold">Variance (L / %)</th>
                  <th className="p-3 font-bold">Water Paste</th>
                  <th className="p-3 font-bold">Person Responsible</th>
                  <th className="p-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {dipTests.map(d => {
                  const isSevere = Math.abs(d.varianceLiters) > 150 || d.waterDipMm > 0;
                  return (
                    <tr key={d.id} className={`hover:${isLight ? 'bg-slate-50' : 'bg-slate-800/30'}`}>
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{formatDate(d.date)}</div>
                        <div className="text-[10px] text-slate-400">{d.shift}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{d.station}</div>
                        <div className="text-[10px] text-slate-400">Tank #{d.tankNumber} ({d.fuelType})</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-300">
                        {d.dipReadingMm} mm
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {d.calculatedLiters.toLocaleString()} L
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {d.ledgerLiters.toLocaleString()} L
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isSevere ? 'text-rose-400' : 'text-emerald-400'}>
                          {d.varianceLiters > 0 ? `+${d.varianceLiters} L` : `${d.varianceLiters} L`} ({d.variancePercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {d.waterDipMm > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            {d.waterDipMm} mm WATER
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-semibold">0 mm (Clear)</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 font-bold">{d.personResponsible}</div>
                        <div className="text-[10px] text-slate-400">By {d.conductedBy}</div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          d.status === 'normal' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
