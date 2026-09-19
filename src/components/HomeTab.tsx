import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Droplet, 
  Wallet, 
  Coins, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowRight,
  Clock,
  RotateCcw,
  Building2,
  DollarSign,
  Edit3,
  Layers,
  Gauge,
  Bell,
  Sparkles,
  Activity,
  Calendar,
  Filter,
  LayoutGrid,
  ListFilter,
  Table,
  ExternalLink,
  ChevronRight,
  Sliders,
  Ruler
} from 'lucide-react';
import { 
  AppTheme,
  BroadcastNotification, 
  DashboardLayoutConfig,
  DashboardSectionId,
  DipTestRecord,
  DipTestScheduleItem,
  StationBalance, 
  StationEntry, 
  StationName, 
  UserSession 
} from '../types';
import { formatCurrency, formatVolume, formatPercent, formatCompactCurrency } from '../utils/formatters';
import { DashboardAlerts } from './DashboardAlerts';
import { DipTestWidget } from './DipTestWidget';
import { DashboardLayoutModal } from './DashboardLayoutModal';
import { DEFAULT_DASHBOARD_LAYOUT } from '../mockData';

interface HomeTabProps {
  session: UserSession;
  entries: StationEntry[];
  stationBalances: StationBalance[];
  notifications: BroadcastNotification[];
  dipTests?: DipTestRecord[];
  dipSchedules?: DipTestScheduleItem[];
  layoutConfig?: DashboardLayoutConfig;
  theme?: AppTheme;
  onNavigateToTab: (tab: any) => void;
  onResetSwatData?: () => void;
  onEditStation?: (station: StationBalance) => void;
  onOpenBankModal?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenDipTestModal?: (station?: StationName) => void;
  onSaveLayoutConfig?: (config: DashboardLayoutConfig) => void;
  onResetLayoutConfig?: () => void;
}

type TimeframeOption = 'all' | 'month' | 'week' | 'today';

