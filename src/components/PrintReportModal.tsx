import React, { useState } from 'react';
import { Printer, X, Download, FileSpreadsheet, FileCode, CheckCircle2, ShieldCheck, Sparkles, CloudUpload } from 'lucide-react';
import { 
  AuditRecord, 
  BankAccount,
  BankDepositRecord,
  CreditClientLoan,
  FuelRates, 
  Partner, 
  PartnerWithdrawal, 
  StationBalance, 
  StationEntry, 
  UserSession 
} from '../types';
import { formatCurrency, formatVolume, formatPercent, formatDate } from '../utils/formatters';
import { 
  downloadGraphicalHtmlFile, 
  downloadExcelWorkbook, 
  downloadExcelMacroWorkbook,
  triggerBrowserPrint,
  generatePrintableHtmlContent
} from '../utils/exportFiles';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { GoogleDriveService } from '../services/googleDrive';

interface PrintReportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  session?: UserSession;
  entries?: StationEntry[];
  partners?: Partner[];
  withdrawals?: PartnerWithdrawal[];
  stationBalances?: StationBalance[];
  rates?: FuelRates;
  audits?: AuditRecord[];
  bankAccounts?: BankAccount[];
  bankDeposits?: BankDepositRecord[];
  creditLoans?: CreditClientLoan[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen = true,
  onClose,
  session,
  entries = [],
  partners = [],
  withdrawals = [],
  stationBalances = [],
  rates,
  audits = [],
  bankAccounts = [],
  bankDeposits = [],
  creditLoans = [],
}) => {
  const [reportType, setReportType] = useState<'essential-onepage' | 'financial' | 'partners' | 'stations' | 'audits'>('essential-onepage');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (isOpen === false) return null;

  const totalNet = entries.reduce((a, e) => a + e.netProfit, 0);
  const totalGross = entries.reduce((a, e) => a + e.grossProfit, 0);
  const totalExpenses = entries.reduce((a, e) => a + e.totalExpenses, 0);
  const totalRevenue = entries.reduce((a, e) => a + e.revenue, 0);
  const totalPetrol = entries.reduce((a, e) => a + e.petrolSales, 0);
  const totalDiesel = entries.reduce((a, e) => a + e.dieselSales, 0);
  const totalHiOctane = entries.reduce((a, e) => a + (e.hiOctaneSales || 0), 0);
  const totalLiters = totalPetrol + totalDiesel + totalHiOctane;

  const totalInvested = partners.reduce((a, p) => a + p.investment, 0);
  const totalWithdrawn = withdrawals.reduce((a, w) => a + w.amount, 0);

  const totalStationCash = stationBalances.reduce((a, s) => a + s.cashOnHand, 0);
  const totalStationInvest = stationBalances.reduce((a, s) => a + s.allocatedInvestment, 0);
  const activeStations = stationBalances.filter(s => s.status === 'Active');

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    try {
      triggerBrowserPrint({
        session,
        entries,
        stationBalances,
        partners,
        withdrawals,
        rates,
        audits,
        bankAccounts,
        bankDeposits,
        creditLoans,
        reportDate: todayStr,
      });
      setDownloadSuccess('Print / PDF Dialogue Triggered!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  const handleDownloadHtml = () => {
    downloadGraphicalHtmlFile({
      session,
      entries,
      stationBalances,
      partners,
      withdrawals,
      rates,
      audits,
      bankAccounts,
      bankDeposits,
      creditLoans,
      reportDate: todayStr,
    });
    setDownloadSuccess('HTML File Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadXlsx = () => {
    downloadExcelWorkbook({
      session,
      entries,
      stationBalances,
      partners,
      withdrawals,
      rates,
      audits,
      bankAccounts,
      bankDeposits,
      creditLoans,
      reportDate: todayStr,
    }, 'xlsx');
    setDownloadSuccess('.XLSX Standard Excel Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadXlsm = () => {
    downloadExcelMacroWorkbook({
      session,
      entries,
      stationBalances,
      partners,
      withdrawals,
      rates,
      audits,
      bankAccounts,
      bankDeposits,
      creditLoans,
      reportDate: todayStr,
    });
    setDownloadSuccess('.XLSM Macro Excel Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleSaveToDrive = async () => {
    try {
      let token = await getAccessToken();
      if (!token) {
        const signin = await googleSignIn();
        token = signin?.accessToken || null;
      }
      if (!token) {
        throw new Error('Google Drive authorization required.');
      }

      const folderId = await GoogleDriveService.getOrCreateAppFolder(token);
      const htmlContent = generatePrintableHtmlContent(
        {
          session,
          entries,
          stationBalances,
          partners,
          withdrawals,
          bankAccounts,
          bankDeposits,
          creditLoans,
          audits,
          rates,
        },
        'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT'
      );

      const fileName = `Kashfi_Holdings_Executive_Report_${todayStr}.html`;
      await GoogleDriveService.uploadFile(token, fileName, htmlContent, 'text/html', folderId);

      setDownloadSuccess('Saved to Google Drive!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Failed to save to Google Drive');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header (hidden in print) */}
        <div className="no-print p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Print &amp; File Export Center</h2>
                {downloadSuccess && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold animate-pulse">
                    {downloadSuccess}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Official Statements • Multi-Sheet .XLSX / .XLSM • Standalone Printable HTML</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Standard .XLSX Download */}
            <button
              type="button"
              onClick={handleDownloadXlsx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              title="Download Standard Microsoft Excel Workbook (.XLSX)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download .XLSX</span>
            </button>

            {/* Macro-Enabled .XLSM Download */}
            <button
              type="button"
              onClick={handleDownloadXlsm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              title="Download Macro-Enabled Excel Workbook (.XLSM)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download .XLSM</span>
            </button>

            {/* Standalone HTML File */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Download Standalone 1-Page Offline HTML Document"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML File</span>
            </button>

            {/* Save to Google Drive */}
            <button
              type="button"
              onClick={handleSaveToDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              title="Save report directly into your Google Drive petroleum folder"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Save to Drive</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              title="Open Clean Isolated Print Preview & Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection (hidden in print) */}
        <div className="no-print px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex gap-2 overflow-x-auto">
          {[
            { id: 'essential-onepage', label: '★ 1-Page Essential Brief (Recommended)' },
            { id: 'financial', label: 'Financial Balance Sheet' },
            { id: 'partners', label: 'Partner Profit & Equity' },
            { id: 'stations', label: 'Station Cash & Fuel Stocks' },
            { id: 'audits', label: 'Audits & Action Directives' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                reportType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-slate-900 print:p-0">
          
          {/* TAB 1: 1-PAGE ESSENTIAL GRAPHICAL BRIEF (Guaranteed to fit 1 page) */}
          {reportType === 'essential-onepage' && (
            <div className="space-y-3.5 text-[11px] max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="border-b-2 border-blue-600 pb-2.5 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase">
                    Kashfi Bro Holdings
                  </h1>
                  <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-1">
                    Executive Financial & Operations Brief • 1-Page Summary
                  </p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-600">
                  <div>Date: <strong>{todayStr}</strong></div>
                  <div>Terminal: <strong>{session?.name || 'CEO Jalees'}</strong></div>
                  <div className="text-blue-600 font-bold">ISO-9001 / Terminal Verified</div>
                </div>
              </div>

              {/* 4 Essential Graphical KPI Cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Gross Revenue</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-[8.5px] text-slate-400">Total Fuel & Lubes</div>
                </div>

                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[9px] font-bold text-emerald-700 uppercase">Net Profit</div>
                  <div className="text-sm sm:text-base font-black text-emerald-700 font-mono mt-0.5">
                    {formatCurrency(totalNet)}
                  </div>
                  <div className="text-[8.5px] text-emerald-600 font-semibold">
                    Margin: {totalRevenue > 0 ? ((totalNet / totalRevenue) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                  <div className="text-[9px] font-bold text-blue-700 uppercase">Fuel Volume Sold</div>
                  <div className="text-sm sm:text-base font-black text-blue-700 font-mono mt-0.5">
                    {totalLiters.toFixed(0)} L
                  </div>
                  <div className="text-[8.5px] text-blue-600">
                    P: {totalPetrol.toFixed(0)} | D: {totalDiesel.toFixed(0)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Till & Float Cash</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                    {formatCurrency(totalStationCash)}
                  </div>
                  <div className="text-[8.5px] text-slate-400">
                    {activeStations.length}/{stationBalances.length} Active Stations
                  </div>
                </div>
              </div>

              {/* Two Column Table: Station Cash Float & Fuel Products */}
              <div className="grid grid-cols-2 gap-3">
                {/* Station Breakdown */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
                  <div className="font-bold text-[10px] text-slate-800 uppercase tracking-wide mb-1.5 border-b pb-1">
                    Station Cash & Capital Status
                  </div>
                  <table className="w-full text-left text-[9.5px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="pb-1">Station</th>
                        <th className="pb-1">Status</th>
                        <th className="pb-1 text-right">Capital</th>
                        <th className="pb-1 text-right">Cash Float</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stationBalances.map(s => (
                        <tr key={s.id}>
                          <td className="py-1 font-bold">{s.station}</td>
                          <td className="py-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-1 text-right font-mono">₨{s.allocatedInvestment.toLocaleString()}</td>
                          <td className="py-1 text-right font-mono font-semibold">₨{s.cashOnHand.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-slate-50">
                        <td colSpan={2} className="pt-1">TOTALS</td>
                        <td className="pt-1 text-right font-mono">₨{totalStationInvest.toLocaleString()}</td>
                        <td className="pt-1 text-right font-mono">₨{totalStationCash.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Fuel Rate & Volume Breakdown */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
                  <div className="font-bold text-[10px] text-slate-800 uppercase tracking-wide mb-1.5 border-b pb-1">
                    Fuel Product Performance
                  </div>
                  <table className="w-full text-left text-[9.5px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="pb-1">Fuel Type</th>
                        <th className="pb-1 text-right">Volume</th>
                        <th className="pb-1 text-right">Sale / Pur Rate</th>
                        <th className="pb-1 text-right">Margin/L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1 font-bold">Petrol</td>
                        <td className="py-1 text-right font-mono">{totalPetrol.toFixed(1)} L</td>
                        <td className="py-1 text-right font-mono">₨{rates?.psr || 375} / ₨{rates?.ppr || 355}</td>
                        <td className="py-1 text-right font-mono text-emerald-700 font-bold">₨{((rates?.psr || 375) - (rates?.ppr || 355)).toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">Diesel</td>
                        <td className="py-1 text-right font-mono">{totalDiesel.toFixed(1)} L</td>
                        <td className="py-1 text-right font-mono">₨{rates?.dsr || 374} / ₨{rates?.dpr || 353.5}</td>
                        <td className="py-1 text-right font-mono text-emerald-700 font-bold">₨{((rates?.dsr || 374) - (rates?.dpr || 353.5)).toFixed(1)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">Hi-Octane</td>
                        <td className="py-1 text-right font-mono">{totalHiOctane.toFixed(1)} L</td>
                        <td className="py-1 text-right font-mono">₨{rates?.hosr || 420} / ₨{rates?.hopr || 395}</td>
                        <td className="py-1 text-right font-mono text-emerald-700 font-bold">₨{((rates?.hosr || 420) - (rates?.hopr || 395)).toFixed(1)}</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="pt-1">Total Vol</td>
                        <td className="pt-1 text-right font-mono">{totalLiters.toFixed(1)} L</td>
                        <td colSpan={2} className="pt-1 text-right text-emerald-700">Gross Margin: {formatCurrency(totalGross)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Partner Capital & Profit Entitlement */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-white">
                <div className="font-bold text-[10px] text-slate-800 uppercase tracking-wide mb-1.5 border-b pb-1">
                  Partner Equity Stakes & Net Profit Entitlement
                </div>
                <table className="w-full text-left text-[9.5px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="pb-1">Partner</th>
                      <th className="pb-1">Role</th>
                      <th className="pb-1 text-right">Committed Capital</th>
                      <th className="pb-1 text-right">Equity %</th>
                      <th className="pb-1 text-right">Profit Entitlement</th>
                      <th className="pb-1 text-right">Withdrawn</th>
                      <th className="pb-1 text-right">Net Payable Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map(p => {
                      const shareRatio = totalInvested > 0 ? p.investment / totalInvested : 0;
                      const profitShare = totalNet * shareRatio;
                      const pWithdrawn = withdrawals.filter(w => w.partnerId === p.id).reduce((s, w) => s + w.amount, 0);
                      const netBalance = profitShare - pWithdrawn;

                      return (
                        <tr key={p.id}>
                          <td className="py-1 font-bold">{p.name}</td>
                          <td className="py-1 text-slate-500">{p.role}</td>
                          <td className="py-1 text-right font-mono">₨{p.investment.toLocaleString()}</td>
                          <td className="py-1 text-right font-mono">{(shareRatio * 100).toFixed(1)}%</td>
                          <td className="py-1 text-right font-mono text-emerald-700 font-bold">₨{profitShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="py-1 text-right font-mono">₨{pWithdrawn.toLocaleString()}</td>
                          <td className={`py-1 text-right font-mono font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                            ₨{netBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={2} className="pt-1">TOTAL NETWORK EQUITY</td>
                      <td className="pt-1 text-right font-mono">₨{totalInvested.toLocaleString()}</td>
                      <td className="pt-1 text-right font-mono">100.0%</td>
                      <td className="pt-1 text-right font-mono text-emerald-700">₨{totalNet.toLocaleString()}</td>
                      <td className="pt-1 text-right font-mono">₨{totalWithdrawn.toLocaleString()}</td>
                      <td className="pt-1 text-right font-mono text-blue-700">₨{(totalNet - totalWithdrawn).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Operating Directives & Sign-off */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-[9px] text-slate-500">
                <div>
                  <strong>Expenses Deducted:</strong> ₨{totalExpenses.toLocaleString()} (Salaries, Genset, Food, Logistics) • SWAT 1 & SWAT 2 Zero Baseline Verified.
                </div>
                <div className="text-right border-t border-dashed border-slate-400 pt-1 font-bold text-slate-800">
                  Jalees (CEO & Managing Partner) • Executive Seal
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL BALANCE SHEET */}
          {reportType === 'financial' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-2 flex justify-between">
                <h2 className="text-lg font-bold">Financial Statement & Ledger</h2>
                <div className="text-slate-500 font-mono">Date: {todayStr}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <div className="text-slate-500 text-[10px] font-bold">GROSS REVENUE</div>
                  <div className="text-base font-bold font-mono">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <div className="text-slate-500 text-[10px] font-bold">OPERATING EXPENSES</div>
                  <div className="text-base font-bold font-mono text-rose-600">{formatCurrency(totalExpenses)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-700 text-[10px] font-bold">NET OPERATING PROFIT</div>
                  <div className="text-base font-bold font-mono text-emerald-700">{formatCurrency(totalNet)}</div>
                </div>
              </div>
              <table className="w-full text-left text-xs border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Station</th>
                    <th className="p-2 border text-right">Petrol</th>
                    <th className="p-2 border text-right">Diesel</th>
                    <th className="p-2 border text-right">Revenue</th>
                    <th className="p-2 border text-right">Expenses</th>
                    <th className="p-2 border text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} className="border-b">
                      <td className="p-2 border">{e.date}</td>
                      <td className="p-2 border font-bold">{e.station}</td>
                      <td className="p-2 border text-right font-mono">{e.petrolSales} L</td>
                      <td className="p-2 border text-right font-mono">{e.dieselSales} L</td>
                      <td className="p-2 border text-right font-mono">{formatCurrency(e.revenue)}</td>
                      <td className="p-2 border text-right font-mono">{formatCurrency(e.totalExpenses)}</td>
                      <td className="p-2 border text-right font-mono font-bold text-emerald-700">{formatCurrency(e.netProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PARTNERS TAB */}
          {reportType === 'partners' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-lg font-bold border-b pb-2">Partner Profit Entitlement & Capital</h2>
              <table className="w-full text-left border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">Partner Name</th>
                    <th className="p-2 border">Role</th>
                    <th className="p-2 border text-right">Investment</th>
                    <th className="p-2 border text-right">Share %</th>
                    <th className="p-2 border text-right">Profit Share</th>
                    <th className="p-2 border text-right">Withdrawn</th>
                    <th className="p-2 border text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => {
                    const ratio = totalInvested > 0 ? p.investment / totalInvested : 0;
                    const share = totalNet * ratio;
                    const wAmt = withdrawals.filter(w => w.partnerId === p.id).reduce((s, w) => s + w.amount, 0);
                    return (
                      <tr key={p.id} className="border-b">
                        <td className="p-2 border font-bold">{p.name}</td>
                        <td className="p-2 border text-slate-500">{p.role}</td>
                        <td className="p-2 border text-right font-mono">₨{p.investment.toLocaleString()}</td>
                        <td className="p-2 border text-right font-mono">{(ratio * 100).toFixed(1)}%</td>
                        <td className="p-2 border text-right font-mono font-bold text-emerald-700">₨{share.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="p-2 border text-right font-mono">₨{wAmt.toLocaleString()}</td>
                        <td className="p-2 border text-right font-mono font-bold text-blue-700">₨{(share - wAmt).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: STATIONS */}
          {reportType === 'stations' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-lg font-bold border-b pb-2">Station Cash Float & Fuel Stocks</h2>
              <table className="w-full text-left border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">Station</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border text-right">Allocated Capital</th>
                    <th className="p-2 border text-right">Cash Float</th>
                    <th className="p-2 border text-right">Petrol Stock</th>
                    <th className="p-2 border text-right">Diesel Stock</th>
                    <th className="p-2 border">Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {stationBalances.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="p-2 border font-bold">{s.station}</td>
                      <td className="p-2 border">{s.status}</td>
                      <td className="p-2 border text-right font-mono">₨{s.allocatedInvestment.toLocaleString()}</td>
                      <td className="p-2 border text-right font-mono font-semibold">₨{s.cashOnHand.toLocaleString()}</td>
                      <td className="p-2 border text-right font-mono">{s.petrolStock} L</td>
                      <td className="p-2 border text-right font-mono">{s.dieselStock} L</td>
                      <td className="p-2 border text-slate-600">{s.managerInCharge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: AUDITS */}
          {reportType === 'audits' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-lg font-bold border-b pb-2">Audit Directives & Incident Log</h2>
              <table className="w-full text-left border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Station</th>
                    <th className="p-2 border">Audit Title</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Action Details</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.id} className="border-b">
                      <td className="p-2 border font-mono">{a.date}</td>
                      <td className="p-2 border font-bold">{a.station}</td>
                      <td className="p-2 border">{a.title}</td>
                      <td className="p-2 border font-semibold">{a.status}</td>
                      <td className="p-2 border text-slate-600">{a.actionNotes || a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
