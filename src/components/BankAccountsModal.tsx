import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  CreditCard, 
  Landmark, 
  Receipt, 
  ShieldCheck, 
  Wallet,
  Calendar,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { BankAccount, BankDepositRecord, StationBalance, UserSession } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

interface BankAccountsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  session: UserSession;
  bankAccounts: BankAccount[];
  bankDeposits: BankDepositRecord[];
  stationBalances: StationBalance[];
  onDepositToBank: (deposit: Omit<BankDepositRecord, 'id' | 'createdAt'>) => void;
  onAddBankAccount?: (account: Omit<BankAccount, 'id'>) => void;
  onUpdateBankAccount?: (account: BankAccount) => void;
  onDeleteBankAccount?: (accountId: string) => void;
  onUpdateBankDeposit?: (deposit: BankDepositRecord) => void;
  onDeleteBankDeposit?: (depositId: string) => void;
}

export const BankAccountsModal: React.FC<BankAccountsModalProps> = ({
  isOpen = true,
  onClose,
  session,
  bankAccounts = [],
  bankDeposits = [],
  stationBalances = [],
  onDepositToBank,
  onAddBankAccount,
  onUpdateBankAccount,
  onDeleteBankAccount,
  onUpdateBankDeposit,
  onDeleteBankDeposit,
}) => {
  const isCeoOrAdmin = session?.role === 'ceo_jalees' || session?.canEdit;
  const [activeTab, setActiveTab] = useState<'accounts' | 'deposit' | 'history'>('accounts');
  const [selectedStation, setSelectedStation] = useState<string>(stationBalances[0]?.station || 'SWAT 1');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [depositType, setDepositType] = useState<'Daily Cash' | 'Net Profit' | 'Capital Deposit' | 'Other'>('Daily Cash');
  const [slipNumber, setSlipNumber] = useState<string>(`DEP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [depositedBy, setDepositedBy] = useState<string>(session?.name || 'CEO Jalees');
  const [notes, setNotes] = useState<string>('Daily operational cash credit to bank');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New account form state
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountTitle, setNewAccountTitle] = useState('Kashfi Bro Holdings');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newIban, setNewIban] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState<number>(0);

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Edit Deposit state
  const [editingDeposit, setEditingDeposit] = useState<BankDepositRecord | null>(null);
  const [deletingDepositId, setDeletingDepositId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalStationCash = stationBalances.reduce((sum, st) => sum + st.cashOnHand, 0);

  const selectedStationObj = stationBalances.find(s => s.station === selectedStation);

  const handleFillStationCash = () => {
    if (selectedStationObj) {
      setDepositAmount(selectedStationObj.cashOnHand);
      setDepositType('Daily Cash');
    }
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || depositAmount <= 0) {
      alert('Please enter a valid deposit amount and choose a bank account.');
      return;
    }

    const targetAccount = bankAccounts.find(a => a.id === selectedAccountId);
    if (!targetAccount) return;

    onDepositToBank({
      date: new Date().toISOString().split('T')[0],
      station: selectedStation,
      bankAccountId: selectedAccountId,
      bankName: targetAccount.bankName,
      accountNumber: targetAccount.accountNumber,
      amount: Number(depositAmount),
      depositType,
      slipNumber: slipNumber.trim() || `DEP-${Date.now().toString().slice(-5)}`,
      depositedBy: depositedBy.trim() || session?.name || 'Staff',
      notes: notes.trim(),
    });

    setSuccessMsg(`₨ ${Number(depositAmount).toLocaleString()} successfully credited to ${targetAccount.bankName}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      setActiveTab('history');
    }, 1800);
  };

  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccountNumber.trim()) {
      alert('Bank Name and Account Number are required.');
      return;
    }

    if (onAddBankAccount) {
      onAddBankAccount({
        bankName: newBankName.trim(),
        accountTitle: newAccountTitle.trim(),
        accountNumber: newAccountNumber.trim(),
        iban: newIban.trim(),
        branch: newBranch.trim(),
        currentBalance: Number(newOpeningBalance) || 0,
        isPrimary: bankAccounts.length === 0,
      });
    }

    setIsAddingAccount(false);
    setNewBankName('');
    setNewAccountNumber('');
    setNewIban('');
    setNewBranch('');
    setNewOpeningBalance(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Company Bank Accounts & Daily Cash Credits
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TREASURY LEDGER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deposit daily drawer cash or station net profit directly into corporate bank accounts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Treasury Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              Total Bank Liquidity
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(totalBankBalance)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across {bankAccounts.length} Verified Accounts</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Station Cash in Drawers
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-1">
              {formatCurrency(totalStationCash)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Available across {stationBalances.length} Stations</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-400" />
              Total Deposits Recorded
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-400 font-mono mt-1">
              {bankDeposits.length} Vouchers
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Sum: {formatCurrency(bankDeposits.reduce((s, d) => s + d.amount, 0))}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Corporate Accounts ({bankAccounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'deposit'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Deposit Cash / Profit to Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'history'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Deposit Ledger ({bankDeposits.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              {successMsg}
            </div>
          )}

          {/* TAB 1: ACCOUNTS LIST */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Corporate Bank Accounts</h3>
                  <p className="text-xs text-slate-400">All credited balances are backed by official deposit slips</p>
                </div>
                {session?.role === 'ceo_jalees' && !isAddingAccount && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAccount(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Bank Account
                  </button>
                )}
              </div>

              {/* Add Account Inline Form */}
              {isAddingAccount && (
                <form onSubmit={handleSaveNewAccount} className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400">Add New Corporate Bank Account</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Bank Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Meezan Bank, HBL, Bank Alfalah"
                        value={newBankName}
                        onChange={e => setNewBankName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Account Title</label>
                      <input
                        type="text"
                        value={newAccountTitle}
                        onChange={e => setNewAccountTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Account Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 0102-1234567890"
                        value={newAccountNumber}
                        onChange={e => setNewAccountNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">IBAN</label>
                      <input
                        type="text"
                        placeholder="PK64MEZN..."
                        value={newIban}
                        onChange={e => setNewIban(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Branch Name / City</label>
                      <input
                        type="text"
                        placeholder="e.g. Mingora Swat Branch"
                        value={newBranch}
                        onChange={e => setNewBranch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Opening Balance (PKR)</label>
                      <input
                        type="number"
                        value={newOpeningBalance}
                        onChange={e => setNewOpeningBalance(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Account Modal / Form */}
              {editingAccount && (
                <div className="bg-slate-950 border border-blue-500/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Edit Corporate Account: {editingAccount.bankName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingAccount(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editingAccount.bankName}
                        onChange={e => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Account Title</label>
                      <input
                        type="text"
                        value={editingAccount.accountTitle}
                        onChange={e => setEditingAccount({ ...editingAccount, accountTitle: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Account Number</label>
                      <input
                        type="text"
                        value={editingAccount.accountNumber}
                        onChange={e => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">IBAN</label>
                      <input
                        type="text"
                        value={editingAccount.iban || ''}
                        onChange={e => setEditingAccount({ ...editingAccount, iban: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Branch Code / City</label>
                      <input
                        type="text"
                        value={editingAccount.branch || ''}
                        onChange={e => setEditingAccount({ ...editingAccount, branch: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Current Balance (PKR)</label>
                      <input
                        type="number"
                        value={editingAccount.currentBalance}
                        onChange={e => setEditingAccount({ ...editingAccount, currentBalance: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingAccount(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateBankAccount && editingAccount) {
                          onUpdateBankAccount(editingAccount);
                          setSuccessMsg(`Account ${editingAccount.bankName} updated successfully.`);
                          setEditingAccount(null);
                          setTimeout(() => setSuccessMsg(null), 2500);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                    >
                      Save Account Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Account Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bankAccounts.map(acc => (
                  <div
                    key={acc.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{acc.bankName}</h4>
                            {acc.isPrimary && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{acc.accountTitle}</p>
                        </div>
                      </div>

                      {/* Admin / CEO Edit & Delete Controls */}
                      {isCeoOrAdmin ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingAccount(acc)}
                            title={`Edit ${acc.bankName}`}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {deletingAccountId === acc.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeleteBankAccount) {
                                    onDeleteBankAccount(acc.id);
                                    setDeletingAccountId(null);
                                    setSuccessMsg(`Bank account ${acc.bankName} deleted.`);
                                    setTimeout(() => setSuccessMsg(null), 2500);
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Del
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingAccountId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingAccountId(acc.id)}
                              title={`Delete ${acc.bankName}`}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1" title="Admin or CEO authority required to modify accounts">
                          <Lock className="w-3 h-3 text-slate-500" /> Admin
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="flex justify-between text-slate-400">
                        <span>A/C No:</span>
                        <span className="text-white font-bold">{acc.accountNumber}</span>
                      </div>
                      {acc.iban && (
                        <div className="flex justify-between text-slate-400">
                          <span>IBAN:</span>
                          <span className="text-slate-300">{acc.iban}</span>
                        </div>
                      )}
                      {acc.branch && (
                        <div className="flex justify-between text-slate-400 font-sans">
                          <span>Branch:</span>
                          <span className="text-slate-300">{acc.branch}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Current Balance:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {formatCurrency(acc.currentBalance)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setActiveTab('deposit');
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Credit to This Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT DAILY CASH / PROFIT */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleExecuteDeposit} className="max-w-2xl mx-auto space-y-4 bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  Deposit Daily Cash or Profit to Bank Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directly transfers station drawer cash or shift profit into corporate bank accounts with slip tracking
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Origin Station */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Source Gas Station *</label>
                  <select
                    value={selectedStation}
                    onChange={e => setSelectedStation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {stationBalances.map(st => (
                      <option key={st.station} value={st.station}>
                        {st.station} (Drawer Cash: ₨ {st.cashOnHand.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {selectedStationObj && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Available Drawer Cash: ₨ {selectedStationObj.cashOnHand.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={handleFillStationCash}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Fill All Cash
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Destination Bank Account */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Target Bank Account *</label>
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber} (Bal: ₨ {acc.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Deposit Type */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposit Nature *</label>
                  <select
                    value={depositType}
                    onChange={e => setDepositType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Daily Cash">Daily Station Drawer Cash</option>
                    <option value="Net Profit">Daily Operating Net Profit</option>
                    <option value="Capital Deposit">Partner Capital / Investment Deposit</option>
                    <option value="Other">Other Bank Transfer</option>
                  </select>
                </div>

                {/* 4. Deposit Amount */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposit Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={depositAmount}
                    onChange={e => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                {/* 5. Bank Deposit Slip / Cheque # */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposit Slip / Ref # *</label>
                  <input
                    type="text"
                    value={slipNumber}
                    onChange={e => setSlipNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    placeholder="e.g. DEP-78291"
                    required
                  />
                </div>

                {/* 6. Deposited By */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposited By (Manager / Operator) *</label>
                  <input
                    type="text"
                    value={depositedBy}
                    onChange={e => setDepositedBy(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-300 text-xs font-bold block mb-1">Voucher Description / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="e.g. Deposited cash at Mingora branch counter"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Credit ₨ {depositAmount.toLocaleString()} to Bank
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DEPOSIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Bank Deposit Transaction Ledger</h3>
                  <p className="text-xs text-slate-400">All historical daily cash and profit deposits into bank accounts</p>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  Total Banked: {formatCurrency(bankDeposits.reduce((s, d) => s + d.amount, 0))}
                </div>
              </div>

              {/* Edit Deposit Form Modal */}
              {editingDeposit && (
                <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3 mb-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Edit Bank Deposit: {editingDeposit.slipNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingDeposit(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Date</label>
                      <input
                        type="date"
                        value={editingDeposit.date}
                        onChange={e => setEditingDeposit({ ...editingDeposit, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Amount (PKR)</label>
                      <input
                        type="number"
                        value={editingDeposit.amount}
                        onChange={e => setEditingDeposit({ ...editingDeposit, amount: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Slip / Ref #</label>
                      <input
                        type="text"
                        value={editingDeposit.slipNumber}
                        onChange={e => setEditingDeposit({ ...editingDeposit, slipNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">Deposited By</label>
                      <input
                        type="text"
                        value={editingDeposit.depositedBy}
                        onChange={e => setEditingDeposit({ ...editingDeposit, depositedBy: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-slate-400 font-semibold block mb-1">Notes / Description</label>
                      <input
                        type="text"
                        value={editingDeposit.notes || ''}
                        onChange={e => setEditingDeposit({ ...editingDeposit, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingDeposit(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateBankDeposit && editingDeposit) {
                          onUpdateBankDeposit(editingDeposit);
                          setSuccessMsg(`Deposit slip ${editingDeposit.slipNumber} updated.`);
                          setEditingDeposit(null);
                          setTimeout(() => setSuccessMsg(null), 2500);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                    >
                      Save Deposit Changes
                    </button>
                  </div>
                </div>
              )}

              {bankDeposits.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No bank deposit records yet. Use the "Deposit Cash / Profit" tab to record today's banking.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Station</th>
                        <th className="p-3">Bank & Account</th>
                        <th className="p-3">Slip / Ref #</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Deposited By</th>
                        <th className="p-3 text-right">Amount (PKR)</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {bankDeposits.map(d => (
                        <tr key={d.id} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-300 font-mono">{formatDate(d.date)}</td>
                          <td className="p-3 text-white font-bold">{d.station}</td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-semibold">{d.bankName}</span>
                            <span className="text-slate-500 block text-[10px] font-mono">{d.accountNumber}</span>
                          </td>
                          <td className="p-3 text-slate-300 font-mono font-bold">{d.slipNumber}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {d.depositType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{d.depositedBy}</td>
                          <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                            ₨ {d.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            {isCeoOrAdmin ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingDeposit(d)}
                                  title="Edit Deposit Voucher"
                                  className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                {deletingDepositId === d.id ? (
                                  <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 p-1 rounded-xl">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onDeleteBankDeposit) {
                                          onDeleteBankDeposit(d.id);
                                          setDeletingDepositId(null);
                                          setSuccessMsg(`Deposit ${d.slipNumber} deleted.`);
                                          setTimeout(() => setSuccessMsg(null), 2500);
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                                    >
                                      Del
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingDepositId(null)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingDepositId(d.id)}
                                    title="Delete Deposit Voucher"
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                                <Lock className="w-3 h-3" /> Locked
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Direct Treasury Integration • Verified by CEO Jalees
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