export const HomeTab: React.FC<HomeTabProps> = ({
  session,
  entries,
  stationBalances,
  notifications,
  dipTests = [],
  dipSchedules = [],
  layoutConfig = DEFAULT_DASHBOARD_LAYOUT,
  theme = 'iphone-dark',
  onNavigateToTab,
  onResetSwatData,
  onEditStation,
  onOpenBankModal,
  onOpenNotificationsModal,
  onOpenDipTestModal,
  onSaveLayoutConfig,
  onResetLayoutConfig,
}) => {
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  // Interactive filtering states
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('all');
  const [stationViewMode, setStationViewMode] = useState<'grid' | 'table'>('grid');
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);

  // Filter entries based on timeframe & selected station
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return entries.filter(entry => {
      // Station filter
      if (selectedStation !== 'all' && entry.station !== selectedStation) {
        return false;
      }

      // Timeframe filter
      if (selectedTimeframe === 'today') {
        return entry.date === todayStr;
      } else if (selectedTimeframe === 'week') {
        const entryDate = new Date(entry.date);
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      } else if (selectedTimeframe === 'month') {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [entries, selectedStation, selectedTimeframe]);

  // Aggregate Financials for filtered entries
  const totalNet = filteredEntries.reduce((a, e) => a + (e.netProfit || 0), 0);
  const totalGross = filteredEntries.reduce((a, e) => a + (e.grossProfit || 0), 0);
  const totalExpenses = filteredEntries.reduce((a, e) => a + (e.totalExpenses || 0), 0);
  const totalRevenue = filteredEntries.reduce((a, e) => a + (e.revenue || 0), 0);
  const totalPetrol = filteredEntries.reduce((a, e) => a + (e.petrolSales || 0), 0);
  const totalDiesel = filteredEntries.reduce((a, e) => a + (e.dieselSales || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

  // Station Balances (filtered if single station selected)
  const visibleStations = useMemo(() => {
    if (selectedStation === 'all') return stationBalances;
    return stationBalances.filter(s => s.station === selectedStation);
  }, [stationBalances, selectedStation]);

  const totalStationCash = visibleStations.reduce((a, s) => a + s.cashOnHand, 0);
  const totalStationInvestment = visibleStations.reduce((a, s) => a + s.allocatedInvestment, 0);
  const totalPetrolStock = visibleStations.reduce((a, s) => a + (s.petrolStock || 0), 0);
  const totalDieselStock = visibleStations.reduce((a, s) => a + (s.dieselStock || 0), 0);

  // Latest notification
  const latestNotif = notifications[0];

  // Theme-specific styling variables
  const cardBg = isLight
    ? theme === 'sandstone-light'
      ? 'bg-[#fcfbf9] border-stone-200 shadow-sm'
      : theme === 'nordic-light'
      ? 'bg-white border-zinc-200/90 shadow-sm'
      : 'bg-white border-slate-200 shadow-sm'
    : 'bg-slate-900/90 border-slate-800 shadow-xl';

  const textPrimary = isLight
    ? theme === 'sandstone-light'
      ? 'text-stone-900'
      : 'text-slate-900'
    : 'text-white';

  const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400';
  const innerBoxBg = isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-slate-950/60 border-slate-800/80';

  // Density spacing styles
  const containerSpacing = 
    layoutConfig.density === 'compact' ? 'space-y-4' : 
    layoutConfig.density === 'executive' ? 'space-y-4.5' : 'space-y-6';

  // Visible sections list
  const activeSections = useMemo(() => {
    const hiddenSet = new Set(layoutConfig.hiddenSections || []);
    return (layoutConfig.sectionsOrder || DEFAULT_DASHBOARD_LAYOUT.sectionsOrder).filter(
      sec => !hiddenSet.has(sec)
    );
  }, [layoutConfig]);

  // Section Renderer Function
  const renderDashboardSection = (sectionId: DashboardSectionId) => {
    switch (sectionId) {
      case 'kpi_banner':
        return (
          <div 
            key="kpi_banner"
            onClick={() => onNavigateToTab('summary')}
            className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl cursor-pointer transition-all group ${
              isLight
                ? theme === 'sandstone-light'
                  ? 'bg-gradient-to-br from-[#fcfbf9] via-[#f7f3eb] to-[#ede7dc] border-stone-300/80 hover:border-amber-500/50'
                  : theme === 'nordic-light'
                  ? 'bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/60 border-zinc-200 hover:border-sky-400'
                  : 'bg-gradient-to-br from-white via-blue-50/40 to-slate-100 border-slate-300 hover:border-blue-400'
                : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 border-indigo-800/40 hover:border-indigo-600/60'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className={isLight ? 'text-indigo-950' : 'text-indigo-300'}>
                    Net Profit — {selectedStation === 'all' ? 'All Stations' : selectedStation}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    {selectedTimeframe === 'all' ? 'ALL RECORDED' : selectedTimeframe.toUpperCase()} • CLICK FOR SUMMARY
                  </span>
                </div>
                <div className={`text-3xl sm:text-5xl font-black tracking-tight ${
                  isLight ? 'text-slate-950 group-hover:text-blue-600' : 'text-white group-hover:text-emerald-300'
                } transition-colors`}>
                  {formatCurrency(totalNet)}
                </div>
                <div className={`flex flex-wrap items-center gap-3 text-xs sm:text-sm mt-2 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(totalGross)} gross
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {formatCurrency(totalExpenses)} expenses
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-mono text-xs font-bold">
                    {avgMargin.toFixed(1)}% margin
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-xs">
                    {filteredEntries.length} entries filtered
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTab('summary');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Full Analytics &amp; Trends</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'stats_grid':
        return (
          <div key="stats_grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Petrol Dispensed */}
            <div 
              onClick={() => onNavigateToTab('rates')}
              className={`${cardBg} rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer hover:border-emerald-500/60 transition-all group border`}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500"></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Petrol Dispensed</span>
                <Droplet className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${textPrimary}`}>
                {formatVolume(totalPetrol)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono flex items-center justify-between">
                <span>Tank Stock: {formatVolume(totalPetrolStock)}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-emerald-500 transition-colors">Rates →</span>
              </div>
            </div>

            {/* Diesel Dispensed */}
            <div 
              onClick={() => onNavigateToTab('rates')}
              className={`${cardBg} rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer hover:border-amber-500/60 transition-all group border`}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500"></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Diesel Dispensed</span>
                <Fuel className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${textPrimary}`}>
                {formatVolume(totalDiesel)}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono flex items-center justify-between">
                <span>Tank Stock: {formatVolume(totalDieselStock)}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-500 transition-colors">Rates →</span>
              </div>
            </div>

            {/* Total Cash Balance */}
            <div 
              onClick={() => {
                if (onOpenBankModal) onOpenBankModal();
                else onNavigateToTab('summary');
              }}
              className={`${cardBg} rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer hover:border-blue-500/60 transition-all group border`}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Station Cash Float</span>
                <Wallet className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${textPrimary}`}>
                {formatCompactCurrency(totalStationCash)}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center justify-between">
                <span>Physical till floats</span>
                <span className="text-[10px] group-hover:underline">Bank Deposits →</span>
              </div>
            </div>

            {/* Total Station Capital */}
            <div 
              onClick={() => onNavigateToTab('partners')}
              className={`${cardBg} rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer hover:border-purple-500/60 transition-all group border`}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-500"></div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Station Capital Base</span>
                <Coins className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${textPrimary}`}>
                {formatCompactCurrency(totalStationInvestment)}
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-300 mt-1 flex items-center justify-between">
                <span>Working equity</span>
                <span className="text-[10px] text-purple-500 group-hover:underline">Partners →</span>
              </div>
            </div>
          </div>
        );

      case 'ai_alerts':
        return (
          <DashboardAlerts
            key="ai_alerts"
            entries={entries}
            stationBalances={stationBalances}
            theme={theme}
            onNavigateToTab={onNavigateToTab}
          />
        );

      case 'dip_test_widget':
        return (
          <DipTestWidget
            key="dip_test_widget"
            dipTests={dipTests}
            dipSchedules={dipSchedules}
            stationBalances={stationBalances}
            session={session}
            theme={theme}
            onOpenLogModal={(st) => {
              if (onOpenDipTestModal) onOpenDipTestModal(st);
            }}
          />
        );

      case 'market_pulse':
        return (
          <div 
            key="market_pulse"
            onClick={() => onNavigateToTab('market_pulse')}
            className={`${cardBg} rounded-3xl p-5 border cursor-pointer hover:border-emerald-500/60 transition-all group relative overflow-hidden`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
                  <div className={`w-full h-full ${isLight ? 'bg-emerald-50' : 'bg-slate-950'} rounded-[14px] flex items-center justify-center`}>
                    <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold ${textPrimary} group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors`}>
                      Live Market Pulse &amp; Petroleum Intelligence
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      LIVE FEED
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>
                    OGRA official bi-monthly regulated schedules, crude benchmarks, station microclimates &amp; safety index
                  </p>
                </div>
              </div>

              {/* Mini Tickers */}
              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                <div className={`px-3 py-1.5 rounded-xl border text-xs ${innerBoxBg}`}>
                  <span className="text-[10px] text-slate-400 font-semibold mr-1.5">BRENT:</span>
                  <span className="font-extrabold text-emerald-500 font-mono">$74.20</span>
                  <span className="text-[10px] text-emerald-500 ml-1">▲1.2%</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-xs ${innerBoxBg}`}>
                  <span className="text-[10px] text-slate-400 font-semibold mr-1.5">OGRA PETROL:</span>
                  <span className="font-extrabold text-blue-500 font-mono">₨279.75</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-xs ${innerBoxBg}`}>
                  <span className="text-[10px] text-slate-400 font-semibold mr-1.5">DIESEL:</span>
                  <span className="font-extrabold text-amber-500 font-mono">₨283.60</span>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">
                  <span>Explore Market Pulse</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'station_balances':
        return (
          <div key="station_balances" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <h2 className={`text-sm sm:text-base font-bold ${textPrimary} uppercase tracking-wider`}>
                  Station-Wise Balance Investment &amp; Cash Float
                </h2>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* View Mode Toggle */}
                <div className={`p-0.5 rounded-xl border flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => setStationViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stationViewMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : textSecondary
                    }`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStationViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stationViewMode === 'table'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : textSecondary
                    }`}
                    title="Executive Comparison Table"
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs font-semibold text-slate-400 font-mono hidden md:inline">
                  Click any station to view closing entries
                </span>
              </div>
            </div>

            {/* Table View Mode */}
            {stationViewMode === 'table' ? (
              <div className={`${cardBg} rounded-2xl border overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                      <tr>
                        <th className="p-3.5 font-bold">Station</th>
                        <th className="p-3.5 font-bold">Manager / City</th>
                        <th className="p-3.5 font-bold">Petrol Stock</th>
                        <th className="p-3.5 font-bold">Diesel Stock</th>
                        <th className="p-3.5 font-bold">Cash in Till</th>
                        <th className="p-3.5 font-bold">Allocated Capital</th>
                        <th className="p-3.5 font-bold">Net Profit</th>
                        <th className="p-3.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                      {visibleStations.map(st => {
                        const stEntries = entries.filter(e => e.station === st.station);
                        const stNet = stEntries.reduce((a, e) => a + (e.netProfit || 0), 0);

                        return (
                          <tr 
                            key={st.station}
                            onClick={() => onNavigateToTab('logs')}
                            className={`hover:${isLight ? 'bg-slate-50' : 'bg-slate-800/40'} cursor-pointer transition-colors`}
                          >
                            <td className="p-3.5">
                              <span className={`font-bold ${textPrimary}`}>{st.station}</span>
                            </td>
                            <td className="p-3.5">
                              <div className={textPrimary}>{st.managerInCharge}</div>
                              <div className="text-[10px] text-slate-400">{st.location || 'Highway'}</div>
                            </td>
                            <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              {st.petrolStock.toLocaleString()} L
                            </td>
                            <td className="p-3.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                              {st.dieselStock.toLocaleString()} L
                            </td>
                            <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {formatCurrency(st.cashOnHand)}
                            </td>
                            <td className="p-3.5 font-mono text-purple-600 dark:text-purple-300">
                              {formatCurrency(st.allocatedInvestment)}
                            </td>
                            <td className={`p-3.5 font-mono font-bold ${stNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(stNet)}
                            </td>
                            <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {session.role === 'ceo_jalees' && onEditStation && (
                                  <button
                                    type="button"
                                    onClick={() => onEditStation(st)}
                                    className="p-1 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                                    title="Edit station equipment"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onNavigateToTab('logs')}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                >
                                  Logs →
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {visibleStations.map(st => {
                  const stEntries = entries.filter(e => e.station === st.station);
                  const stNet = stEntries.reduce((a, e) => a + (e.netProfit || 0), 0);

                  const approxInventoryValue = st.petrolStock * 355 + st.dieselStock * 353.5;
                  const isSwat1or2 = st.station === 'SWAT 1' || st.station === 'SWAT 2';

                  return (
                    <div
                      key={st.station}
                      onClick={() => onNavigateToTab('logs')}
                      className={`${cardBg} rounded-2xl p-4.5 hover:border-blue-500/60 transition-all space-y-3 shadow-sm cursor-pointer group border`}
                    >
                      {/* Station Title & Status */}
                      <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-extrabold text-base ${textPrimary} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                              {st.station}
                            </span>
                            {isSwat1or2 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                {stEntries.length === 0 ? 'RESET (0 ENTRIES)' : `${stEntries.length} entries`}
                              </span>
                            )}
                            {st.status === 'Inactive' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                                PAUSED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Mgr: <b className={textPrimary}>{st.managerInCharge}</b></span>
                            <span>•</span>
                            <span>{st.location || 'Highway'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`text-xs font-extrabold ${stNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(stNet)}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase">Net Profit</div>
                          </div>
                          {session.role === 'ceo_jalees' && onEditStation && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditStation(st);
                              }}
                              title={`Edit tanks, capacity, dispensers, nozzles for ${st.station}`}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isLight
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Infrastructure Equipment: Tanks, Dispensers, Nozzles */}
                      <div className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl border ${innerBoxBg} text-slate-500 dark:text-slate-400`}>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-500" />
                          <span><b>{st.tanksCount || 2}</b> Tanks</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-cyan-500" />
                          <span><b>{st.dispensersCount || 2}</b> Pumps</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-emerald-500" />
                          <span><b>{st.nozzlesCount || 4}</b> Nozzles</span>
                        </span>
                      </div>

                      {/* Investment & Cash Balances Details */}
                      <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border ${innerBoxBg}`}>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTab('partners');
                          }}
                          className="hover:opacity-80 p-1 rounded-lg transition-opacity"
                        >
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                            Allocated Capital ↗
                          </div>
                          <div className="text-sm font-bold text-purple-600 dark:text-purple-300 font-mono">
                            {formatCurrency(st.allocatedInvestment)}
                          </div>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenBankModal) onOpenBankModal();
                            else onNavigateToTab('entry');
                          }}
                          className="hover:opacity-80 p-1 rounded-lg transition-opacity"
                        >
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                            Cash in Hand (Till) ↗
                          </div>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(st.cashOnHand)}
                          </div>
                        </div>
                      </div>

                      {/* Current Stock Reserves */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Petrol: <b className={textPrimary}>{st.petrolStock.toLocaleString()} L</b></span>
                          <span>Diesel: <b className={textPrimary}>{st.dieselStock.toLocaleString()} L</b></span>
                        </div>
                        <div className={`flex justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t pt-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                          <span>Stock Asset Value:</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{formatCompactCurrency(approxInventoryValue)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'tank_stocks':
        return (
          <div key="tank_stocks" className={`${cardBg} rounded-3xl p-5 sm:p-6 space-y-4 border`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                <h3 className={`text-sm sm:text-base font-bold ${textPrimary}`}>
                  Underground Fuel Tank Stock Levels &amp; Decanting Thresholds
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Replenishment Threshold: 33% Crit / 50% Warn • Click row to log decanting
              </span>
            </div>

            <div className="space-y-3.5">
              {visibleStations.map(st => {
                const petPct = (st.petrolStock / (st.petrolCapacity || 25000)) * 100;
                const diePct = (st.dieselStock / (st.dieselCapacity || 25000)) * 100;

                const isCrit = petPct < 33 || diePct < 33;
                const isWarn = !isCrit && (petPct < 50 || diePct < 50);

                const alertBadge = isCrit ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase">
                    CRITICAL &lt;33%
                  </span>
                ) : isWarn ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                    WARNING &lt;50%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                    HEALTHY
                  </span>
                );

                return (
                  <div
                    key={st.station}
                    onClick={() => onNavigateToTab('entry')}
                    className={`rounded-2xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                      isLight
                        ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-28 shrink-0">
                      <div className={`font-extrabold text-sm ${textPrimary}`}>{st.station}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{st.managerInCharge}</div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Petrol Gauge Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Petrol: {st.petrolStock.toLocaleString()} / {(st.petrolCapacity || 25000).toLocaleString()} L</span>
                          <span className={`font-bold ${petPct < 33 ? 'text-rose-500' : petPct < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {petPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              petPct < 33 ? 'bg-rose-500' : petPct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, petPct))}%` }}
                          />
                        </div>
                      </div>

                      {/* Diesel Gauge Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Diesel: {st.dieselStock.toLocaleString()} / {(st.dieselCapacity || 25000).toLocaleString()} L</span>
                          <span className={`font-bold ${diePct < 33 ? 'text-rose-500' : diePct < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {diePct.toFixed(0)}%
                          </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              diePct < 33 ? 'bg-rose-500' : diePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, diePct))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">{alertBadge}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${containerSpacing} pb-20 sm:pb-8`}>
      {/* Broadcast Notification Alert Banner */}
      {latestNotif && (
        <div 
          onClick={() => {
            if (onOpenNotificationsModal) onOpenNotificationsModal();
            else onNavigateToTab('audit');
          }}
          className={`rounded-2xl p-3.5 flex items-start sm:items-center justify-between gap-3 text-xs cursor-pointer border transition-all ${
            isLight
              ? 'bg-blue-50/90 border-blue-200 text-blue-900 hover:bg-blue-100/80'
              : 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-blue-500/30 hover:border-blue-400/50'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className={`font-bold mr-1.5 ${isLight ? 'text-blue-950' : 'text-white'}`}>{latestNotif.title}:</span>
              <span className={isLight ? 'text-blue-800' : 'text-slate-300'}>{latestNotif.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-600 font-bold shrink-0 text-[11px] underline ml-2">
            <span>View All ({notifications.length})</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Interactive Timeframe, Station Filter Bar & Layout Customizer */}
      <div className={`${cardBg} rounded-2xl p-3.5 border flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        {/* Station Selection Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className={`text-[11px] font-bold ${textSecondary} uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1`}>
            <Filter className="w-3 h-3 text-blue-500" />
            <span>Station:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedStation('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedStation === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            All Stations ({stationBalances.length})
          </button>
          {stationBalances.map(s => (
            <button
              key={s.station}
              type="button"
              onClick={() => setSelectedStation(s.station)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedStation === s.station
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {s.station}
            </button>
          ))}
        </div>

        {/* Right Tools: Horizon Filter & Customize Layout Button */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
          {/* Time Horizon Filter */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold ${textSecondary} uppercase tracking-wider flex items-center gap-1 mr-1`}>
              <Calendar className="w-3 h-3 text-emerald-500" />
              <span>Horizon:</span>
            </span>
            <div className={`p-0.5 rounded-xl border flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setSelectedTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTimeframe === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : textSecondary
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setSelectedTimeframe('month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTimeframe === 'month'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : textSecondary
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setSelectedTimeframe('week')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTimeframe === 'week'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : textSecondary
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setSelectedTimeframe('today')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTimeframe === 'today'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : textSecondary
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* EDIT DASHBOARD LAYOUT BUTTON */}
          <button
            type="button"
            onClick={() => setIsLayoutModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Customize dashboard cards arrangement, hide or reorder sections"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Layout</span>
            {layoutConfig.hiddenSections?.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* DYNAMICALLY ORDERED DASHBOARD SECTIONS */}
      {activeSections.map(secId => renderDashboardSection(secId))}

      {/* DASHBOARD LAYOUT CUSTOMIZATION MODAL */}
      <DashboardLayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        layoutConfig={layoutConfig}
        onSaveLayout={(newCfg) => {
          if (onSaveLayoutConfig) onSaveLayoutConfig(newCfg);
        }}
        onResetLayout={() => {
          if (onResetLayoutConfig) onResetLayoutConfig();
        }}
        theme={theme}
      />
    </div>
  );
};
