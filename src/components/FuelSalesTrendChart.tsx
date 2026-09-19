import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Fuel, 
  Droplet, 
  Calendar, 
  Filter, 
  Layers, 
  BarChart2, 
  LineChart as LineChartIcon,
  Sparkles,
  ArrowUpRight,
  MapPin,
  Building2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { AppTheme, StationBalance, StationEntry } from '../types';
import { formatCurrency, formatVolume } from '../utils/formatters';

interface FuelSalesTrendChartProps {
  entries: StationEntry[];
  stationBalances?: StationBalance[];
  theme?: AppTheme;
}

export const FuelSalesTrendChart: React.FC<FuelSalesTrendChartProps> = ({
  entries,
  stationBalances = [],
  theme = 'iphone-dark',
}) => {
  const isLight = theme === 'iphone-light';
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'volume' | 'financial' | 'breakdown'>('volume');

  const availableStations = useMemo(() => {
    const fromBalances = stationBalances.map(s => s.station);
    const fromEntries = entries.map(e => e.station);
    return Array.from(new Set([...fromBalances, ...fromEntries]));
  }, [stationBalances, entries]);

  // Aggregate daily records over the last 30 days
  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Map of date string -> aggregate
    const dayMap: Record<string, {
      date: string;
      displayDate: string;
      petrolSales: number;
      dieselSales: number;
      hiOctaneSales: number;
      totalSales: number;
      revenue: number;
      netProfit: number;
      grossProfit: number;
      [stationKey: string]: any;
    }> = {};

    // Initialize 30 dates so chart is smooth even if some days had no shift logged
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dayMap[iso] = {
        date: iso,
        displayDate: display,
        petrolSales: 0,
        dieselSales: 0,
        hiOctaneSales: 0,
        totalSales: 0,
        revenue: 0,
        netProfit: 0,
        grossProfit: 0,
      };
      availableStations.forEach(st => {
        dayMap[iso][st] = 0;
      });
    }

    // Populate with actual entry logs
    entries.forEach(entry => {
      const dateKey = entry.date.split('T')[0];
      if (!dayMap[dateKey]) {
        // If entry is older than 30 days, skip for this 30-day window
        return;
      }

      if (stationFilter === 'all' || entry.station === stationFilter) {
        dayMap[dateKey].petrolSales += entry.petrolSales || 0;
        dayMap[dateKey].dieselSales += entry.dieselSales || 0;
        dayMap[dateKey].hiOctaneSales += entry.hiOctaneSales || 0;
        dayMap[dateKey].totalSales += (entry.petrolSales || 0) + (entry.dieselSales || 0) + (entry.hiOctaneSales || 0);
        dayMap[dateKey].revenue += entry.revenue || 0;
        dayMap[dateKey].netProfit += entry.netProfit || 0;
        dayMap[dateKey].grossProfit += entry.grossProfit || 0;
      }

      // Track by station for breakdown
      if (dayMap[dateKey][entry.station] !== undefined) {
        dayMap[dateKey][entry.station] += (entry.petrolSales || 0) + (entry.dieselSales || 0);
      }
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, stationFilter, availableStations]);

  // Summary Metrics for the 30-Day Window
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        petrol: acc.petrol + d.petrolSales,
        diesel: acc.diesel + d.dieselSales,
        totalVol: acc.totalVol + d.totalSales,
        revenue: acc.revenue + d.revenue,
        profit: acc.profit + d.netProfit,
      }),
      { petrol: 0, diesel: 0, totalVol: 0, revenue: 0, profit: 0 }
    );
  }, [chartData]);

  // Find peak day
  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.totalSales - a.totalSales)[0];
  }, [chartData]);

  const stationColors: Record<string, string> = {
    'SWAT 1': '#10B981',
    'SWAT 2': '#06B6D4',
    'MARDAN': '#3B82F6',
    'PESHAWAR': '#8B5CF6',
    'ISLAMABAD': '#F59E0B',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 font-sans min-w-[200px]">
          <div className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
            <span>{data.date}</span>
            <span className="text-white">{data.displayDate}</span>
          </div>

          {chartMode === 'volume' && (
            <>
              <div className="flex justify-between items-center text-emerald-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Petrol (Super 92):
                </span>
                <span className="font-mono font-bold">{data.petrolSales.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center text-blue-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Diesel (HSD):
                </span>
                <span className="font-mono font-bold">{data.dieselSales.toLocaleString()} L</span>
              </div>
              <div className="pt-1 border-t border-slate-800 flex justify-between items-center font-bold text-white">
                <span>Total Dispensed:</span>
                <span className="font-mono text-emerald-300">{data.totalSales.toLocaleString()} L</span>
              </div>
            </>
          )}

          {chartMode === 'financial' && (
            <>
              <div className="flex justify-between items-center text-indigo-300">
                <span>Gross Revenue:</span>
                <span className="font-mono font-bold">₨ {data.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>Net Shift Profit:</span>
                <span className="font-mono font-black">₨ {data.netProfit.toLocaleString()}</span>
              </div>
            </>
          )}

          {chartMode === 'breakdown' && (
            <div className="space-y-1">
              {availableStations.map(st => (
                <div key={st} className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stationColors[st] || '#94A3B8' }}
                    />
                    {st}:
                  </span>
                  <span className="font-mono font-bold text-white">
                    {(data[st] || 0).toLocaleString()} L
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/40'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/20 via-blue-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight">
                30-Day Fuel Sales Performance Trend Analysis
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RECHARTS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Comparative volume dispensing, revenue curves and fleet station trajectories
            </p>
          </div>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950/60 border border-inherit text-xs gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('volume')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'volume'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Fuel Volume (L)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('financial')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'financial'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Revenue & Profit</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('breakdown')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chartMode === 'breakdown'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>By Station</span>
          </button>
        </div>
      </div>

      {/* Station Selector Ribbon */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-inherit bg-slate-950/30 text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Station Scope:
        </span>
        <button
          type="button"
          onClick={() => setStationFilter('all')}
          className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
            stationFilter === 'all'
              ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          All 5 Stations Combined
        </button>
        {availableStations.map(st => (
          <button
            key={st}
            type="button"
            onClick={() => setStationFilter(st)}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              stationFilter === st
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="p-4 sm:p-5 pb-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <span className="text-slate-400 text-[11px] font-semibold block mb-0.5">
            30-Day Dispensed Volume
          </span>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            {totals.totalVol.toLocaleString()} <span className="text-xs text-slate-400 font-sans">Liters</span>
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <Fuel className="w-3 h-3" /> Petrol: {totals.petrol.toLocaleString()}L • Diesel: {totals.diesel.toLocaleString()}L
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <span className="text-slate-400 text-[11px] font-semibold block mb-0.5">
            30-Day Net Profit
          </span>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
            ₨ {totals.profit.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Audited after operational overheads
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <span className="text-slate-400 text-[11px] font-semibold block mb-0.5">
            30-Day Gross Turnover
          </span>
          <div className="text-lg sm:text-xl font-mono font-black text-indigo-300">
            ₨ {totals.revenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            All nozzles cash & credit receipts
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800">
          <span className="text-slate-400 text-[11px] font-semibold block mb-0.5">
            Peak Dispensing Day
          </span>
          <div className="text-lg sm:text-xl font-mono font-black text-amber-300">
            {peakDay ? `${peakDay.totalSales.toLocaleString()} L` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {peakDay ? peakDay.date : 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="p-4 sm:p-5 pt-3">
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'volume' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="petrolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dieselGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="petrolSales" 
                  name="Petrol (Super 92)" 
                  stroke="#10B981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#petrolGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="dieselSales" 
                  name="Diesel (HSD)" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#dieselGrad)" 
                />
              </AreaChart>
            ) : chartMode === 'financial' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                  tickFormatter={(val) => `₨${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Gross Revenue (PKR)" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#revenueGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="netProfit" 
                  name="Net Profit (PKR)" 
                  stroke="#10B981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#profitGrad)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }} 
                  axisLine={{ stroke: '#475569' }} 
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                {availableStations.map(st => (
                  <Bar 
                    key={st} 
                    dataKey={st} 
                    name={st} 
                    stackId="stations" 
                    fill={stationColors[st] || '#64748B'} 
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
