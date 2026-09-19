import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Filter, 
  Search, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Fuel, 
  TrendingUp, 
  DollarSign, 
  Download,
  CalendarDays,
  Lock
} from 'lucide-react';
import { 
  AppTheme, 
  AuditRecord, 
  AuditStatus, 
  CalendarTimeframe, 
  StationBalance, 
  StationEntry, 
  UserSession 
} from '../types';

interface CalendarLogsTabProps {
  session: UserSession;
  theme?: AppTheme;
  entries: StationEntry[];
  audits: AuditRecord[];
  stationBalances: StationBalance[];
  onEditEntry: (entry: StationEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateAuditStatus: (auditId: string, status: AuditStatus, notes?: string) => void;
}

export const CalendarLogsTab: React.FC<CalendarLogsTabProps> = ({
  session,
  theme = 'iphone-dark',
  entries,
  audits,
  stationBalances,
  onEditEntry,
  onDeleteEntry,
  onUpdateAuditStatus,
}) => {
  const isLight = theme === 'iphone-light';

  // Sub-Log selector
  const [activeLog, setActiveLog] = useState<'warnings' | 'audits' | 'entries'>('entries');

  // Timeframe and calendar filter
  const [timeframe, setTimeframe] = useState<CalendarTimeframe>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'profit-desc' | 'variance-desc'>('date-desc');

  // Filter dates based on dynamic timeframe
  const isDateInTimeframe = (dateStr: string) => {
    if (!dateStr) return false;
    if (timeframe === 'all') return true;

    const itemDate = new Date(dateStr);
    const now = new Date();

    if (timeframe === 'daily') {
      return dateStr === selectedDate;
    }

    if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    }

    if (timeframe === 'monthly') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= thirtyDaysAgo && itemDate <= now;
    }

    if (timeframe === 'quarterly') {
      // Current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(itemDate.getMonth() / 3);
      return itemDate.getFullYear() === now.getFullYear() && itemQuarter === currentQuarter;
    }

