import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trash2, 
  Edit3, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  TrendingUp, 
  Fuel, 
  Droplet, 
  Power, 
  ShieldCheck, 
  Activity, 
  Clock,
  PlusCircle,
  Gauge,
  Layers,
  MapPin,
  User,
  Phone,
  Coins,
  Settings
} from 'lucide-react';
import { AppTheme, StationBalance, StationEntry, UserSession } from '../types';
import { formatCurrency, formatVolume, formatPercent, formatDate } from '../utils/formatters';
import { FuelSalesTrendChart } from './FuelSalesTrendChart';

interface SummaryTabProps {
  session: UserSession;
  theme?: AppTheme;
  entries: StationEntry[];
  stationBalances?: StationBalance[];
  onEditEntry: (entry: StationEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleStationStatus?: (stationName: string) => void;
  onEditStation?: (station: StationBalance) => void;
  onDeleteStation?: (stationName: string) => void;
  onOpenAddStationModal?: () => void;
}

type FilterSegment = 'all' | 'station' | 'fleet' | 'weekly' | 'history';

export const SummaryTab: React.FC<SummaryTabProps> = ({
  session,
  theme = 'iphone-dark',
  entries,
  stationBalances = [],
  onEditEntry,
  onDeleteEntry,
  onToggleStationStatus,
  onEditStation,
  onDeleteStation,
  onOpenAddStationModal,
}) => {
  const isLight = theme === 'iphone-light';
  const [segment, setSegment] = useState<FilterSegment>('all');
  const [selectedStation, setSelectedStation] = useState<string>(
    stationBalances.length > 0 ? stationBalances[0].station : 'SWAT 1'
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);

  // Sync selectedStation if deleted
  useEffect(() => {
    if (stationBalances.length > 0 && !stationBalances.some(s => s.station === selectedStation)) {
      setSelectedStation(stationBalances[0].station);
    }
  }, [stationBalances, selectedStation]);

  // Derive station list from balances or entries
  const allStationNames = Array.from(
    new Set([
      ...stationBalances.map(s => s.station),
      ...entries.map(e => e.station),
    ])
  );

  const activeStationObj = stationBalances.find(s => s.station === selectedStation);

  // Filter entries based on active segment
  const now = new Date();
  const filteredEntries = entries.filter(e => {
    if (segment === 'station') {
      return e.station === selectedStation;
    }
    if (segment === 'weekly') {
      const entryDate = new Date(e.date);
      const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    return true; // 'all', 'history'
  });

  // Calculate metrics for current filtered set
  const net = filteredEntries.reduce((a, e) => a + e.netProfit, 0);
  const gross = filteredEntries.reduce((a, e) => a + e.grossProfit, 0);
  const exp = filteredEntries.reduce((a, e) => a + e.totalExpenses, 0);
  const rev = filteredEntries.reduce((a, e) => a + e.revenue, 0);
  const pet = filteredEntries.reduce((a, e) => a + e.petrolSales, 0);
  const die = filteredEntries.reduce((a, e) => a + e.dieselSales, 0);
  const hio = filteredEntries.reduce((a, e) => a + (e.hiOctaneSales || 0), 0);

  const salaries = filteredEntries.reduce((a, e) => a + e.salaries, 0);
  const wages = filteredEntries.reduce((a, e) => a + e.wages, 0);
  const food = filteredEntries.reduce((a, e) => a + e.food, 0);
  const travel = filteredEntries.reduce((a, e) => a + e.travel, 0);
  const maintenance = filteredEntries.reduce((a, e) => a + e.maintenance, 0);
  const other = filteredEntries.reduce((a, e) => a + e.otherExpenses, 0);

  const handleDelete = (id: string) => {
    onDeleteEntry(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Segment Selector Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className={`flex items-center p-1.5 rounded-2xl border overflow-x-auto ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {[
            { id: 'all', label: 'All Stations Matrix' },
            { id: 'station', label: 'By Specific Station' },
            { id: 'fleet', label: 'Stations & Tanks Fleet' },
            { id: 'weekly', label: 'Last 7 Days' },
            { id: 'history', label: 'Entries & Actions' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSegment(tab.id as FilterSegment)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                segment === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Station Sub-Filter if By Station is chosen */}
        {segment === 'station' && (
          <div
            className={`flex items-center gap-1.5 p-1 rounded-2xl border overflow-x-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {allStationNames.map(stName => {
              const stInfo = stationBalances.find(s => s.station === stName);
              const isSelected = selectedStation === stName;
              const isInactive = stInfo?.status === 'Inactive';

              return (
                <button
                  key={stName}
                  type="button"
                  onClick={() => setSelectedStation(stName)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{stName}</span>
                  {isInactive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Station Inactive" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Fleet Add Button shortcut */}
        {session.role === 'ceo_jalees' && onOpenAddStationModal && (
          <button
            type="button"
            onClick={onOpenAddStationModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Gas Station</span>
          </button>
        )}
      </div>

      {/* Specific Station Header Banner & Active/Inactive/Edit/Delete Controls */}
      {segment === 'station' && activeStationObj && (
        <div className="space-y-3">
          <div
            className={`p-4 sm:p-5 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-md ${
              activeStationObj.status === 'Inactive'
                ? 'bg-rose-500/10 border-rose-500/30'
                : isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border shrink-0 ${
                  activeStationObj.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                <Fuel className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-black tracking-tight">{activeStationObj.station}</h2>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      activeStationObj.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    }`}
                  >
                    {activeStationObj.status} Station
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Location: <b className="text-slate-300">{activeStationObj.location || 'Highway'}</b></span>
                  <span>Manager: <b className="text-slate-300">{activeStationObj.managerInCharge}</b></span>
                  {activeStationObj.phone && <span>Phone: <b className="text-slate-300">{activeStationObj.phone}</b></span>}
                </div>
              </div>
            </div>

            {/* CEO Station Controls: Edit, Delete, Toggle Status */}
            {session.role === 'ceo_jalees' && (
              <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
                {onEditStation && (
                  <button
                    type="button"
                    onClick={() => onEditStation(activeStationObj)}
                    title={`Edit ${activeStationObj.station} infrastructure, tanks, dispensers, nozzles`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Station</span>
                  </button>
                )}

                {onDeleteStation && (
                  stationToDelete === activeStationObj.station ? (
                    <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 p-1 rounded-xl">
                      <span className="text-[10px] text-rose-300 font-bold px-1.5">Delete station?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteStation(activeStationObj.station);
                          setStationToDelete(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setStationToDelete(null)}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStationToDelete(activeStationObj.station)}
                      title={`Delete ${activeStationObj.station}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )
                )}

                {onToggleStationStatus && (
                  <button
                    type="button"
                    onClick={() => onToggleStationStatus(activeStationObj.station)}
                    title={`Click to set station ${activeStationObj.status === 'Active' ? 'Inactive' : 'Active'}`}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                      activeStationObj.status === 'Active'
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{activeStationObj.status === 'Active' ? 'Pause' : 'Activate'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Infrastructure Specs Banner: Tanks, Capacities, Dispensers, Nozzles */}
          <div
            className={`p-4 rounded-2xl border text-xs grid grid-cols-2 sm:grid-cols-4 gap-3.5 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Underground Tanks ({activeStationObj.tanksCount || 2})</span>
              </div>
              <div className="font-bold text-white text-xs">{activeStationObj.typeOfTanks || 'Double-Walled Steel'}</div>
              <div className="text-[10px] text-slate-400">Total Tanks: {activeStationObj.tanksCount || 2} installed</div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fuel Tank Capacities</span>
              </div>
              <div className="font-mono text-slate-200 text-xs space-y-0.5">
                <div>Petrol: <b className="text-white">{activeStationObj.petrolCapacity.toLocaleString()}L</b> ({activeStationObj.petrolStock.toLocaleString()}L dip)</div>
                <div>Diesel: <b className="text-white">{activeStationObj.dieselCapacity.toLocaleString()}L</b> ({activeStationObj.dieselStock.toLocaleString()}L dip)</div>
                {activeStationObj.hiOctaneCapacity ? (
                  <div>Hi-Octane: <b className="text-purple-300">{activeStationObj.hiOctaneCapacity.toLocaleString()}L</b></div>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dispensers & Nozzles</span>
              </div>
              <div className="font-bold text-white text-xs">
                {activeStationObj.dispensersCount || 2} Dispensers • {activeStationObj.nozzlesCount || 4} Nozzles
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Avg {((activeStationObj.nozzlesCount || 4) / (activeStationObj.dispensersCount || 2)).toFixed(1)} nozzles/pump island
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Capital & Working Float</span>
              </div>
              <div className="font-mono text-slate-200 text-xs space-y-0.5">
                <div>Capital: <b className="text-purple-300">{formatCurrency(activeStationObj.allocatedInvestment)}</b></div>
                <div>Till Float: <b className="text-emerald-400">{formatCurrency(activeStationObj.cashOnHand)}</b></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLEET INFRASTRUCTURE VIEW OR STANDARD VIEW */}
      {segment === 'fleet' ? (
        <div className="space-y-6">
          {/* Fleet Aggregate KPI Stats Banner */}
          <div
            className={`rounded-3xl p-6 sm:p-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border shadow-md transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Gas Stations</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {stationBalances.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {stationBalances.filter(s => s.status === 'Active').length} Active • {stationBalances.filter(s => s.status === 'Inactive').length} Inactive
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Underground Tanks</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white font-mono">
                {stationBalances.reduce((a, s) => a + (s.tanksCount || 2), 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Vessels across network
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Storage Capacity</span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-emerald-400 font-mono">
                {stationBalances.reduce((a, s) => a + s.petrolCapacity + s.dieselCapacity + (s.hiOctaneCapacity || 0), 0).toLocaleString()} L
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Fuel inventory capacity
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dispensers & Nozzles</span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-white font-mono">
                {stationBalances.reduce((a, s) => a + (s.dispensersCount || 2), 0)} / {stationBalances.reduce((a, s) => a + (s.nozzlesCount || 4), 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Total Pumps / Nozzles
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Fleet Capital</span>
              </div>
              <div className="text-lg sm:text-xl font-black mt-1 text-purple-300 font-mono">
                {formatCurrency(stationBalances.reduce((a, s) => a + s.allocatedInvestment, 0))}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Allocated investment
              </div>
            </div>
          </div>

          {/* Fleet Cards Directory */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-emerald-400" />
                  <span>Gas Station Infrastructure & Equipment Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full control of underground tanks, dispenser islands, delivery nozzles, and station status.
                </p>
              </div>

              {session.role === 'ceo_jalees' && onOpenAddStationModal && (
                <button
                  type="button"
                  onClick={onOpenAddStationModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Commission New Gas Station</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stationBalances.map(st => {
                const totalCap = st.petrolCapacity + st.dieselCapacity + (st.hiOctaneCapacity || 0);
                const currentStock = st.petrolStock + st.dieselStock + (st.hiOctaneStock || 0);
                const petPct = st.petrolCapacity > 0 ? Math.min(100, Math.round((st.petrolStock / st.petrolCapacity) * 100)) : 0;
                const diePct = st.dieselCapacity > 0 ? Math.min(100, Math.round((st.dieselStock / st.dieselCapacity) * 100)) : 0;

                return (
                  <div
                    key={st.station}
                    className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all shadow-md ${
                      st.status === 'Inactive'
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Name, Status, Location */}
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-inherit pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-white tracking-tight">{st.station}</span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                st.status === 'Active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {st.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{st.location || 'Highway Junction'}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>In-Charge: <b className="text-slate-300">{st.managerInCharge}</b></span>
                            {st.phone && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-[11px] text-slate-400">{st.phone}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total Tank Vol</span>
                          <div className="text-sm font-black text-white font-mono">
                            {totalCap.toLocaleString()} L
                          </div>
                        </div>
                      </div>

                      {/* Infrastructure Details */}
                      <div className="mt-3.5 space-y-3 text-xs">
                        {/* Tanks Count & Type */}
                        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-400" />
                              <span>{st.tanksCount || 2} Underground Tanks</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {st.typeOfTanks || 'Double-Walled Steel'}
                            </span>
                          </div>

                          {/* Petrol Tank Breakdown */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                Petrol Tank:
                              </span>
                              <span className="font-mono text-slate-300">
                                <b>{st.petrolStock.toLocaleString()}</b> / {st.petrolCapacity.toLocaleString()} L ({petPct}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  petPct < 30 ? 'bg-rose-500' : petPct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${petPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Diesel Tank Breakdown */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                                Diesel Tank:
                              </span>
                              <span className="font-mono text-slate-300">
                                <b>{st.dieselStock.toLocaleString()}</b> / {st.dieselCapacity.toLocaleString()} L ({diePct}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  diePct < 30 ? 'bg-rose-500' : diePct < 50 ? 'bg-amber-500' : 'bg-amber-400'
                                }`}
                                style={{ width: `${diePct}%` }}
                              />
                            </div>
                          </div>

                          {/* Hi-Octane if present */}
                          {st.hiOctaneCapacity ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                                  Hi-Octane Tank:
                                </span>
                                <span className="font-mono text-slate-300">
                                  <b>{(st.hiOctaneStock || 0).toLocaleString()}</b> / {st.hiOctaneCapacity.toLocaleString()} L
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* Dispensers & Nozzles metrics */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-cyan-400" />
                              <span>Dispensers</span>
                            </div>
                            <div className="text-base font-black text-white mt-0.5 font-mono">
                              {st.dispensersCount || 2} <span className="text-xs font-normal text-slate-400">Pumps</span>
                            </div>
                          </div>

                          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Droplet className="w-3 h-3 text-emerald-400" />
                              <span>Nozzles</span>
                            </div>
                            <div className="text-base font-black text-white mt-0.5 font-mono">
                              {st.nozzlesCount || 4} <span className="text-xs font-normal text-slate-400">Guns</span>
                            </div>
                          </div>
                        </div>

                        {/* Capital & Till Cash Float */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Capital Float</div>
                            <div className="text-xs font-bold text-purple-300 font-mono mt-0.5">
                              {formatCurrency(st.allocatedInvestment)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Cash in Till</div>
                            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                              {formatCurrency(st.cashOnHand)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit, Delete, Toggle Status, View Ledger */}
                    <div className="pt-2 border-t border-inherit flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStation(st.station);
                          setSegment('station');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
                      >
                        View Station Ledger →
                      </button>

                      {session.role === 'ceo_jalees' && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          {onEditStation && (
                            <button
                              type="button"
                              onClick={() => onEditStation(st)}
                              title={`Edit tanks, capacity, dispensers, nozzles for ${st.station}`}
                              className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onToggleStationStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleStationStatus(st.station)}
                              title={st.status === 'Active' ? 'Pause station' : 'Activate station'}
                              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                st.status === 'Active'
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteStation && (
                            stationToDelete === st.station ? (
                              <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteStation(st.station);
                                    setStationToDelete(null);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStationToDelete(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setStationToDelete(st.station)}
                                title={`Decommission & delete ${st.station}`}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Stats */}
          <div
            className={`rounded-3xl p-6 sm:p-7 grid grid-cols-2 lg:grid-cols-4 gap-4 border shadow-md transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filtered Net Profit</div>
          <div className={`text-2xl sm:text-3xl font-black mt-1 ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(net)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin: {rev > 0 ? ((net / rev) * 100).toFixed(1) : '0.0'}% of gross revenue
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gross Profit</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {formatCurrency(gross)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Before deductions</div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Expenses</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
            {formatCurrency(exp)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Operating overheads</div>
        </div>

        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fuel Volumes Sold</div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
            {formatVolume(pet + die + hio)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            P: {pet.toFixed(0)}L • D: {die.toFixed(0)}L {hio > 0 ? `• HO: ${hio.toFixed(0)}L` : ''}
          </div>
        </div>
      </div>

      {/* 30-Day Fuel Sales Performance Trend Analysis (Recharts) */}
      <FuelSalesTrendChart
        entries={entries}
        stationBalances={stationBalances}
        theme={theme}
      />

      {/* Expense Breakdown Box */}
      <div
        className={`rounded-3xl p-5 space-y-3 border shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Operating Expense Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Salaries</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(salaries)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Wages</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(wages)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Food / Mess</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(food)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Travel</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(travel)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Maintenance</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(maintenance)}</div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <div className="text-slate-400 text-[10px]">Other</div>
            <div className="font-bold text-white mt-0.5">{formatCurrency(other)}</div>
          </div>
        </div>
      </div>

      {/* All Stations Operation Log with Edit & Delete */}
      <div
        className={`rounded-3xl p-5 sm:p-6 space-y-4 border shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-inherit pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black">
                Station Operations Log ({filteredEntries.length} entries)
              </h3>
              {session.role === 'ceo_jalees' ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold border border-indigo-500/30">
                  CEO EDIT & DELETE UNLOCKED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  EYES ONLY (READ ONLY)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {session.role === 'ceo_jalees'
                ? 'CEO Jalees has unconstrained authority to modify or delete closing entries across all stations'
                : 'Modifications and deletions are restricted to CEO / Admin Jalees'}
            </p>
          </div>
        </div>

        {/* Entries Table */}
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No entries found matching the active filter.
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
                  <th className="py-3 px-4">Station & Date</th>
                  <th className="py-3 px-3">Petrol (L)</th>
                  <th className="py-3 px-3">Diesel (L)</th>
                  <th className="py-3 px-3">Hi-Octane (L)</th>
                  <th className="py-3 px-3">Gross Rev</th>
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
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-sm">{entry.station}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{formatDate(entry.date)}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div>{entry.petrolSales.toLocaleString()} L</div>
                      <div className="text-[10px] text-slate-400">₨{entry.petrolSaleRate}/L</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div>{entry.dieselSales.toLocaleString()} L</div>
                      <div className="text-[10px] text-slate-400">₨{entry.dieselSaleRate}/L</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      {entry.hiOctaneSales ? (
                        <>
                          <div>{entry.hiOctaneSales.toLocaleString()} L</div>
                          <div className="text-[10px] text-purple-400">₨{entry.hiOctaneSaleRate}/L</div>
                        </>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold">
                      {formatCurrency(entry.revenue)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-rose-400">
                      {formatCurrency(entry.totalExpenses)}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-black text-emerald-400">
                      {formatCurrency(entry.netProfit)}
                    </td>

                    <td className="py-3.5 px-3 font-mono">
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

                    <td className="py-3.5 px-4 text-right">
                      {session.role === 'ceo_jalees' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            title="Edit this closing entry"
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(entry.id)}
                              title="Delete this closing entry"
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};
