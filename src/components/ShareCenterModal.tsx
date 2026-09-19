import React, { useState } from 'react';
import { 
  Share2, 
  X, 
  MessageSquare, 
  Mail, 
  Download, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  ExternalLink,
  ShieldCheck,
  Fuel
} from 'lucide-react';
import { 
  AuditRecord, 
  FuelRates, 
  Partner, 
  PartnerWithdrawal, 
  StationBalance, 
  StationEntry, 
  UserSession 
} from '../types';
import { formatCurrency, formatVolume, formatPercent, formatDate } from '../utils/formatters';
import { downloadGraphicalHtmlFile, downloadExcelMacroWorkbook } from '../utils/exportFiles';

interface ShareCenterModalProps {
  isOpen?: boolean;
  onClose: () => void;
  session?: UserSession;
  entries?: StationEntry[];
  partners?: Partner[];
  withdrawals?: PartnerWithdrawal[];
  stationBalances?: StationBalance[];
  rates?: FuelRates;
  audits?: AuditRecord[];
  onOpenPrintModal?: () => void;
  onImportBackup?: (json: string) => void;
}

export const ShareCenterModal: React.FC<ShareCenterModalProps> = ({
  isOpen = true,
  onClose,
  session,
  entries = [],
  partners = [],
  withdrawals = [],
  stationBalances = [],
  rates,
  audits = [],
  onOpenPrintModal,
  onImportBackup,
}) => {
  const [copied, setCopied] = useState(false);

  if (isOpen === false) return null;

  // Aggregate metrics
  const totalNet = entries.reduce((a, e) => a + e.netProfit, 0);
  const totalGross = entries.reduce((a, e) => a + e.grossProfit, 0);
  const totalExpenses = entries.reduce((a, e) => a + e.totalExpenses, 0);
  const totalRevenue = entries.reduce((a, e) => a + e.revenue, 0);
  const totalPetrol = entries.reduce((a, e) => a + e.petrolSales, 0);
  const totalDiesel = entries.reduce((a, e) => a + e.dieselSales, 0);

  const totalInvested = partners.reduce((a, p) => a + p.investment, 0);
  const totalWithdrawn = withdrawals.reduce((a, w) => a + w.amount, 0);

  const totalStationCash = stationBalances.reduce((a, s) => a + s.cashOnHand, 0);
  const totalStationInvestment = stationBalances.reduce((a, s) => a + s.allocatedInvestment, 0);

  const pendingAudits = audits.filter(a => a.status === 'Pending' || a.status === 'Audit Ordered');

  // Build high-density executive text summary
  const generateTextReport = () => {
    const pSaleRate = rates?.psr || 375;
    const pPurRate = rates?.ppr || 355;
    const dSaleRate = rates?.dsr || 374;
    const dPurRate = rates?.dpr || 353.5;

    const lines = [
      `⛽ *KASHFI BRO HOLDINGS — EXECUTIVE STATUS REPORT*`,
      `📅 Date: ${new Date().toLocaleDateString('en-GB')} | Time: ${new Date().toLocaleTimeString('en-GB')}`,
      `👤 Prepared By: ${session?.name || 'CEO Jalees'} (${session?.label || 'Managing Partner'})`,
      `───────────────────────────────`,
      `📊 *EXECUTIVE FINANCIAL SUMMARY*`,
      `• Total Net Profit: ${formatCurrency(totalNet)}`,
      `• Total Gross Profit: ${formatCurrency(totalGross)}`,
      `• Operating Expenses: ${formatCurrency(totalExpenses)}`,
      `• Total Fuel Revenue: ${formatCurrency(totalRevenue)}`,
      `• Petrol Volume Sold: ${formatVolume(totalPetrol)}`,
      `• Diesel Volume Sold: ${formatVolume(totalDiesel)}`,
      `───────────────────────────────`,
      `🏦 *STATION CASH & INVESTMENT BALANCES*`,
      ...stationBalances.map(st => {
        return `• ${st.station}: Cash ₨ ${st.cashOnHand.toLocaleString()} | Invested ₨ ${st.allocatedInvestment.toLocaleString()} | Stock: P ${st.petrolStock}L, D ${st.dieselStock}L (Mgr: ${st.managerInCharge})`;
      }),
      `• TOTAL Station Cash Float: ${formatCurrency(totalStationCash)}`,
      `• TOTAL Station Investment: ${formatCurrency(totalStationInvestment)}`,
      `───────────────────────────────`,
      `👥 *PARTNER BALANCES & WITHDRAWALS*`,
      ...partners.map(p => {
        const shareFraction = totalInvested > 0 ? p.investment / totalInvested : 0;
        const profitShare = totalNet * shareFraction;
        const pWithdrawals = withdrawals.filter(w => w.partnerId === p.id).reduce((sum, w) => sum + w.amount, 0);
        const balanceProfit = profitShare - pWithdrawals;
        return `• ${p.name} (${(shareFraction * 100).toFixed(1)}%): Allocated ${formatCurrency(profitShare)} | Withdrawn ${formatCurrency(pWithdrawals)} | Balance: ${formatCurrency(balanceProfit)}`;
      }),
      `───────────────────────────────`,
      `⚠️ *ACTIVE AUDITS & WARNINGS (${pendingAudits.length})*`,
      ...(pendingAudits.length > 0
        ? pendingAudits.map(a => `• [${a.status}] ${a.station}: ${a.title} (${a.severity.toUpperCase()})`)
        : [`• All stations compliant — Zero open audit alerts.`]),
      `───────────────────────────────`,
      `🔒 *CURRENT BENCHMARK RATES*`,
      `• Petrol: Sale ₨ ${pSaleRate}/L | Purchase ₨ ${pPurRate}/L (Margin ₨ ${(pSaleRate - pPurRate).toFixed(2)}/L)`,
      `• Diesel: Sale ₨ ${dSaleRate}/L | Purchase ₨ ${dPurRate}/L (Margin ₨ ${(dSaleRate - dPurRate).toFixed(2)}/L)`,
      `───────────────────────────────`,
      `Verified by CEO/Admin Jalees • Kashfi Bro Holdings`,
    ];
    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = generateTextReport();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`KBH Executive Fuel Report - ${new Date().toLocaleDateString('en-GB')}`);
    const body = encodeURIComponent(generateTextReport());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    const text = generateTextReport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kashfi Bro Holdings - Executive Fuel Report',
          text,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = () => {
    const text = generateTextReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const data = {
      app: 'Kashfi Bro Holdings - Fuel Management System',
      generatedDate: new Date().toISOString(),
      generatedBy: session?.name || 'CEO Jalees',
      summary: {
        totalNetProfit: totalNet,
        totalGrossProfit: totalGross,
        totalExpenses,
        totalRevenue,
        totalStationCash,
        totalStationInvestment,
        totalInvestedCapital: totalInvested,
        totalWithdrawals: totalWithdrawn,
      },
      stationBalances,
      partners: partners.map(p => {
        const share = totalInvested > 0 ? p.investment / totalInvested : 0;
        const profit = totalNet * share;
        const wTotal = withdrawals.filter(w => w.partnerId === p.id).reduce((s, w) => s + w.amount, 0);
        return {
          ...p,
          sharePercentage: (share * 100).toFixed(2) + '%',
          profitShare: profit,
          totalWithdrawn: wTotal,
          balanceProfit: profit - wTotal,
        };
      }),
      withdrawals,
      entries,
      audits,
      currentRates: rates,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KBH_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate a standalone, 1-page graphical HTML file
  const handleDownloadStandaloneHTML = () => {
    downloadGraphicalHtmlFile({
      session,
      entries,
      stationBalances,
      partners,
      withdrawals,
      rates,
      audits,
    });
  };

  // Generate Excel macro-enabled workbook (.xlsm)
  const handleDownloadExcelMacro = () => {
    downloadExcelMacroWorkbook({
      session,
      entries,
      stationBalances,
      partners,
      withdrawals,
      rates,
      audits,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-5 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Executive Share & Export Center</h2>
              <p className="text-xs text-slate-400">CEO / Admin Jalees Broadcast & Distribution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Quick Share Buttons Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              One-Click Social & Message Broadcast
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Share via WhatsApp</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Share via Email</span>
              </button>

              {/* Native Device Share / Copy */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Device Share Menu</span>
              </button>
            </div>
          </div>

          {/* Download & Storage Options */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Storage, Offline Documents & PDF
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Standalone HTML File */}
              <button
                type="button"
                onClick={handleDownloadStandaloneHTML}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white transition-all hover:border-slate-600 cursor-pointer"
              >
                <FileText className="w-6 h-6 text-amber-400 mb-1.5" />
                <span className="text-xs font-bold">1-Page HTML</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Standalone doc</span>
              </button>

              {/* Excel Macro .XLSM */}
              <button
                type="button"
                onClick={handleDownloadExcelMacro}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-teal-500/30 text-white transition-all hover:border-teal-400 cursor-pointer"
              >
                <Download className="w-6 h-6 text-teal-400 mb-1.5" />
                <span className="text-xs font-bold">Excel .XLSM</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Macro workbook</span>
              </button>

              {/* JSON Backup */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white transition-all hover:border-slate-600 cursor-pointer"
              >
                <Download className="w-6 h-6 text-blue-400 mb-1.5" />
                <span className="text-xs font-bold">JSON Backup</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Raw data file</span>
              </button>

              {/* PDF Print */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintModal?.();
                }}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white transition-all hover:border-slate-600 cursor-pointer"
              >
                <Printer className="w-6 h-6 text-emerald-400 mb-1.5" />
                <span className="text-xs font-bold">Print / PDF</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Printable layout</span>
              </button>
            </div>
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Formatted Text Briefing Preview
              </h3>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap select-all">
              {generateTextReport()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
