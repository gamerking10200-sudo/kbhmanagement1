import React, { useState, useEffect } from 'react';
import { 
  AppCredentials,
  AppTheme,
  AuditRecord, 
  AuditStatus, 
  BankAccount,
  BankDepositRecord,
  BroadcastNotification, 
  CreditClientLoan,
  DashboardLayoutConfig,
  DipTestRecord,
  DipTestScheduleItem,
  FuelRates, 
  ImmediateAuditResult,
  Partner, 
  PartnerWithdrawal, 
  RateHistoryItem, 
  StationBalance, 
  StationEntry, 
  StationName,
  TabType, 
  UserSession 
} from './types';
import { StorageService } from './utils/storage';
import { PinLogin } from './components/PinLogin';
import { HeaderNav } from './components/HeaderNav';
import { TabsNav } from './components/TabsNav';
import { HomeTab } from './components/HomeTab';
import { EntryTab } from './components/EntryTab';
import { SummaryTab } from './components/SummaryTab';
import { CalendarLogsTab } from './components/CalendarLogsTab';
import { AuditTab } from './components/AuditTab';
import { PartnersTab } from './components/PartnersTab';
import { RatesTab } from './components/RatesTab';
import { EditEntryModal } from './components/EditEntryModal';
import { ChangePinModal } from './components/ChangePinModal';
import { ShareCenterModal } from './components/ShareCenterModal';
import { PrintReportModal } from './components/PrintReportModal';
import { AddStationModal } from './components/AddStationModal';
import { EditInvestmentsModal } from './components/EditInvestmentsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { BankAccountsModal } from './components/BankAccountsModal';
import { GoogleDriveTab } from './components/GoogleDriveTab';
import { MarketPulseTab } from './components/MarketPulseTab';
import { LogDipTestModal } from './components/LogDipTestModal';
import { ImmediateAuditModal } from './components/ImmediateAuditModal';