    if (timeframe === 'annual') {
      return itemDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // 1. FILTERED ENTRIES LOG
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const stationMatch = selectedStation === 'all' || e.station === selectedStation;
      const timeMatch = isDateInTimeframe(e.date);
      const searchMatch = !searchQuery || 
        e.station.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.date.includes(searchQuery) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return stationMatch && timeMatch && searchMatch;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'profit-desc') return b.netProfit - a.netProfit;
      if (sortBy === 'variance-desc') return Math.abs(b.nozzleVariance) - Math.abs(a.nozzleVariance);
      return 0;
    });
  }, [entries, selectedStation, timeframe, selectedDate, searchQuery, sortBy]);

  // 2. FILTERED AUDITS LOG
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const stationMatch = selectedStation === 'all' || a.station === selectedStation;
      const timeMatch = isDateInTimeframe(a.date);
      const searchMatch = !searchQuery ||
        a.station.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return stationMatch && timeMatch && searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [audits, selectedStation, timeframe, selectedDate, searchQuery]);

  // 3. GENERATED WARNINGS LOG (from low tank stock, variances, and inactive statuses)
  const warningsList = useMemo(() => {
    const list: Array<{
      id: string;
      station: string;
      date: string;
      title: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      detail: string;
    }> = [];

    // Tank stock warnings across stations
    stationBalances.forEach(st => {
      const petrolRatio = st.petrolCapacity > 0 ? (st.petrolStock / st.petrolCapacity) : 1;
      const dieselRatio = st.dieselCapacity > 0 ? (st.dieselStock / st.dieselCapacity) : 1;
      const hiOctaneRatio = (st.hiOctaneCapacity && st.hiOctaneCapacity > 0) 
        ? ((st.hiOctaneStock || 0) / st.hiOctaneCapacity) 
        : 1;

      if (petrolRatio < 0.3) {
        list.push({
          id: `warn-p-${st.station}`,
          station: st.station,
          date: new Date().toISOString().split('T')[0],
          title: `Critical Petrol Stock (${(petrolRatio * 100).toFixed(0)}%)`,
          severity: 'critical',
          detail: `Underground Petrol tank at ${st.station} is at ${st.petrolStock}L / ${st.petrolCapacity}L. Tanker order urgent!`,
        });
      } else if (petrolRatio < 0.5) {
        list.push({
          id: `warn-p-med-${st.station}`,
          station: st.station,
          date: new Date().toISOString().split('T')[0],
          title: `Low Petrol Stock Warning (${(petrolRatio * 100).toFixed(0)}%)`,
          severity: 'medium',
          detail: `Petrol inventory at ${st.station} below 50% capacity.`,
        });
      }

      if (dieselRatio < 0.3) {
        list.push({
          id: `warn-d-${st.station}`,
          station: st.station,
          date: new Date().toISOString().split('T')[0],
          title: `Critical Diesel Stock (${(dieselRatio * 100).toFixed(0)}%)`,
          severity: 'critical',
          detail: `Underground Diesel tank at ${st.station} is at ${st.dieselStock}L / ${st.dieselCapacity}L.`,
        });
      }

      if (st.supportsHiOctane && hiOctaneRatio < 0.35) {
        list.push({
          id: `warn-ho-${st.station}`,
          station: st.station,
          date: new Date().toISOString().split('T')[0],
          title: `Low Hi-Octane Stock (${(hiOctaneRatio * 100).toFixed(0)}%)`,
          severity: 'high',
          detail: `Hi-Octane tank at ${st.station} is down to ${st.hiOctaneStock || 0}L.`,
        });
      }

      if (st.status === 'Inactive') {
        list.push({
          id: `warn-inact-${st.station}`,
          station: st.station,
          date: new Date().toISOString().split('T')[0],
          title: `Station Inactive: Operations Suspended`,
          severity: 'high',
          detail: `${st.station} is currently marked as INACTIVE. No dispenser dispensing authorized.`,
        });
      }
    });

    // Add nozzle variances from entries
    entries.forEach(e => {
      if (Math.abs(e.nozzleVariance) > 10) {
        list.push({
          id: `warn-var-${e.id}`,
          station: e.station,
          date: e.date,
          title: `Nozzle Variance Flag: ${e.nozzleVariance.toFixed(1)} Liters`,
          severity: Math.abs(e.nozzleVariance) > 20 ? 'critical' : 'high',
          detail: `Entry on ${e.date} at ${e.station} had nozzle meter vs cash discrepancy of ${e.nozzleVariance.toFixed(1)}L.`,
        });
      }
    });

    return list.filter(w => {
      const stationMatch = selectedStation === 'all' || w.station === selectedStation;
      const timeMatch = isDateInTimeframe(w.date);
      const searchMatch = !searchQuery || 
        w.station.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.title.toLowerCase().includes(searchQuery.toLowerCase());
      return stationMatch && timeMatch && searchMatch;
    });
  }, [stationBalances, entries, selectedStation, timeframe, selectedDate, searchQuery]);

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner with Dynamic Calendar Selector */}
      <div
        className={`p-5 rounded-3xl border backdrop-blur-xl transition-all shadow-lg ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black tracking-tight">
                Dynamic Calendar Audit & Operations Logs
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Filterable across Daily, Weekly, Monthly, Quarterly, and Annual timeframes with executive editing
            </p>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border bg-slate-950/40 border-inherit text-xs">
            {(['all', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'] as CalendarTimeframe[]).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Specific Date Selector (when daily selected) & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-inherit">
          {timeframe === 'daily' ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Select Calendar Day
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Active Range
              </label>
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="capitalize">{timeframe} View</span>
              </div>
            </div>
          )}

          {/* Gas Station Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Filter by Gas Station
            </label>
            <select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="all">All Stations ({stationBalances.length})</option>
              {stationBalances.map(s => (
                <option key={s.station} value={s.station}>
                  {s.station} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Station, date, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Sort Records
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="profit-desc">Highest Net Profit</option>
              <option value="variance-desc">Highest Variance</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3 Dedicated Sub-Logs Selector */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border bg-slate-950/40 border-inherit">
        <button
          type="button"
          onClick={() => setActiveLog('entries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeLog === 'entries'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daily Closings Log ({filteredEntries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLog('audits')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeLog === 'audits'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit Directives Log ({filteredAudits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLog('warnings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeLog === 'warnings'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Critical Warnings Log ({warningsList.length})</span>
        </button>
      </div>

      {/* LOG 1: DAILY ENTRIES & CLOSINGS */}
      {activeLog === 'entries' && (
        <div
          className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">
                Station Daily Closings Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Full sales, purchase, nozzle readings, operating expenses, and net profit records
              </p>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Showing {filteredEntries.length} records
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No daily closing records found for the selected dynamic calendar period and filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                      isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <th className="py-3 px-4">Date & Station</th>
                    <th className="py-3 px-3">Petrol (L)</th>
                    <th className="py-3 px-3">Diesel (L)</th>
                    <th className="py-3 px-3">Hi-Octane (L)</th>
                    <th className="py-3 px-3">Gross Revenue</th>
                    <th className="py-3 px-3">Expenses</th>
                    <th className="py-3 px-3">Net Profit</th>
                    <th className="py-3 px-3">Variance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {filteredEntries.map(entry => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-blue-500/5 transition-colors ${
                        entry.auditFlag ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">
                        <div className="font-bold text-slate-200">{entry.station}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{entry.date}</div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div>{entry.petrolSales.toLocaleString()} L</div>
                        <div className="text-[10px] text-slate-400">₨{entry.petrolSaleRate}/L</div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div>{entry.dieselSales.toLocaleString()} L</div>
                        <div className="text-[10px] text-slate-400">₨{entry.dieselSaleRate}/L</div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {entry.hiOctaneSales ? (
                          <>
                            <div>{entry.hiOctaneSales.toLocaleString()} L</div>
                            <div className="text-[10px] text-purple-400">₨{entry.hiOctaneSaleRate}/L</div>
                          </>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        ₨{entry.revenue.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono text-rose-400">
                        ₨{entry.totalExpenses.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono font-extrabold text-emerald-400">
                        ₨{entry.netProfit.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            Math.abs(entry.nozzleVariance) > 10
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entry.nozzleVariance > 0 ? `+${entry.nozzleVariance.toFixed(1)}` : entry.nozzleVariance.toFixed(1)} L
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {session.role === 'ceo_jalees' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditEntry(entry)}
                              title="Edit this closing entry"
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete closing entry for ${entry.station} (${entry.date})?`)) {
                                  onDeleteEntry(entry.id);
                                }
                              }}
                              title="Delete this closing entry"
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono"
                            title="Only CEO / Admin Jalees has edit and delete authority. Managers have daily/shift entry authority only."
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            CEO Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOG 2: AUDIT DIRECTIVES */}
      {activeLog === 'audits' && (
        <div
          className={`rounded-3xl border p-5 transition-all shadow-xl space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black">Audit Investigations & Enforcement</h2>
              <p className="text-xs text-slate-400">
                Discrepancy flags, resolution workflows, and management sign-offs
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold">{filteredAudits.length} Directives</span>
          </div>

          {filteredAudits.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit investigations recorded for the selected period.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAudits.map(audit => (
                <div
                  key={audit.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    audit.severity === 'high'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{audit.title}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          audit.status === 'Completed' || audit.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {audit.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {audit.station} • {audit.date}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{audit.description}</p>

                  {/* Audit Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-inherit text-xs">
                    <div className="text-[11px] text-slate-400">
                      {audit.actionTakenBy ? (
                        <span>
                          Actioned by: <b>{audit.actionTakenBy}</b> ({audit.actionNotes})
                        </span>
                      ) : (
                        <span>Status: Awaiting resolution</span>
                      )}
                    </div>

                    {session.role === 'ceo_jalees' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateAuditStatus(audit.id, 'In Progress', 'Field audit dispatched')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Mark In Progress
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateAuditStatus(audit.id, 'Resolved', 'Reconciled and verified')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOG 3: CRITICAL WARNINGS */}
      {activeLog === 'warnings' && (
        <div
          className={`rounded-3xl border p-5 transition-all shadow-xl space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black">Real-Time Operational Warnings Log</h2>
              <p className="text-xs text-slate-400">
                Underground tank critical dips (&lt;33%), inactive station alarms, and nozzle anomalies
              </p>
            </div>
            <span className="text-xs text-rose-400 font-bold">{warningsList.length} Active Warnings</span>
          </div>

          {warningsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No operational warnings currently triggered. All stations operating within normal parameters.
            </div>
          ) : (
            <div className="space-y-3">
              {warningsList.map(warn => (
                <div
                  key={warn.id}
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    warn.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-100'
                      : warn.severity === 'high'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-inherit shrink-0 mt-0.5">
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        warn.severity === 'critical'
                          ? 'text-rose-400 animate-pulse'
                          : 'text-amber-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{warn.title}</span>
                        <span
                          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                            warn.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {warn.severity}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{warn.date}</span>
                    </div>

                    <p className="text-xs mt-1 text-slate-300 leading-relaxed">{warn.detail}</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Location / Unit: <b className="text-white">{warn.station}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
