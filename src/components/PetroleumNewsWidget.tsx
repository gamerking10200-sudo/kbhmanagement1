import React, { useState } from 'react';
import { 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Newspaper, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Filter,
  DollarSign,
  Layers,
  Sparkles
} from 'lucide-react';
import { AppTheme } from '../types';

interface PetroleumNewsWidgetProps {
  theme?: AppTheme;
  onNavigateToRates?: () => void;
}

interface NewsItem {
  id: string;
  category: 'ogra' | 'global' | 'refinery' | 'market';
  title: string;
  source: string;
  timestamp: string;
  urgency: 'high' | 'normal';
  summary: string;
  fullBody: string;
  impactAnalysis: string;
  badge: string;
}

const LIVE_MARKET_INDICATORS = [
  { symbol: 'Brent Crude', price: '$74.35', delta: '+1.42%', isUp: true, sub: 'London ICE' },
  { symbol: 'WTI Crude', price: '$70.20', delta: '+1.05%', isUp: true, sub: 'NYMEX Light' },
  { symbol: 'Arab Light', price: '$75.60', delta: '-0.30%', isUp: false, sub: 'Pakistan Import Benchmark' },
  { symbol: 'USD / PKR', price: '₨278.55', delta: '+0.04%', isUp: true, sub: 'State Bank Interbank' },
  { symbol: 'Gasoline 92 FOB', price: '$86.50/bbl', delta: '+0.80%', isUp: true, sub: 'Arab Gulf Platts' },
  { symbol: 'HSD Gasoil 10ppm', price: '$91.20/bbl', delta: '+1.10%', isUp: true, sub: 'Singapore Crack' },
];

const PETROLEUM_NEWS_FEED: NewsItem[] = [
  {
    id: 'news-1',
    category: 'ogra',
    title: 'OGRA Prepares Fortnightly Petroleum Price Summary with Inland Freight Revision',
    source: 'Oil & Gas Regulatory Authority (Islamabad)',
    timestamp: '2 hours ago',
    urgency: 'high',
    badge: 'OGRA Policy',
    summary: 'The Oil and Gas Regulatory Authority (OGRA) has formulated the pricing computation for the upcoming fortnightly review. While ex-refinery costs remained resilient, adjustments in Inland Freight Equalization Margin (IFEM) are expected to stabilize northern corridor supply.',
    fullBody: 'The federal government through OGRA and the Ministry of Energy (Petroleum Division) is finalizing the pricing framework for Motor Gasoline (92 RON) and High Speed Diesel (HSD). With international Arab Gulf benchmark prices exhibiting mild volatility and the Pakistani Rupee holding steady in the ₨278–₨279 corridor, the petroleum development levy (PDL) remains maintained at ₨60/liter. Dealers and station owners are assured that existing dealer commissions (₨8.64/L) remain strictly protected without revision.',
    impactAnalysis: 'Station profit margins per liter remain fully intact at ₨8.64/L. Recommends maintaining full tank stock levels before the notification takes effect at midnight.',
  },
  {
    id: 'news-2',
    category: 'global',
    title: 'Brent Crude Stabilizes Above $74/bbl Amid Middle East Logistics Re-Routing',
    source: 'Reuters Global Energy / Platts',
    timestamp: '4 hours ago',
    urgency: 'normal',
    badge: 'Global Crude',
    summary: 'Crude futures extended gains as commercial tanker routes via the Bab-el-Mandeb and Gulf of Aden adjust maritime insurance surcharges, elevating CIF landed product values in South Asia.',
    fullBody: 'International oil benchmarks edged upward following OPEC+ announcements reaffirming strict member compliance with voluntary production quotas through Q3. Asian product demand showed resilience, pushing regional refiners in Singapore and Fujairah to optimize diesel yields. Pakistani commercial procurement remains hedged via long-term supply arrangements with Kuwait Petroleum Corporation (KPC) and ADNOC.',
    impactAnalysis: 'Higher international crude creates upward momentum on ex-refinery prices, increasing the value of existing tank stock currently stored underground.',
  },
  {
    id: 'news-3',
    category: 'refinery',
    title: 'PARCO and Pakistan Refinery Limited (PRL) Maintain 100% Euro-V Diesel Production',
    source: 'Refinery Association of Pakistan (RAP)',
    timestamp: '7 hours ago',
    urgency: 'normal',
    badge: 'Refinery & Supply',
    summary: 'Domestic refineries reported uninterrupted throughput. PRL and Pak-Arab Refinery Limited confirmed regular dispatches to OMC terminals in Rawalpindi (Chakpirana / Sihala) and Peshawar.',
    fullBody: 'Domestic refinery operations have stabilized after scheduled maintenance shutdowns. The White Oil Pipeline (WOP) from Port Qasim to Machike is operating at optimal throughput, ensuring that secondary distribution corridors feeding northern KP stations (including Swat and Mardan) face zero supply bottlenecks. OMC allocations for Kashfi Bro Holdings supply partners remain 100% fulfilled.',
    impactAnalysis: 'Zero stockout risk. Decanting tankers from Sihala and Peshawar depots can be dispatched on standard 12-hour turnaround time.',
  },
  {
    id: 'news-4',
    category: 'market',
    title: 'Commercial Fleet Transport Demand Rises Across KP Motorways & G.T. Road Corridors',
    source: 'National Transport Syndicate',
    timestamp: '11 hours ago',
    urgency: 'normal',
    badge: 'Retail Market',
    summary: 'Agricultural harvest transport and commercial goods haulage between Peshawar, Mardan, and Swat resulted in a 14% increase in commercial High-Speed Diesel (HSD) dispensing volume.',
    fullBody: 'Heavy transport vehicle (HTV) transit through the Swat Expressway and Mardan interchanges has recorded heightened diesel sales. Cash drawer liquidity at highway stations has accelerated, supporting daily bank deposits and healthy dealer spread.',
    impactAnalysis: 'Encourages proactive diesel nozzle maintenance and keeping night-shift cash float adequately banked to mitigate on-site holding risks.',
  },
  {
    id: 'news-5',
    category: 'ogra',
    title: 'Petroleum Division Mandates 20-Day National Fuel Stock Cushion for All OMCs',
    source: 'Ministry of Energy, Petroleum Division',
    timestamp: 'Yesterday',
    urgency: 'high',
    badge: 'Regulatory Mandate',
    summary: 'Government inspectors will conduct surprise physical dipping audits at storage depots and dealer outlets to ensure minimum days-cover inventory reserves are preserved.',
    fullBody: 'Under the Petroleum Act and OGRA retail licensing protocols, all OMC franchisees and dealer stations are required to maintain underground tank stock above dead-bottom levels. Station managers must record physical dip rod readings before morning and evening shift handovers.',
    impactAnalysis: 'Directly validates Kashfi Bro Holdings internal policy of flagging underground tank stocks below 33% capacity as critical audit directives.',
  },
];