export default function App() {
  // Authentication & Session
  const [session, setSession] = useState<UserSession | null>(() => StorageService.getSession());

  // Theme state: iPhone 18 Dark Titanium vs Light Ceramic
  const [theme, setTheme] = useState<AppTheme>(() => StorageService.getTheme());

  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Core App Data States
  const [entries, setEntries] = useState<StationEntry[]>(() => StorageService.getEntries());
  const [stationBalances, setStationBalances] = useState<StationBalance[]>(() => StorageService.getStationBalances());
  const [partners, setPartners] = useState<Partner[]>(() => StorageService.getPartners());
  const [withdrawals, setWithdrawals] = useState<PartnerWithdrawal[]>(() => StorageService.getWithdrawals());
  const [audits, setAudits] = useState<AuditRecord[]>(() => StorageService.getAudits());
  const [notifications, setNotifications] = useState<BroadcastNotification[]>(() => StorageService.getNotifications());
  const [fuelRates, setFuelRates] = useState<FuelRates>(() => StorageService.getFuelRates());
  const [rateHistory, setRateHistory] = useState<RateHistoryItem[]>(() => StorageService.getRateHistory());
  const [credentials, setCredentials] = useState<AppCredentials>(() => StorageService.getCredentials());
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => StorageService.getBankAccounts());
  const [bankDeposits, setBankDeposits] = useState<BankDepositRecord[]>(() => StorageService.getBankDeposits());
  const [creditLoans, setCreditLoans] = useState<CreditClientLoan[]>(() => StorageService.getCreditLoans());
  const [dipTests, setDipTests] = useState<DipTestRecord[]>(() => StorageService.getDipTests());
  const [dipSchedules, setDipSchedules] = useState<DipTestScheduleItem[]>(() => StorageService.getDipSchedules());
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutConfig>(() => StorageService.getDashboardLayout());
  const [immediateAuditResult, setImmediateAuditResult] = useState<ImmediateAuditResult | null>(null);

  // Modals state
  const [editingEntry, setEditingEntry] = useState<StationEntry | null>(null);
  const [editingStation, setEditingStation] = useState<StationBalance | null>(null);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isEditInvestmentsOpen, setIsEditInvestmentsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isLogDipTestOpen, setIsLogDipTestOpen] = useState(false);
  const [activeDipStation, setActiveDipStation] = useState<StationName | undefined>(undefined);

  // Sync state helper
  const reloadAllData = () => {
    setEntries(StorageService.getEntries());
    setStationBalances(StorageService.getStationBalances());
    setPartners(StorageService.getPartners());
    setWithdrawals(StorageService.getWithdrawals());
    setAudits(StorageService.getAudits());
    setNotifications(StorageService.getNotifications());
    setFuelRates(StorageService.getFuelRates());
    setRateHistory(StorageService.getRateHistory());
    setCredentials(StorageService.getCredentials());
    setBankAccounts(StorageService.getBankAccounts());
    setBankDeposits(StorageService.getBankDeposits());
    setCreditLoans(StorageService.getCreditLoans());
    setDipTests(StorageService.getDipTests());
    setDipSchedules(StorageService.getDipSchedules());
    setDashboardLayout(StorageService.getDashboardLayout());
  };

  const handleAddBankAccount = (acc: Omit<BankAccount, 'id' | 'createdAt'>) => {
    StorageService.addBankAccount(acc);
    reloadAllData();
  };

  const handleBankDeposit = (dep: Omit<BankDepositRecord, 'id' | 'createdAt'>) => {
    const res = StorageService.recordBankDeposit(dep);
    reloadAllData();
    if (res?.auditResult && !res.auditResult.passed && res.auditResult.anomalies.length > 0) {
      setImmediateAuditResult(res.auditResult);
    }
  };

  const handleOpenDipTestModal = (station?: StationName) => {
    setActiveDipStation(station);
    setIsLogDipTestOpen(true);
  };

  const handleSaveDipTest = (rec: Omit<DipTestRecord, 'id' | 'createdAt'>) => {
    const { auditResult } = StorageService.addDipTestRecord(rec, session?.name || 'Dip Attendant');
    reloadAllData();
    if (auditResult && !auditResult.passed && auditResult.anomalies.length > 0) {
      setImmediateAuditResult(auditResult);
    }
  };

  const handleSaveLayoutConfig = (newConfig: DashboardLayoutConfig) => {
    StorageService.saveDashboardLayout(newConfig);
    setDashboardLayout(newConfig);
  };

  const handleResetLayoutConfig = () => {
    const def = StorageService.resetDashboardLayout();
    setDashboardLayout(def);
  };

  const handleAddCreditLoan = (loan: Omit<CreditClientLoan, 'id'>) => {
    StorageService.addCreditLoan(loan);
    reloadAllData();
  };

  const handleClearAllAudits = () => {
    StorageService.clearAllAudits(session?.name || 'CEO Jalees');
    reloadAllData();
  };

  // Theme toggle cycling through all supported light and dark themes
  const handleToggleTheme = () => {
    const themeCycle: AppTheme[] = ['iphone-light', 'nordic-light', 'sandstone-light', 'iphone-dark', 'emerald-luxury', 'midnight-amber'];
    const currentIndex = themeCycle.indexOf(theme);
    const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
    setTheme(nextTheme);
    StorageService.setTheme(nextTheme);
  };

  // Login handler
  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    StorageService.saveSession(newSession);
  };

  // Lock terminal / Logout handler
  const handleLock = () => {
    setSession(null);
    StorageService.clearSession();
  };

  // MANDATED ACTION: Reset SWAT 1 and SWAT 2
  const handleResetSwat = () => {
    if (session?.role !== 'ceo_jalees') {
      alert('Unauthorized. Only CEO / Admin Jalees can reset SWAT 1 & SWAT 2 sales and purchases.');
      return;
    }

    if (window.confirm('Confirm Reset: Are you sure you want to reset all entries of SWAT 1 and SWAT 2 sales and purchases to 0?')) {
      StorageService.resetSwat1AndSwat2(session.name);
      reloadAllData();
      alert('All sales and purchases entries for SWAT 1 and SWAT 2 have been successfully reset to zero.');
    }
  };

  // MANDATED ACTION: Save entry
  const handleSaveEntry = (newEntryData: Omit<StationEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!session?.canEdit) {
      alert('Action blocked: Entry privileges are revoked for your role.');
      return;
    }
    const { auditResult } = StorageService.addEntry(newEntryData, session.name);
    reloadAllData();
    if (auditResult && !auditResult.passed && auditResult.anomalies.length > 0) {
      setImmediateAuditResult(auditResult);
    }
  };

  // MANDATED ACTION: Edit entry (CEO Jalees only)
  const handleUpdateEntry = (updated: StationEntry) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: Only CEO/Admin Jalees can edit entries.');
      return;
    }
    const { auditResult } = StorageService.updateEntry(updated, session.name);
    setEditingEntry(null);
    reloadAllData();
    if (auditResult && !auditResult.passed && auditResult.anomalies.length > 0) {
      setImmediateAuditResult(auditResult);
    }
  };

  // MANDATED ACTION: Delete entry (CEO Jalees only)
  const handleDeleteEntry = (entryId: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: Only CEO/Admin Jalees can delete entries.');
      return;
    }
    StorageService.deleteEntry(entryId, session.name);
    reloadAllData();
  };

  // MANDATED ACTION: Add Partner
  const handleAddPartner = (partnerData: Omit<Partner, 'id' | 'joinedDate'>) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can add partners.');
      return;
    }
    StorageService.addPartner(partnerData, session.name);
    reloadAllData();
  };

  // Partner Management: Update Partner Details & Designation
  const handleUpdatePartner = (partner: Partner) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can edit partner profiles and designations.');
      return;
    }
    StorageService.updatePartner(partner, session.name);
    reloadAllData();
  };

  // Partner Capital Adjustment (Add Investment / Withdraw Capital)
  const handleAdjustPartnerCapital = (
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'; reference?: string; notes?: string }
  ) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Capital adjustments require CEO Jalees authorization.');
      return;
    }
    StorageService.adjustPartnerCapital(partnerId, action, amount, details, session.name);
    reloadAllData();
  };

  // Partner Profit Adjustment (Add Profit / Withdraw Profit)
  const handleAdjustPartnerProfit = (
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque'; reference?: string; notes?: string }
  ) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Profit adjustments require CEO Jalees authorization.');
      return;
    }
    StorageService.adjustPartnerProfit(partnerId, action, amount, details, session.name);
    reloadAllData();
  };

  // MANDATED ACTION: Delete Partner
  const handleDeletePartner = (partnerId: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can delete partners.');
      return;
    }
    StorageService.deletePartner(partnerId, session.name);
    reloadAllData();
  };

  // MANDATED ACTION: Record Profit Withdrawal
  const handleRecordWithdrawal = (withdrawalData: Omit<PartnerWithdrawal, 'id' | 'createdAt' | 'recordedBy'>) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can record profit withdrawals.');
      return;
    }
    const res = StorageService.addWithdrawal(withdrawalData, session.name);
    reloadAllData();
    if (res?.auditResult && !res.auditResult.passed && res.auditResult.anomalies.length > 0) {
      setImmediateAuditResult(res.auditResult);
    }
  };

  // MANDATED ACTION: Update Audit Directive Status
  const handleUpdateAuditStatus = (auditId: string, status: AuditStatus, notes?: string) => {
    StorageService.updateAuditStatus(auditId, status, notes, session?.name || 'Authorized User');
    reloadAllData();
  };

  // Save Fuel Rates
  const handleSaveRates = (rates: FuelRates) => {
    if (!session?.canEditRates) {
      alert('Rate editing requires CEO Jalees authority.');
      return;
    }
    StorageService.saveFuelRates(rates, session.name);
    reloadAllData();
  };

  // Save Credentials (PINs)
  const handleSaveCredentials = (updatedCreds: AppCredentials) => {
    StorageService.setCredentials(updatedCreds);
    setCredentials(updatedCreds);
    reloadAllData();
  };

  // Station Management: Add New Station
  const handleAddStation = (newStation: StationBalance) => {
    StorageService.addStation(newStation, session?.name || 'CEO Admin Jalees');
    reloadAllData();
  };

  // Station Management: Update Station (CEO Jalees only)
  const handleUpdateStation = (updatedStation: StationBalance) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can edit station infrastructure.');
      return;
    }
    StorageService.updateStation(updatedStation, session.name);
    reloadAllData();
    setEditingStation(null);
  };

  // Station Management: Delete Station (CEO Jalees only)
  const handleDeleteStation = (stationName: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can delete or decommission a gas station.');
      return;
    }
    StorageService.deleteStation(stationName, session.name);
    reloadAllData();
    if (editingStation?.station === stationName) {
      setEditingStation(null);
    }
  };

  // Station Management: Toggle Active / Inactive status
  const handleToggleStationStatus = (stationName: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Only CEO Jalees can toggle station active/inactive status.');
      return;
    }
    StorageService.toggleStationStatus(stationName, session.name);
    reloadAllData();
  };

  // Investment Overrides: Station level
  const handleOverrideStationInvestment = (stationName: string, allocatedInvestment: number, cashOnHand: number) => {
    StorageService.overrideStationInvestment(stationName, allocatedInvestment, cashOnHand, session?.name || 'CEO Admin Jalees');
    reloadAllData();
  };

  // Investment Overrides: Partner level
  const handleOverridePartnerInvestment = (partnerId: string, investment: number) => {
    StorageService.overridePartnerInvestment(partnerId, investment, session?.name || 'CEO Admin Jalees');
    reloadAllData();
  };

  // Notifications Management
  const handleMarkNotificationRead = (id: string) => {
    StorageService.markNotificationRead(id);
    reloadAllData();
  };

  const handleMarkAllNotificationsRead = () => {
    StorageService.markAllNotificationsRead();
    reloadAllData();
  };

  const handleClearAllNotifications = () => {
    StorageService.clearAllNotifications();
    reloadAllData();
  };

  const handleDeleteNotification = (id: string) => {
    StorageService.deleteNotification(id);
    reloadAllData();
  };

  const handleDeleteAudit = (id: string) => {
    StorageService.deleteAudit(id);
    reloadAllData();
  };

  // Bank Accounts & Deposits CRUD (Admin / CEO Jalees authority)
  const handleUpdateBankAccount = (account: BankAccount) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to edit bank account details.');
      return;
    }
    StorageService.updateBankAccount(account, session.name);
    reloadAllData();
  };

  const handleDeleteBankAccount = (id: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to delete bank accounts.');
      return;
    }
    StorageService.deleteBankAccount(id, session.name);
    reloadAllData();
  };

  const handleUpdateBankDeposit = (deposit: BankDepositRecord) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to edit bank deposits.');
      return;
    }
    StorageService.updateBankDeposit(deposit, session.name);
    reloadAllData();
  };

  const handleDeleteBankDeposit = (id: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to delete bank deposits.');
      return;
    }
    StorageService.deleteBankDeposit(id, session.name);
    reloadAllData();
  };

  // Partner Withdrawal / Disbursement CRUD (Admin / CEO Jalees authority)
  const handleUpdateWithdrawal = (withdrawal: PartnerWithdrawal) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to edit partner disbursements.');
      return;
    }
    StorageService.updateWithdrawal(withdrawal, session.name);
    reloadAllData();
  };

  const handleDeleteWithdrawal = (id: string) => {
    if (session?.role !== 'ceo_jalees') {
      alert('Action blocked: CEO or Admin authority required to delete partner disbursements.');
      return;
    }
    StorageService.deleteWithdrawal(id, session.name);
    reloadAllData();
  };

  // Import JSON Backup
  const handleImportBackup = (jsonString: string) => {
    const res = StorageService.importData(jsonString);
    if (res.success) {
      reloadAllData();
      alert('Data backup successfully restored!');
    } else {
      alert(`Import failed: ${res.error}`);
    }
  };

  // If not logged in, display the PIN login screen
  if (!session) {
    return (
      <PinLogin
        credentials={credentials}
        onLoginSuccess={handleLogin}
      />
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        theme === 'iphone-light'
          ? 'bg-slate-100 text-slate-900 selection:bg-blue-500 selection:text-white'
          : theme === 'nordic-light'
          ? 'bg-[#f4f6f9] text-zinc-900 selection:bg-sky-500 selection:text-white'
          : theme === 'sandstone-light'
          ? 'bg-[#f7f4ed] text-stone-900 selection:bg-amber-600 selection:text-white'
          : theme === 'emerald-luxury'
          ? 'bg-[#051f16] text-emerald-100 selection:bg-emerald-500 selection:text-white'
          : theme === 'midnight-amber'
          ? 'bg-[#0c0d12] text-amber-100 selection:bg-amber-500 selection:text-black'
          : 'bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white'
      }`}
    >
      {/* Global Navigation Header with Dynamic Island & iPhone 18 Controls */}
      <HeaderNav
        session={session}
        theme={theme}
        currentTab={currentTab}
        stationCount={stationBalances.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onSelectTab={setCurrentTab}
        onToggleTheme={handleToggleTheme}
        onLock={handleLock}
        onOpenShareModal={() => setIsShareOpen(true)}
        onOpenPrintModal={() => setIsPrintOpen(true)}
        onOpenPinModal={() => setIsChangePinOpen(true)}
        onOpenAddStationModal={() => setIsAddStationOpen(true)}
        onOpenInvestmentsModal={() => setIsEditInvestmentsOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
        onOpenBankModal={() => setIsBankModalOpen(true)}
        onOpenDipTestModal={() => handleOpenDipTestModal()}
        onResetSwatData={handleResetSwat}
      />

      {/* Main Responsive Tab Navigation Bar (Desktop & Mobile Dock) */}
      <TabsNav
        currentTab={currentTab}
        theme={theme}
        onSelectTab={setCurrentTab}
        auditAlertCount={audits.filter(a => a.status === 'Pending' || a.status === 'Audit Ordered').length}
      />

      {/* Main Tab Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'home' && (
          <HomeTab
            session={session}
            entries={entries}
            stationBalances={stationBalances}
            notifications={notifications}
            dipTests={dipTests}
            dipSchedules={dipSchedules}
            layoutConfig={dashboardLayout}
            theme={theme}
            onNavigateToTab={setCurrentTab}
            onResetSwatData={handleResetSwat}
            onEditStation={st => setEditingStation(st)}
            onOpenBankModal={() => setIsBankModalOpen(true)}
            onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
            onOpenDipTestModal={handleOpenDipTestModal}
            onSaveLayoutConfig={handleSaveLayoutConfig}
            onResetLayoutConfig={handleResetLayoutConfig}
          />
        )}

        {currentTab === 'market_pulse' && (
          <MarketPulseTab
            session={session}
            theme={theme}
            stationBalances={stationBalances}
            fuelRates={fuelRates}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'entry' && (
          <EntryTab
            session={session}
            rates={fuelRates}
            stationBalances={stationBalances}
            theme={theme}
            bankAccounts={bankAccounts}
            initialCreditLoans={creditLoans}
            onSaveEntry={handleSaveEntry}
            onNavigateToSummary={() => setCurrentTab('summary')}
            onDirectBankDeposit={handleBankDeposit}
            onSaveCreditLoan={handleAddCreditLoan}
            onOpenPrintModal={() => setIsPrintOpen(true)}
          />
        )}

        {currentTab === 'summary' && (
          <SummaryTab
            session={session}
            entries={entries}
            stationBalances={stationBalances}
            theme={theme}
            onToggleStationStatus={handleToggleStationStatus}
            onEditStation={st => setEditingStation(st)}
            onDeleteStation={handleDeleteStation}
            onOpenAddStationModal={() => setIsAddStationOpen(true)}
            onEditEntry={entry => setEditingEntry(entry)}
            onDeleteEntry={handleDeleteEntry}
            onResetSwatData={handleResetSwat}
          />
        )}

        {currentTab === 'logs' && (
          <CalendarLogsTab
            session={session}
            entries={entries}
            audits={audits}
            stationBalances={stationBalances}
            theme={theme}
            onEditEntry={entry => setEditingEntry(entry)}
            onDeleteEntry={handleDeleteEntry}
            onUpdateAuditStatus={handleUpdateAuditStatus}
          />
        )}

        {currentTab === 'audit' && (
          <AuditTab
            session={session}
            audits={audits}
            notifications={notifications}
            stationBalances={stationBalances}
            entries={entries}
            onUpdateAuditStatus={handleUpdateAuditStatus}
            onDeleteAudit={handleDeleteAudit}
            onClearAllAudits={handleClearAllAudits}
            onDeleteNotification={handleDeleteNotification}
            onClearAllNotifications={handleClearAllNotifications}
          />
        )}

        {currentTab === 'partners' && (
          <PartnersTab
            session={session}
            partners={partners}
            withdrawals={withdrawals}
            entries={entries}
            stationBalances={stationBalances}
            bankAccounts={bankAccounts}
            bankDeposits={bankDeposits}
            creditLoans={creditLoans}
            audits={audits}
            rates={fuelRates}
            onAddPartner={handleAddPartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
            onRecordWithdrawal={handleRecordWithdrawal}
            onAdjustPartnerCapital={handleAdjustPartnerCapital}
            onAdjustPartnerProfit={handleAdjustPartnerProfit}
            onUpdateWithdrawal={handleUpdateWithdrawal}
            onDeleteWithdrawal={handleDeleteWithdrawal}
            onOpenPrintModal={() => setIsPrintOpen(true)}
          />
        )}

        {currentTab === 'rates' && (
          <RatesTab
            session={session}
            rates={fuelRates}
            rateHistory={rateHistory}
            onSaveRates={handleSaveRates}
          />
        )}

        {currentTab === 'drive' && (
          <GoogleDriveTab
            session={session}
            theme={theme}
            entries={entries}
            stationBalances={stationBalances}
            partners={partners}
            withdrawals={withdrawals}
            bankAccounts={bankAccounts}
            bankDeposits={bankDeposits}
            creditLoans={creditLoans}
            audits={audits}
            rates={fuelRates}
            onRestoreBackup={handleImportBackup}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer
        className={`border-t py-4 px-6 text-center text-xs no-print transition-colors ${
          isLight
            ? 'border-slate-300 bg-white/80 text-slate-500'
            : 'border-slate-900 bg-slate-950/80 text-slate-400'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Kashfi Bro Holdings • Petroleum Operations & Partner Financial Management System (iPhone 18 Pro)
          </div>
          <div className="flex items-center gap-3">
            <span>Terminal Operator: <b className={isLight ? 'text-slate-800' : 'text-slate-200'}>{session.name} ({session.role})</b></span>
            <span>•</span>
            <span>Theme: <b className="text-blue-500 capitalize">{theme.replace('-', ' ')}</b></span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Edit Entry Modal (CEO Jalees only) */}
      {editingEntry && (
        <EditEntryModal
          isOpen={true}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleUpdateEntry}
          stations={stationBalances}
          theme={theme}
        />
      )}

      {/* 2. Change PIN Modal (CEO Jalees only) */}
      {isChangePinOpen && (
        <ChangePinModal
          isOpen={true}
          credentials={credentials}
          currentSession={session}
          onClose={() => setIsChangePinOpen(false)}
          onSaveCredentials={handleSaveCredentials}
        />
      )}

      {/* 3. Share & Export Center Modal */}
      {isShareOpen && (
        <ShareCenterModal
          isOpen={true}
          onClose={() => setIsShareOpen(false)}
          session={session}
          entries={entries}
          partners={partners}
          withdrawals={withdrawals}
          stationBalances={stationBalances}
          rates={fuelRates}
          audits={audits}
          onOpenPrintModal={() => {
            setIsShareOpen(false);
            setIsPrintOpen(true);
          }}
          onImportBackup={handleImportBackup}
        />
      )}

      {/* 4. Print & PDF Financial Report Modal */}
      {isPrintOpen && (
        <PrintReportModal
          isOpen={true}
          onClose={() => setIsPrintOpen(false)}
          session={session}
          entries={entries}
          stationBalances={stationBalances}
          partners={partners}
          withdrawals={withdrawals}
          rates={fuelRates}
          audits={audits}
          bankAccounts={bankAccounts}
          bankDeposits={bankDeposits}
          creditLoans={creditLoans}
        />
      )}

      {/* 5. Add / Edit Gas Station Modal (CEO Jalees only) */}
      {(isAddStationOpen || editingStation) && (
        <AddStationModal
          isOpen={true}
          initialStation={editingStation || undefined}
          onClose={() => {
            setIsAddStationOpen(false);
            setEditingStation(null);
          }}
          onAddStation={handleAddStation}
          onUpdateStation={handleUpdateStation}
          onDeleteStation={handleDeleteStation}
        />
      )}

      {/* 6. Edit Investments with Override Authority (CEO Jalees only) */}
      {isEditInvestmentsOpen && (
        <EditInvestmentsModal
          isOpen={true}
          onClose={() => setIsEditInvestmentsOpen(false)}
          stationBalances={stationBalances}
          partners={partners}
          onOverrideStation={handleOverrideStationInvestment}
          onOverridePartner={handleOverridePartnerInvestment}
        />
      )}

      {/* 7. Notifications Log Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          isOpen={true}
          theme={theme}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationRead}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onClearAll={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
        />
      )}

      {/* 8. Bank Accounts & Daily Treasury Modal */}
      {isBankModalOpen && (
        <BankAccountsModal
          isOpen={true}
          onClose={() => setIsBankModalOpen(false)}
          bankAccounts={bankAccounts}
          deposits={bankDeposits}
          stationBalances={stationBalances}
          entries={entries}
          session={session}
          onAddBankAccount={handleAddBankAccount}
          onRecordDeposit={handleBankDeposit}
          onUpdateBankAccount={handleUpdateBankAccount}
          onDeleteBankAccount={handleDeleteBankAccount}
          onUpdateBankDeposit={handleUpdateBankDeposit}
          onDeleteBankDeposit={handleDeleteBankDeposit}
        />
      )}

      {/* 9. Physical Dip Test & Underground Calibration Modal */}
      {isLogDipTestOpen && (
        <LogDipTestModal
          isOpen={true}
          onClose={() => {
            setIsLogDipTestOpen(false);
            setActiveDipStation(undefined);
          }}
          stationBalances={stationBalances}
          initialStation={activeDipStation}
          onSaveRecord={handleSaveDipTest}
          theme={theme}
        />
      )}

      {/* 10. Automated Real-Time Audit Irregularity Alert Modal */}
      {immediateAuditResult && (
        <ImmediateAuditModal
          isOpen={true}
          result={immediateAuditResult}
          onClose={() => setImmediateAuditResult(null)}
          onNavigateToAuditCenter={() => {
            setImmediateAuditResult(null);
            setCurrentTab('audit');
          }}
          theme={theme}
        />
      )}
    </div>
  );
}
