import React from 'react';
import { 
  Home, 
  PlusCircle, 
  BarChart3, 
  AlertTriangle, 
  Users, 
  Tag,
  CalendarDays,
  Cloud,
  Activity,
} from 'lucide-react';
import { AppTheme, TabType } from '../types';

interface TabsNavProps {
  currentTab: TabType;
  theme: AppTheme;
  onSelectTab: (tab: TabType) => void;
  auditAlertCount: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  currentTab,
  theme,
  onSelectTab,
  auditAlertCount,
}) => {
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'market_pulse', label: 'Market Pulse', icon: Activity },
    { id: 'entry', label: 'Entry', icon: PlusCircle },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'logs', label: 'Calendar Logs', icon: CalendarDays },
    { 
      id: 'audit', 
      label: 'Audit', 
      icon: AlertTriangle,
      badge: auditAlertCount > 0 ? auditAlertCount : undefined 
    },
    { id: 'partners', label: 'Partners', icon: Users },
    { id: 'rates', label: 'Rates', icon: Tag },
    { id: 'drive', label: 'Google Drive', icon: Cloud },
  ];

  return (
    <>
      {/* Mobile Floating iOS 18 Dock Navigation Bar */}
      <nav
        className={`sm:hidden fixed bottom-2 left-3 right-3 z-40 rounded-3xl backdrop-blur-2xl border transition-all duration-200 shadow-2xl no-print ${
          isLight
            ? theme === 'sandstone-light'
              ? 'bg-[#fdfcf9]/95 border-stone-300 shadow-stone-400/30 text-stone-800'
              : theme === 'nordic-light'
              ? 'bg-white/95 border-zinc-300 shadow-zinc-300/40 text-zinc-800'
              : 'bg-white/95 border-slate-300 shadow-slate-400/40 text-slate-800'
            : 'bg-slate-900/90 border-slate-800 shadow-black/80 text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between py-1.5 px-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-blue-600 font-extrabold scale-105'
                    : isLight
                    ? 'text-slate-500 hover:text-slate-800'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet iOS 18 Segmented Controller Bar */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 pt-3 no-print">
        <div
          className={`flex items-center justify-between p-1.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
            isLight
              ? theme === 'sandstone-light'
                ? 'bg-[#f4efe8]/80 border-stone-300/80 shadow-inner'
                : theme === 'nordic-light'
                ? 'bg-zinc-100/90 border-zinc-300/80 shadow-inner'
                : 'bg-slate-200/80 border-slate-300 shadow-inner'
              : 'bg-slate-900/70 border-slate-800 shadow-inner'
          }`}
        >
          <div className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-white text-blue-600 shadow-md shadow-slate-300/60'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive
                          ? isLight
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-white text-blue-700'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