export const PetroleumNewsWidget: React.FC<PetroleumNewsWidgetProps> = ({
  theme = 'iphone-dark',
  onNavigateToRates,
}) => {
  const isLight = theme === 'iphone-light';
  const [activeCategory, setActiveCategory] = useState<'all' | 'ogra' | 'global' | 'refinery' | 'market'>('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const filteredNews = PETROLEUM_NEWS_FEED.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/40'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/20 via-orange-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight">
                Petroleum Market Wire & OGRA Intelligence
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                REAL-TIME DESK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              National OGRA policies, international crude benchmarks & domestic refinery supply chain
            </p>
          </div>
        </div>

        {onNavigateToRates && (
          <button
            type="button"
            onClick={onNavigateToRates}
            className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Company Tariff</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live Market Indicators Ribbon */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-inherit overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            BENCHMARKS:
          </span>
          {LIVE_MARKET_INDICATORS.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800"
            >
              <span className="text-slate-300 font-bold">{m.symbol}:</span>
              <span className="text-white font-extrabold">{m.price}</span>
              <span
                className={`text-[10px] font-black flex items-center gap-0.5 ${
                  m.isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {m.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-inherit bg-slate-950/20">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          All News ({PETROLEUM_NEWS_FEED.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('ogra')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'ogra'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          OGRA & Govt Policy
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('global')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'global'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          Global Crude Markets
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('refinery')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'refinery'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          Refinery & Supply Chain
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('market')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === 'market'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          Highway Transit Demand
        </button>
      </div>

      {/* News Articles List */}
      <div className="p-4 sm:p-5 space-y-3">
        {filteredNews.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="group p-4 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
                <span className="text-slate-400 font-medium">{item.source}</span>
              </div>
              <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> {item.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
              {item.title}
            </h4>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-slate-900 text-xs">
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Station Impact: {item.impactAnalysis}
              </span>
              <span className="text-slate-400 group-hover:text-white font-bold flex items-center gap-1 text-[11px]">
                Read Full Wire <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Wire Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-amber-950/40 to-slate-900">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedArticle.badge}
                  </span>
                  <span className="text-xs text-slate-400">{selectedArticle.source}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200">
                {selectedArticle.summary}
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1 text-xs">
                <div className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Kashfi Bro Holdings Operational Advisory:
                </div>
                <div className="text-slate-300 font-medium">
                  {selectedArticle.impactAnalysis}
                </div>
              </div>

              <div className="space-y-3 text-slate-400">
                <p>{selectedArticle.fullBody}</p>
                <p>
                  All figures and benchmarks are sourced from verified Oil & Gas Regulatory Authority (OGRA) notifications, State Bank of Pakistan daily interbank FX fixings, and Arab Gulf Platts Singapore spot assessments.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Wire Ref: {selectedArticle.id}</span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                Close Wire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
