import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Scale,
  Fuel,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { StationEntry, StationBalance, AppTheme, DashboardAlertItem, DashboardAlertsResponse } from '../types';
import { fetchAiDashboardAlerts, runStatisticalAnomalyDetection } from '../utils/aiAlertsEngine';

interface DashboardAlertsProps {
  entries: StationEntry[];
  stationBalances: StationBalance[];
  theme?: AppTheme;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  entries,
  stationBalances,
  theme = 'iphone-dark',
  onNavigateToTab,
}) => {
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  const [data, setData] = useState<DashboardAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sales_dip' | 'inventory_drop' | 'margin_mismatch' | 'critical'>('all');
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('Just now');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load alerts
  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAiDashboardAlerts(entries, stationBalances);
      setData(res);
      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load AI alerts:', err);
      // Fallback
      setData(runStatisticalAnomalyDetection(entries, stationBalances));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [entries.length, stationBalances]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => ({ ...prev, [id]: true }));
  };

  const handleRestoreAll = () => {
    setDismissedIds({});
  };

  const rawAlerts = data?.alerts || [];
  const activeAlerts = rawAlerts.filter(a => !dismissedIds[a.id]);

  // Filtered alerts
  const filteredAlerts = activeAlerts.filter(a => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return a.severity === 'critical';
    return a.category === activeFilter;
  });

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const salesDipsCount = activeAlerts.filter(a => a.category === 'sales_dip').length;
  const inventoryDropsCount = activeAlerts.filter(a => a.category === 'inventory_drop').length;
  const marginMismatchesCount = activeAlerts.filter(a => a.category === 'margin_mismatch').length;

  // Theming classes
  const containerBg = isLight
    ? theme === 'sandstone-light'
      ? 'bg-[#fcfbf9] border-stone-200/90 shadow-sm'
      : theme === 'nordic-light'
      ? 'bg-white border-zinc-200 shadow-sm'
      : 'bg-white border-slate-200 shadow-sm'
    : 'bg-slate-900/90 border-slate-800/80 shadow-xl';

  const textPrimary = isLight ? (theme === 'sandstone-light' ? 'text-stone-900' : 'text-slate-900') : 'text-white';
  const textSecondary = isLight ? 'text-slate-600' : 'text-slate-400';
  const boxBg = isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/60 border-slate-800/80';

  return (
    <div className={`${containerBg} rounded-3xl p-5 sm:p-6 border relative overflow-hidden space-y-4`}>
      {/* Decorative ambient glow */}
      {!isLight && (
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
      )}

      {/* Header Row */}
      <div className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!isCollapsed ? 'border-b border-slate-800/30 pb-4' : ''}`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
            <div className={`w-full h-full ${isLight ? 'bg-indigo-50' : 'bg-slate-900'} rounded-[14px] flex items-center justify-center`}>
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-black ${textPrimary} tracking-tight`}>
                AI Anomaly & Operational Audit
              </h2>
              {criticalCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  {criticalCount} CRITICAL FLAGS
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  ALL TOLERANCES STABLE
                </span>
              )}

              {data?.aiPowered && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-black border border-indigo-500/30 hidden sm:inline-flex items-center gap-1">
                  GEMINI 3.8 FLASH
                </span>
              )}
            </div>
            <p className={`text-xs ${textSecondary} mt-0.5`}>
              Automated shift analysis detecting sales dips, tank runout hazards & margin compression
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {Object.keys(dismissedIds).length > 0 && (
            <button
              type="button"
              onClick={handleRestoreAll}
              className={`text-[11px] font-semibold ${textSecondary} px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              Reset Dismissed ({Object.keys(dismissedIds).length})
            </button>
          )}

          <button
            type="button"
            onClick={loadAlerts}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer disabled:opacity-50 ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40'
            }`}
            title="Re-run AI anomaly parsing on latest station entries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{isLoading ? 'Auditing...' : 'Re-run'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isCollapsed ? (
              <>
                <span>Expand Details ({activeAlerts.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* When Collapsed: Smart compact ticker summary */}
      {isCollapsed && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${textPrimary}`}>Quick Audit Summary:</span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {activeAlerts.length} Total Anomalies
            </span>
            {salesDipsCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {salesDipsCount} Sales Dips
              </span>
            )}
            {inventoryDropsCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {inventoryDropsCount} Tank Drops
              </span>
            )}
            {marginMismatchesCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {marginMismatchesCount} Margin Mismatches
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect All Diagnostic Cards</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Content View */}
      {!isCollapsed && (
        <>
          {/* KPI Chips Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Total Anomalies */}
            <div className={`${boxBg} rounded-2xl p-3 flex items-center justify-between border`}>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Anomalies</div>
                <div className={`text-xl font-extrabold ${textPrimary} mt-0.5`}>{activeAlerts.length}</div>
              </div>
              <div className={`w-8 h-8 rounded-xl ${isLight ? 'bg-slate-200/80 text-slate-700' : 'bg-slate-800 text-slate-300'} flex items-center justify-center`}>
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Critical Flags */}
            <div className={`${boxBg} rounded-2xl p-3 flex items-center justify-between border`}>
              <div>
                <div className="text-[10px] text-rose-500 font-semibold uppercase">Critical Severity</div>
                <div className="text-xl font-extrabold text-rose-500 mt-0.5">{criticalCount}</div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            {/* Sales Dips */}
            <div className={`${boxBg} rounded-2xl p-3 flex items-center justify-between border`}>
              <div>
                <div className="text-[10px] text-amber-500 font-semibold uppercase">Sales Dips</div>
                <div className="text-xl font-extrabold text-amber-500 mt-0.5">{salesDipsCount}</div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            {/* Margin Mismatches */}
            <div className={`${boxBg} rounded-2xl p-3 flex items-center justify-between border`}>
              <div>
                <div className="text-[10px] text-purple-500 font-semibold uppercase">Margin Mismatches</div>
                <div className="text-xl font-extrabold text-purple-500 mt-0.5">{marginMismatchesCount}</div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Anomalies ({activeAlerts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('sales_dip')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'sales_dip'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Sales Dips ({salesDipsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('inventory_drop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'inventory_drop'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              Tank Drops ({inventoryDropsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('margin_mismatch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'margin_mismatch'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Margin Mismatches ({marginMismatchesCount})
            </button>

            {criticalCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'critical'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Critical Only ({criticalCount})
              </button>
            )}
          </div>

          {/* Alerts Feed */}
          <div className="space-y-3">
            {isLoading && filteredAlerts.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${boxBg} flex flex-col items-center justify-center space-y-3`}>
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <div className={`text-sm font-bold ${textPrimary}`}>AI Engine Parsing Shift Entries & Margins...</div>
                <div className="text-xs text-slate-500 max-w-sm">
                  Calculating statistical moving averages across Swat, Abbottabad, Haripur, and Charsadda
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className={`p-6 text-center rounded-2xl border ${isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-950/40 border-emerald-900/30'} flex flex-col items-center justify-center space-y-2`}>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
                  No Operational Anomalies in Selected Filter
                </div>
                <div className="text-xs text-slate-500 max-w-md">
                  Station dispensing rates, tank replenishment curves, and fuel profit margins are running within calibrated tolerance bands.
                </div>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';

                const cardStyle = isLight
                  ? isCritical
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                    : isWarning
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  : isCritical
                  ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950 border-rose-800/50 hover:border-rose-600'
                  : isWarning
                  ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-amber-800/40 hover:border-amber-600/80'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700';

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-4 sm:p-5 transition-all border relative overflow-hidden group ${cardStyle}`}
                  >
                    {/* Left Accent Bar */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                    />

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pl-2">
                      <div className="space-y-2 flex-1">
                        {/* Header Chips */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                                : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {alert.severity}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                            isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-white'
                          }`}>
                            {alert.station}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {alert.date}
                          </span>

                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 font-semibold capitalize">
                            {alert.category.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Alert Title */}
                        <h3 className={`text-sm sm:text-base font-bold ${textPrimary} group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors`}>
                          {alert.title}
                        </h3>

                        {/* Comparison Pill Matrix */}
                        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl border text-xs ${
                          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
                        }`}>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium">Observed Value</div>
                            <div className={`font-extrabold ${textPrimary} font-mono mt-0.5`}>
                              {alert.currentValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium">Historic Baseline</div>
                            <div className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'} font-mono mt-0.5`}>
                              {alert.historicAverage}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium">Variance Spread</div>
                            <div
                              className={`font-black font-mono mt-0.5 ${
                                alert.variancePercentage < 0 ? 'text-rose-500' : 'text-emerald-500'
                              }`}
                            >
                              {alert.variancePercentage > 0 ? '+' : ''}
                              {alert.variancePercentage}%
                            </div>
                          </div>
                        </div>

                        {/* Diagnostic Narrative */}
                        <div className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'} leading-relaxed space-y-1.5 pt-1`}>
                          <p>
                            <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>Observation: </strong>
                            {alert.observation}
                          </p>
                          <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                            <strong className="text-indigo-600 dark:text-indigo-300">AI Root Cause Diagnostic: </strong>
                            {alert.probableRootCause}
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-300 font-medium">
                            <strong>Actionable Recommendation: </strong>
                            {alert.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Actions Column */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 border-slate-800/40 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(alert.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                          title="Acknowledge and hide this alert"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {alert.actionType === 'rates' ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('rates')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                          >
                            <span>Reconcile Rates</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : alert.actionType === 'entry' ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('entry')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                          >
                            <span>Inspect Tanks</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('logs')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
                          >
                            <span>Audit Logs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className={`flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-slate-800/60'
          } gap-2`}>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                AI Anomaly Engine continuously audits shift totals against moving 30-day baselines and OGRA benchmarks.
              </span>
            </div>
            <div className="font-mono text-slate-400">
              Last checked: {lastCheckedTime}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
