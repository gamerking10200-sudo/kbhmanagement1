import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowDownRight, 
  ArrowUpRight, 
  Coins, 
  Wallet, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  FileCode, 
  Printer, 
  Download, 
  Share2, 
  Check, 
  AlertTriangle, 
  X, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
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
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import { FinalHtmlShareModal } from './FinalHtmlShareModal';
import { downloadGraphicalHtmlFile } from '../utils/exportFiles';

interface PartnersTabProps {
  session: UserSession;
  partners: Partner[];
  withdrawals: PartnerWithdrawal[];
  entries: StationEntry[];
  stationBalances?: StationBalance[];
  bankAccounts?: BankAccount[];
  bankDeposits?: BankDepositRecord[];
  creditLoans?: CreditClientLoan[];
  audits?: AuditRecord[];
  rates?: FuelRates;
  onAddPartner: (partner: Omit<Partner, 'id' | 'joinedDate'>) => void;
  onUpdatePartner?: (partner: Partner) => void;
  onDeletePartner: (partnerId: string) => void;
  onRecordWithdrawal: (withdrawal: Omit<PartnerWithdrawal, 'id' | 'createdAt' | 'recordedBy'>) => void;
  onAdjustPartnerCapital?: (
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'; reference?: string; notes?: string }
  ) => void;
  onAdjustPartnerProfit?: (
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'; reference?: string; notes?: string }
  ) => void;
  onUpdateWithdrawal?: (withdrawal: PartnerWithdrawal) => void;
  onDeleteWithdrawal?: (withdrawalId: string) => void;
  onOpenPrintModal: () => void;
}

const DESIGNATION_PRESETS = [
  'CEO & Managing Partner',
  'Lead Partner',
  'Executive Director',
  'Director Operations',
  'Finance Director',
  'Investment Partner',
  'Silent Investor',
  'Managing Partner',
  'Senior Advisor & Partner',
];

