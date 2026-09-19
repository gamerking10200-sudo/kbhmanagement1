import React, { useState } from 'react';
import { 
  Sliders, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Check, 
  LayoutGrid, 
  Fuel, 
  DollarSign, 
  AlertTriangle, 
  Ruler, 
  Globe2, 
  Layers
} from 'lucide-react';
import { AppTheme, DashboardLayoutConfig, DashboardSectionId } from '../types';

interface DashboardLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutConfig: DashboardLayoutConfig;
  onSaveLayout: (newConfig: DashboardLayoutConfig) => void;
  onResetLayout: () => void;
  theme?: AppTheme;
}

const SECTION_METADATA: Record<
  DashboardSectionId, 
  { label: string; description: string; icon: React.FC<{ className?: string }> }
> = {
  kpi_banner: {
    label: 'Executive Financial Performance Hero Banner',
    description: 'Displays cumulative turnover, fuel volume, and net profit with live sparkline trends',
    icon: DollarSign,
  },
  stats_grid: {
    label: 'Fuel Volume, Till Cash & Network Status Grid',
    description: '4-column KPI cards for Liters sold, total margin, cash float, and active dispensers',
    icon: Fuel,
  },
  ai_alerts: {
    label: 'AI Operational Anomaly & Margin Sentinel',
    description: 'Automated detection of nozzle variances, margin compression, and sudden drops',
    icon: AlertTriangle,
  },
  dip_test_widget: {
    label: 'Physical Dip Test & Tank Calibration Schedule',
    description: 'Twice-daily brass dip inspection tracker, water ingress checks & calibration variances',
    icon: Ruler,
  },
  market_pulse: {
    label: 'Live Petroleum Market Pulse & Intelligence Snapshot',
    description: 'Real-time Brent crude, OGRA dealer margin updates, and FX exchange rates',
    icon: Globe2,
  },
  station_balances: {
    label: 'Station-Wise Balances, Till Cash & Capital Float',
    description: 'Detailed per-station breakdown of fuel stocks, cash in till, and allocated capital',
    icon: Layers,
  },
  tank_stocks: {
    label: 'Underground Fuel Tank Stock Levels & Decanting Thresholds',
    description: 'Visual tank capacity progress bars with critical replenishment decanting triggers',
    icon: LayoutGrid,
  },
};

export const DashboardLayoutModal: React.FC<DashboardLayoutModalProps> = ({
  isOpen,
  onClose,
  layoutConfig,
  onSaveLayout,
  onResetLayout,
  theme = 'iphone-dark',
}) => {
  const isLight = theme === 'iphone-light';

  const [order, setOrder] = useState<DashboardSectionId[]>([...layoutConfig.sectionsOrder]);
  const [hidden, setHidden] = useState<DashboardSectionId[]>([...layoutConfig.hiddenSections]);
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'executive'>(layoutConfig.density || 'comfortable');

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setOrder(newOrder);
  };

  const handleToggleVisibility = (id: DashboardSectionId) => {
    if (hidden.includes(id)) {
      setHidden(hidden.filter(s => s !== id));
    } else {
      // Prevent hiding all sections
      if (hidden.length >= order.length - 1) {
        alert('At least one section must remain visible on the dashboard.');
        return;
      }
      setHidden([...hidden, id]);
    }
  };

  const handleSave = () => {
    onSaveLayout({
      sectionsOrder: order,
      hiddenSections: hidden,
      density,
    });
    onClose();
  };

  const handleReset = () => {
    onResetLayout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-950/60'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Customize Executive Dashboard Layout
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reorder modules, toggle visibility, and adjust display density
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

        <div className="p-5 space-y-5 text-xs">
          {/* Display Density Switcher */}
          <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div>
              <div className="font-extrabold text-xs">Display Density &amp; Spacing</div>
              <div className="text-[11px] text-slate-400">Adjust layout tightness and component margin scale</div>
            </div>

            <div className={`flex items-center p-1 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
              {(['comfortable', 'compact', 'executive'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    density === d
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Section Ordering & Visibility List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>Section Module ({order.length} items)</span>
              <span>Position &amp; Visibility</span>
            </div>

            <div className="space-y-2">
              {order.map((secId, idx) => {
                const meta = SECTION_METADATA[secId];
                const isHidden = hidden.includes(secId);
                const IconComponent = meta?.icon || LayoutGrid;

                return (
                  <div
                    key={secId}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isHidden 
                        ? isLight ? 'bg-slate-100/60 border-slate-200 opacity-60' : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                        : isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                        <IconComponent className="w-4 h-4 text-blue-400" />
                      </div>

                      <div>
                        <div className="font-extrabold text-xs flex items-center gap-2">
                          <span>{meta?.label || secId}</span>
                          {isHidden && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {meta?.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          idx === 0
                            ? 'opacity-30 cursor-not-allowed border-transparent'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === order.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          idx === order.length - 1
                            ? 'opacity-30 cursor-not-allowed border-transparent'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(secId)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isHidden
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title={isHidden ? 'Show Section' : 'Hide Section'}
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default Order</span>
            </button>

            <div className="flex items-center gap-2">
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
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Layout Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