export const PartnersTab: React.FC<PartnersTabProps> = ({
  session,
  partners,
  withdrawals,
  entries,
  stationBalances = [],
  bankAccounts = [],
  bankDeposits = [],
  creditLoans = [],
  audits = [],
  rates,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onRecordWithdrawal,
  onAdjustPartnerCapital,
  onAdjustPartnerProfit,
  onUpdateWithdrawal,
  onDeleteWithdrawal,
  onOpenPrintModal,
}) => {
  const isCeo = session.role === 'ceo_jalees';

  // Modals state
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showFinalHtmlModal, setShowFinalHtmlModal] = useState(false);
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState<Partner | null>(null);

  // Edit Withdrawal State
  const [editingWithdrawal, setEditingWithdrawal] = useState<PartnerWithdrawal | null>(null);
  const [deletingWithdrawalId, setDeletingWithdrawalId] = useState<string | null>(null);

  // Selected partner for edit or adjustment
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Add Partner Form State
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerRole, setNewPartnerRole] = useState('Investment Partner');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [newPartnerInvestment, setNewPartnerInvestment] = useState<number>(1000000);
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerNotes, setNewPartnerNotes] = useState('');

  // Edit Partner Form State
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editInvestment, setEditInvestment] = useState<number>(0);
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Adjust Investment / Profit Form State
  const [adjustTargetPartnerId, setAdjustTargetPartnerId] = useState<string>('');
  const [adjustCategory, setAdjustCategory] = useState<'Investment' | 'Profit'>('Investment');
  const [adjustAction, setAdjustAction] = useState<'Add' | 'Withdraw'>('Add');
  const [adjustAmount, setAdjustAmount] = useState<number>(100000);
  const [adjustDate, setAdjustDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adjustMode, setAdjustMode] = useState<'Cash' | 'Bank Transfer' | 'Cheque'>('Bank Transfer');
  const [adjustReference, setAdjustReference] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Tab filter for withdrawals/transactions
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'profit' | 'capital'>('all');

  // Financial Metrics
  const totalNet = entries.reduce((a, e) => a + e.netProfit, 0);
  const totalInvested = partners.reduce((a, p) => a + p.investment, 0);
  const totalWithdrawn = withdrawals.reduce((a, w) => a + w.amount, 0);
  const totalRemainingProfit = totalNet - totalWithdrawn;
  const totalNetHoldings = totalInvested + totalRemainingProfit;

  // Open Edit Partner Modal
  const handleOpenEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setEditName(partner.name);
    setEditRole(partner.role);
    setEditInvestment(partner.investment);
    setEditPhone(partner.phone || '');
    setEditNotes(partner.notes || '');
    setShowEditPartnerModal(true);
  };

  // Open Adjust Modal with preselected category & action
  const handleOpenAdjust = (
    partner: Partner, 
    category: 'Investment' | 'Profit' = 'Investment', 
    action: 'Add' | 'Withdraw' = 'Add'
  ) => {
    setSelectedPartner(partner);
    setAdjustTargetPartnerId(partner.id);
    setAdjustCategory(category);
    setAdjustAction(action);
    setAdjustAmount(category === 'Investment' ? 250000 : 50000);
    setAdjustDate(new Date().toISOString().split('T')[0]);
    setAdjustMode('Bank Transfer');
    setAdjustReference('');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  // Submit Add Partner
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      alert('Please enter a partner name');
      return;
    }
    if (newPartnerInvestment <= 0) {
      alert('Investment must be greater than 0');
      return;
    }

    const finalRole = newPartnerRole === 'Other (Custom)' ? (customRoleInput.trim() || 'Equity Partner') : newPartnerRole;

    onAddPartner({
      name: newPartnerName.trim(),
      role: finalRole,
      investment: newPartnerInvestment,
      phone: newPartnerPhone.trim(),
      notes: newPartnerNotes.trim(),
    });

    setNewPartnerName('');
    setNewPartnerInvestment(1000000);
    setNewPartnerPhone('');
    setNewPartnerNotes('');
    setCustomRoleInput('');
    setShowAddPartnerModal(false);
  };

  // Submit Edit Partner
  const handleSaveEditPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    if (!editName.trim()) {
      alert('Partner name cannot be empty');
      return;
    }
    if (editInvestment < 0) {
      alert('Investment cannot be negative');
      return;
    }

    if (onUpdatePartner) {
      onUpdatePartner({
        ...selectedPartner,
        name: editName.trim(),
        role: editRole.trim() || selectedPartner.role,
        investment: editInvestment,
        phone: editPhone.trim(),
        notes: editNotes.trim(),
      });
    }

    setShowEditPartnerModal(false);
    setSelectedPartner(null);
  };

  // Submit Capital or Profit Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find(p => p.id === adjustTargetPartnerId);
    if (!partner) {
      alert('Please select a partner');
      return;
    }
    if (adjustAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const details = {
      date: adjustDate,
      paymentMode: adjustMode,
      reference: adjustReference.trim(),
      notes: adjustNotes.trim(),
    };

    if (adjustCategory === 'Investment') {
      if (onAdjustPartnerCapital) {
        onAdjustPartnerCapital(partner.id, adjustAction, adjustAmount, details);
      } else {
        // Fallback
        if (adjustAction === 'Add') {
          if (onUpdatePartner) {
            onUpdatePartner({ ...partner, investment: partner.investment + adjustAmount });
          }
        } else {
          onRecordWithdrawal({
            partnerId: partner.id,
            partnerName: partner.name,
            amount: adjustAmount,
            withdrawalType: 'Capital',
            paymentMode: adjustMode,
            reference: adjustReference,
            notes: adjustNotes || 'Capital withdrawal',
          });
        }
      }
    } else {
      // Profit adjustment
      if (adjustAction === 'Add') {
        if (onAdjustPartnerProfit) {
          onAdjustPartnerProfit(partner.id, 'Add', adjustAmount, details);
        } else if (onUpdatePartner) {
          onUpdatePartner({
            ...partner,
            profitAdjustments: (partner.profitAdjustments || 0) + adjustAmount,
          });
        }
      } else {
        // Withdraw Profit
        onRecordWithdrawal({
          partnerId: partner.id,
          partnerName: partner.name,
          amount: adjustAmount,
          withdrawalType: 'Profit',
          date: adjustDate,
          paymentMode: adjustMode,
          reference: adjustReference,
          notes: adjustNotes || 'Profit withdrawal draw',
        });
      }
    }

    setShowAdjustModal(false);
  };

  // Quick 1-click Download HTML
  const handleQuickDownloadHtml = () => {
    const payload = {
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
    };
    downloadGraphicalHtmlFile(payload, 'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT');
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (transactionFilter === 'profit') return w.withdrawalType !== 'Capital';
    if (transactionFilter === 'capital') return w.withdrawalType === 'Capital';
    return true;
  });

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Partner Capital, Profits & Net Investment
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Equity Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time equity distribution, capital injections/withdrawals & comprehensive partner net settlement
          </p>
        </div>

        {/* Action Buttons for CEO Jalees */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FINAL HTML FOR SHARING (Prominent button requested by user) */}
          <button
            type="button"
            onClick={() => setShowFinalHtmlModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/30"
          >
            <FileCode className="w-4 h-4 text-blue-200" />
            <span>Final HTML for Sharing</span>
          </button>

          {/* Quick Direct Download */}
          <button
            type="button"
            onClick={handleQuickDownloadHtml}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            title="Instant Download .HTML file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Download HTML</span>
          </button>

          {isCeo ? (
            <>
              {/* Record Investment / Profit Adjustment */}
              <button
                type="button"
                onClick={() => {
                  if (partners.length > 0) {
                    handleOpenAdjust(partners[0], 'Investment', 'Add');
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Adjust Capital / Profit</span>
              </button>

              {/* Add Partner */}
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Partner</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Eyes Only (View Partner Shares)</span>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invested Capital */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Total Invested Capital</span>
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {formatCurrency(totalInvested)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{partners.length} equity partners</div>
        </div>

        {/* Allocated Net Profit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Allocated Net Profit</span>
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
            {formatCurrency(totalNet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">From all station sales</div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Total Withdrawn</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400">
            {formatCurrency(totalWithdrawn)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{withdrawals.length} withdrawals recorded</div>
        </div>

        {/* Net Investment / Total Holding Position */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <div className="text-xs font-semibold text-indigo-300 mb-1 flex items-center justify-between">
            <span>Total Net Investment & Equity</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200">
            {formatCurrency(totalNetHoldings)}
          </div>
          <div className="text-[11px] text-indigo-300/80 mt-1">
            Undrawn Profit: {formatCurrency(totalRemainingProfit)}
          </div>
        </div>
      </div>

      {/* PARTNERS CARDS GRID WITH EDIT, ADD/WITHDRAW, DESIGNATION, NET INVESTMENT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Partners Capital, Equity & Designation Ledger</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click partner actions to inject capital or disburse profits
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {partners.map(partner => {
            const shareRatio = totalInvested > 0 ? partner.investment / totalInvested : 0;
            const partnerWithdrawals = withdrawals.filter(w => w.partnerId === partner.id);
            const totalWithdrawnByPartner = partnerWithdrawals.reduce((a, w) => a + w.amount, 0);
            
            // Base profit from station sales
            const baseProfitShare = totalNet * shareRatio;
            // Manual profit adjustments or bonuses
            const profitAdjustments = partner.profitAdjustments || 0;
            const totalProfitEntitlement = baseProfitShare + profitAdjustments;
            
            // Profit balance remaining
            const profitBalance = totalProfitEntitlement - totalWithdrawnByPartner;
            
            // Net Investment Value = Current Invested Capital + Undrawn Profit Balance
            const netInvestmentValue = partner.investment + profitBalance;

            return (
              <div
                key={partner.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all relative overflow-hidden group"
              >
                {/* Top Card Bar: Name, Role/Designation, and Action Controls */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                          {partner.name}
                        </h3>
                        {/* Designation Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {partner.role}
                        </span>
                        {/* Equity Share Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                          {formatPercent(shareRatio)}
                        </span>
                      </div>
                      
                      {partner.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{partner.phone}</span>
                          {partner.joinedDate && (
                            <span className="text-slate-500">• Joined {partner.joinedDate}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CEO Action Toolbar for this Partner */}
                    {isCeo && (
                      <div className="flex items-center gap-1.5">
                        {/* Edit Partner & Designation */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(partner)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer"
                          title="Edit Partner & Designation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Partner */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPartner(partner)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 transition-colors cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Partner Equity & Capital Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, shareRatio * 100))}%` }}
                    />
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs mb-4">
                    {/* Invested Capital */}
                    <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Invested Capital</span>
                      <span className="text-white font-extrabold text-sm font-mono">
                        {formatCurrency(partner.investment)}
                      </span>
                    </div>

                    {/* Profit Entitlement */}
                    <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Total Profit Share</span>
                      <span className="text-emerald-400 font-extrabold text-sm font-mono">
                        {formatCurrency(totalProfitEntitlement)}
                      </span>
                    </div>

                    {/* Total Withdrawn */}
                    <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Total Withdrawn</span>
                      <span className="text-rose-400 font-extrabold text-sm font-mono">
                        {formatCurrency(totalWithdrawnByPartner)}
                      </span>
                    </div>

                    {/* Profit Balance */}
                    <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Undrawn Profit</span>
                      <span className={`font-extrabold text-sm font-mono ${profitBalance >= 0 ? 'text-purple-300' : 'text-rose-400'}`}>
                        {formatCurrency(profitBalance)}
                      </span>
                    </div>

                    {/* Net Investment Value (MANDATED: "add or withdraw options for investments and profits and net investment") */}
                    <div className="col-span-2 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 p-2.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-emerald-300 font-bold block text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Net Investment & Equity Value
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Invested Capital + Undrawn Profits
                        </span>
                      </div>
                      <span className="text-emerald-300 font-black text-base font-mono">
                        {formatCurrency(netInvestmentValue)}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Terms */}
                  {partner.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50 mb-4">
                      💬 <span className="italic">{partner.notes}</span>
                    </p>
                  )}
                </div>

                {/* Quick Add / Withdraw Investment & Profit Action Buttons */}
                {isCeo && (
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {/* Add Investment */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(partner, 'Investment', 'Add')}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 font-bold text-[11px] transition-all cursor-pointer"
                      title="Inject additional investment capital"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Capital</span>
                    </button>

                    {/* Withdraw Investment */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(partner, 'Investment', 'Withdraw')}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-[11px] transition-all cursor-pointer"
                      title="Drawdown or return of capital"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Draw Capital</span>
                    </button>

                    {/* Add Profit Bonus */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(partner, 'Profit', 'Add')}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-bold text-[11px] transition-all cursor-pointer"
                      title="Add profit bonus / special allocation"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Profit</span>
                    </button>

                    {/* Withdraw Profit */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(partner, 'Profit', 'Withdraw')}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer"
                      title="Disburse profit dividend"
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      <span>Withdraw Profit</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* WITHDRAWALS & TRANSACTIONS HISTORY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <span>Partner Withdrawals & Disbursement History</span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit log of profit drawings, dividends and capital movements
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTransactionFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                transactionFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records ({withdrawals.length})
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('profit')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                transactionFilter === 'profit'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profits
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('capital')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                transactionFilter === 'capital'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Capital
            </button>
          </div>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/40">
            No withdrawal records matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 rounded-l-xl">Date</th>
                  <th className="py-3 px-3">Partner</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Reference / Slip</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Amount (PKR)</th>
                  <th className="py-3 px-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredWithdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{formatDate(w.date)}</td>
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">{w.partnerName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.withdrawalType === 'Capital'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {w.withdrawalType || 'Profit'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{w.paymentMode}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {w.reference || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">
                      {w.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-400 font-mono whitespace-nowrap">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isCeo ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingWithdrawal(w)}
                            title="Edit Withdrawal Record"
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {deletingWithdrawalId === w.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeleteWithdrawal) {
                                    onDeleteWithdrawal(w.id);
                                  }
                                  setDeletingWithdrawalId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Del
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingWithdrawalId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingWithdrawalId(w.id)}
                              title="Delete Withdrawal Record"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3" /> CEO Only
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

      {/* ======================================================== */}
      {/* MODAL: EDIT WITHDRAWAL RECORD */}
      {/* ======================================================== */}
      {editingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Partner Withdrawal</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWithdrawal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateWithdrawal && editingWithdrawal) {
                  onUpdateWithdrawal(editingWithdrawal);
                }
                setEditingWithdrawal(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Partner Name</label>
                <input
                  type="text"
                  value={editingWithdrawal.partnerName}
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={editingWithdrawal.date}
                    onChange={e => setEditingWithdrawal({ ...editingWithdrawal, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    value={editingWithdrawal.amount}
                    onChange={e => setEditingWithdrawal({ ...editingWithdrawal, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-rose-400 font-mono text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={editingWithdrawal.withdrawalType || 'Profit'}
                    onChange={e => setEditingWithdrawal({ ...editingWithdrawal, withdrawalType: e.target.value as 'Profit' | 'Capital' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="Profit">Profit Share</option>
                    <option value="Capital">Capital Draw</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Payment Mode</label>
                  <select
                    value={editingWithdrawal.paymentMode}
                    onChange={e => setEditingWithdrawal({ ...editingWithdrawal, paymentMode: e.target.value as 'Cash' | 'Bank Transfer' | 'Cheque' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Slip / Cheque / Ref #</label>
                <input
                  type="text"
                  value={editingWithdrawal.reference || ''}
                  onChange={e => setEditingWithdrawal({ ...editingWithdrawal, reference: e.target.value })}
                  placeholder="e.g. CHQ-99201, TRF-8821"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={editingWithdrawal.notes || ''}
                  onChange={e => setEditingWithdrawal({ ...editingWithdrawal, notes: e.target.value })}
                  placeholder="e.g. Approved monthly dividend payout"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWithdrawal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save Withdrawal Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD PARTNER MODAL */}
      {/* ======================================================== */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Add New Equity Partner</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPartnerModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="p-6 space-y-4">
              {/* Partner Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Partner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={e => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Designation / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation / Role *
                </label>
                <select
                  value={newPartnerRole}
                  onChange={e => setNewPartnerRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {DESIGNATION_PRESETS.map(preset => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                  <option value="Other (Custom)">Other (Custom Designation)</option>
                </select>
                {newPartnerRole === 'Other (Custom)' && (
                  <input
                    type="text"
                    required
                    value={customRoleInput}
                    onChange={e => setCustomRoleInput(e.target.value)}
                    placeholder="Enter custom designation"
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Initial Capital Investment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Capital Investment (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="10000"
                  value={newPartnerInvestment}
                  onChange={e => setNewPartnerInvestment(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount: {formatCurrency(newPartnerInvestment)}
                </span>
              </div>

              {/* Phone / Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="text"
                  value={newPartnerPhone}
                  onChange={e => setNewPartnerPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Notes / Special Terms */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Terms / Notes (Optional)
                </label>
                <textarea
                  value={newPartnerNotes}
                  onChange={e => setNewPartnerNotes(e.target.value)}
                  placeholder="Special profit agreements, bank details, etc."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  Confirm & Onboard Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT PARTNER & DESIGNATION MODAL */}
      {/* ======================================================== */}
      {showEditPartnerModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Partner & Designation</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditPartnerModal(false);
                  setSelectedPartner(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPartner} className="p-6 space-y-4">
              {/* Partner Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Designation / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  placeholder="e.g. CEO & Managing Partner, Lead Partner, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {DESIGNATION_PRESETS.slice(0, 5).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditRole(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invested Capital */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invested Capital (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  value={editInvestment}
                  onChange={e => setEditInvestment(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount: {formatCurrency(editInvestment)}
                </span>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPartnerModal(false);
                    setSelectedPartner(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  Save Partner Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADJUST CAPITAL OR PROFIT (ADD / WITHDRAW) */}
      {/* ======================================================== */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Adjust Investment or Profit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              {/* Partner Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Partner *
                </label>
                <select
                  value={adjustTargetPartnerId}
                  onChange={e => setAdjustTargetPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role}) — Capital: ₨{p.investment.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category: Investment vs Profit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Type *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAdjustCategory('Investment')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adjustCategory === 'Investment'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🏢 Capital Investment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustCategory('Profit')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adjustCategory === 'Profit'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💰 Operational Profit
                  </button>
                </div>
              </div>

              {/* Action: Add vs Withdraw */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Direction *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('Add')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adjustAction === 'Add'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {adjustCategory === 'Investment' ? 'Add Capital Injection' : 'Add Profit Allocation'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('Withdraw')}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adjustAction === 'Withdraw'
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>
                      {adjustCategory === 'Investment' ? 'Withdraw Capital' : 'Withdraw Profit'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="5000"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 250000, 500000, 1000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustAmount(val)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                    >
                      ₨{(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={adjustDate}
                    onChange={e => setAdjustDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={adjustMode}
                    onChange={e => setAdjustMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slip Reference / Cheque # (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReference}
                  onChange={e => setAdjustReference(e.target.value)}
                  placeholder="e.g. IBFT-98412 or CHQ-0021"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-colors cursor-pointer ${
                    adjustAction === 'Add'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  Execute {adjustCategory} {adjustAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteConfirmPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Partner Record</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove <strong className="text-white">{deleteConfirmPartner.name}</strong> ({deleteConfirmPartner.role}) with capital of <strong className="text-white font-mono">₨{deleteConfirmPartner.investment.toLocaleString()}</strong>?
              </p>
              <p className="text-[11px] text-rose-400/90 mt-2 bg-rose-950/40 p-2 rounded-xl border border-rose-900/40">
                ⚠️ This will recalculate the equity ratio for all remaining partners.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPartner(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePartner(deleteConfirmPartner.id);
                  setDeleteConfirmPartner(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
              >
                Yes, Delete Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: FINAL HTML FOR SHARING */}
      {/* ======================================================== */}
      <FinalHtmlShareModal
        isOpen={showFinalHtmlModal}
        onClose={() => setShowFinalHtmlModal(false)}
        data={{
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
        }}
      />
    </div>
  );
};
