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
  PartnerTransaction,
  PartnerWithdrawal,
  RateHistoryItem,
  StationBalance,
  StationEntry,
  StationName,
  UserSession,
} from '../types';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  INITIAL_AUDITS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_DEPOSITS,
  INITIAL_CREDENTIALS,
  INITIAL_CREDIT_LOANS,
  INITIAL_DIP_SCHEDULES,
  INITIAL_DIP_TESTS,
  INITIAL_ENTRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PARTNERS,
  INITIAL_RATES,
  INITIAL_STATION_BALANCES,
  INITIAL_WITHDRAWALS,
} from '../mockData';
import { AuditEngine } from './auditEngine';

const KEYS = {
  THEME: 'kbh_theme_v2',
  SESSION: 'kbh_session_v2',
  CREDENTIALS: 'kbh_credentials_v2',
  ENTRIES: 'kbh_entries_v2',
  PARTNERS: 'kbh_partners_v2',
  WITHDRAWALS: 'kbh_withdrawals_v2',
  PARTNER_TRANSACTIONS: 'kbh_partner_transactions_v2',
  RATES: 'kbh_rates_v2',
  RATE_HISTORY: 'kbh_rate_history_v2',
  STATION_BALANCES: 'kbh_station_balances_v2',
  AUDITS: 'kbh_audits_v2',
  NOTIFICATIONS: 'kbh_notifications_v2',
  BANK_ACCOUNTS: 'kbh_bank_accounts_v2',
  BANK_DEPOSITS: 'kbh_bank_deposits_v2',
  CREDIT_LOANS: 'kbh_credit_loans_v2',
  DIP_TESTS: 'kbh_dip_tests_v2',
  DIP_SCHEDULES: 'kbh_dip_schedules_v2',
  DASHBOARD_LAYOUT: 'kbh_dashboard_layout_v2',
};

export const StorageService = {
  getTheme(): AppTheme {
    const saved = localStorage.getItem(KEYS.THEME);
    if (
      saved === 'iphone-light' ||
      saved === 'iphone-dark' ||
      saved === 'emerald-luxury' ||
      saved === 'midnight-amber'
    ) {
      return saved as AppTheme;
    }
    return 'iphone-dark';
  },

  setTheme(theme: AppTheme): void {
    localStorage.setItem(KEYS.THEME, theme);
  },

  getSession(): UserSession | null {
    const data = localStorage.getItem(KEYS.SESSION);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveSession(session: UserSession): void {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(KEYS.SESSION);
  },

  getCredentials(): AppCredentials {
    const data = localStorage.getItem(KEYS.CREDENTIALS);
    if (!data) {
      localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(INITIAL_CREDENTIALS));
      return INITIAL_CREDENTIALS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CREDENTIALS;
    }
  },

  setCredentials(credentials: AppCredentials): void {
    localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(credentials));
  },

  getEntries(): StationEntry[] {
    const today = new Date().toISOString().split('T')[0];
    const data = localStorage.getItem(KEYS.ENTRIES);
    if (!data) {
      localStorage.setItem(KEYS.ENTRIES, JSON.stringify(INITIAL_ENTRIES));
      return INITIAL_ENTRIES;
    }
    try {
      const parsed: StationEntry[] = JSON.parse(data);
      // Filter out any entries before today as explicitly requested
      const filtered = parsed.filter(e => e.date >= today);
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.ENTRIES, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return INITIAL_ENTRIES;
    }
  },

  setEntries(entries: StationEntry[]): void {
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
  },

  purgePreTodayData(actor = 'CEO Jalees'): { purgedEntries: number; purgedAudits: number } {
    const today = new Date().toISOString().split('T')[0];
    const entries = this.getEntries();
    const audits = this.getAudits();
    const notifs = this.getNotifications();

    const filteredEntries = entries.filter(e => e.date >= today);
    const filteredAudits = audits.filter(a => a.date >= today);
    const filteredNotifs = notifs.filter(n => n.timestamp.split('T')[0] >= today);

    const purgedEntries = entries.length - filteredEntries.length;
    const purgedAudits = audits.length - filteredAudits.length;

    this.setEntries(filteredEntries);
    this.setAudits(filteredAudits);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filteredNotifs));

    this.addNotification({
      title: 'Historical Data Purged',
      message: `All records and entries prior to ${today} were purged. Active entries: ${filteredEntries.length}.`,
      type: 'system',
      actor,
    });

    return { purgedEntries, purgedAudits };
  },

  resetSwat1AndSwat2(actor = 'CEO Jalees'): StationEntry[] {
    const current = this.getEntries();
    // Filter out all entries for SWAT 1 and SWAT 2
    const filtered = current.filter(e => e.station !== 'SWAT 1' && e.station !== 'SWAT 2');
    this.setEntries(filtered);
    
    // Also reset their investments to zero
    this.resetSwatInvestments(actor);

    this.addNotification({
      title: 'SWAT 1 & SWAT 2 Data Reset',
      message: 'All sales, purchases, and investments for SWAT 1 and SWAT 2 were reset to 0.',
      type: 'entry_reset',
      actor,
      station: 'SWAT 1',
    });
    return filtered;
  },

  resetSwatInvestments(actor = 'CEO Jalees'): StationBalance[] {
    const current = this.getStationBalances();
    const updated = current.map(s => {
      if (s.station === 'SWAT 1' || s.station === 'SWAT 2') {
        return {
          ...s,
          allocatedInvestment: 0,
          cashOnHand: 0,
        };
      }
      return s;
    });
    this.setStationBalances(updated);
    return updated;
  },

  resetAllInvestments(actor = 'CEO Jalees'): { stations: StationBalance[]; partners: Partner[] } {
    const stations = this.getStationBalances().map(s => ({
      ...s,
      allocatedInvestment: 0,
      cashOnHand: 0,
    }));
    this.setStationBalances(stations);

    const partners = this.getPartners().map(p => ({
      ...p,
      investment: 0,
    }));
    this.setPartners(partners);

    this.addNotification({
      title: 'All Network Capital Reset to Zero',
      message: `${actor} reset all station allocated capital, cash on hand, and partner investments to 0.`,
      type: 'investment_override',
      actor,
    });

    return { stations, partners };
  },

  addEntry(
    entryData: Omit<StationEntry, 'id' | 'createdAt' | 'createdBy'>, 
    actor = 'CEO Jalees'
  ): { entry: StationEntry; auditResult: ImmediateAuditResult } {
    const current = this.getEntries();
    const newEntry: StationEntry = {
      ...entryData,
      id: 'entry-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: actor,
    };
    const updated = [newEntry, ...current];
    this.setEntries(updated);

    this.addNotification({
      title: `New Shift Entry: ${entryData.station}`,
      message: `${actor} recorded closing for ${entryData.date} (${entryData.shift || 'General Shift'}). Revenue: ₨${entryData.revenue.toLocaleString()}, Net Profit: ₨${entryData.netProfit.toLocaleString()}.`,
      type: 'new_entry',
      actor,
      station: entryData.station,
    });

    // Check inventory stock and notify if critical levels reached
    this.checkAndNotifyCriticalStock(actor);

    // -------------------------------------------------------------
    // IMMEDIATE AUTOMATED FORENSIC AUDIT TRIGGER
    // -------------------------------------------------------------
    const stationBalances = this.getStationBalances();
    const fuelRates = this.getRates();
    const auditResult = AuditEngine.auditEntryImmediately(newEntry, stationBalances, fuelRates, actor);

    if (!auditResult.passed && auditResult.anomalies.length > 0) {
      const audits = this.getAudits();
      const newAudits: AuditRecord[] = auditResult.anomalies.map((anom, idx) => ({
        id: 'aud-auto-' + Date.now() + '-' + idx,
        station: anom.station,
        date: anom.date,
        type: anom.type,
        title: anom.title,
        description: anom.recommendedAction || anom.irregularityNature,
        severity: anom.severity,
        varianceLiters: anom.varianceLiters,
        varianceAmount: anom.varianceAmount,
        irregularityNature: anom.irregularityNature,
        personResponsible: anom.personResponsible,
        status: 'Audit Ordered',
      }));

      this.setAudits([...newAudits, ...audits]);

      // Auto Audit Alert Notification
      auditResult.anomalies.forEach(anom => {
        this.addNotification({
          title: `🚨 AUTO AUDIT ALERT: ${anom.title}`,
          message: `${anom.irregularityNature} [Person Responsible: ${anom.personResponsible}]. Immediate action: ${anom.recommendedAction || 'Review logs.'}`,
          type: 'audit_auto_alert',
          actor: 'Automated Audit Sentinel',
          station: anom.station,
        });
      });
    }

    return { entry: newEntry, auditResult };
  },

  updateEntry(updatedEntry: StationEntry, actor = 'CEO Jalees'): { auditResult: ImmediateAuditResult } {
    const current = this.getEntries();
    const updated = current.map(e => (e.id === updatedEntry.id ? { ...updatedEntry, updatedAt: new Date().toISOString() } : e));
    this.setEntries(updated);

    this.addNotification({
      title: `Entry Edited: ${updatedEntry.station}`,
      message: `Entry for date ${updatedEntry.date} was modified by ${actor}.`,
      type: 'system',
      actor,
      station: updatedEntry.station,
    });

    // Run Immediate Forensic Audit on modified entry
    const stationBalances = this.getStationBalances();
    const fuelRates = this.getRates();
    const auditResult = AuditEngine.auditEntryImmediately(updatedEntry, stationBalances, fuelRates, actor);

    if (!auditResult.passed && auditResult.anomalies.length > 0) {
      const audits = this.getAudits();
      const newAudits: AuditRecord[] = auditResult.anomalies.map((anom, idx) => ({
        id: 'aud-auto-' + Date.now() + '-' + idx,
        station: anom.station,
        date: anom.date,
        type: anom.type,
        title: anom.title,
        description: anom.recommendedAction || anom.irregularityNature,
        severity: anom.severity,
        varianceLiters: anom.varianceLiters,
        varianceAmount: anom.varianceAmount,
        irregularityNature: anom.irregularityNature,
        personResponsible: anom.personResponsible,
        status: 'Audit Ordered',
      }));
      this.setAudits([...newAudits, ...audits]);

      auditResult.anomalies.forEach(anom => {
        this.addNotification({
          title: `🚨 AUTO AUDIT ALERT: ${anom.title}`,
          message: `${anom.irregularityNature} [Person Responsible: ${anom.personResponsible}].`,
          type: 'audit_auto_alert',
          actor: 'Automated Audit Sentinel',
          station: anom.station,
        });
      });
    }

    return { auditResult };
  },

  deleteEntry(id: string, actor = 'CEO Jalees'): void {
    const current = this.getEntries();
    const target = current.find(e => e.id === id);
    const updated = current.filter(e => e.id !== id);
    this.setEntries(updated);

    if (target) {
      this.addNotification({
        title: `Entry Deleted: ${target.station}`,
        message: `Closing entry for ${target.date} at ${target.station} was deleted by ${actor}.`,
        type: 'system',
        actor,
        station: target.station,
      });
    }
  },

  getPartners(): Partner[] {
    const data = localStorage.getItem(KEYS.PARTNERS);
    if (!data) {
      localStorage.setItem(KEYS.PARTNERS, JSON.stringify(INITIAL_PARTNERS));
      return INITIAL_PARTNERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PARTNERS;
    }
  },

  setPartners(partners: Partner[]): void {
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners));
  },

  addPartner(partnerData: Omit<Partner, 'id' | 'joinedDate'>, actor = 'CEO Jalees'): Partner {
    const current = this.getPartners();
    const newPartner: Partner = {
      ...partnerData,
      id: 'p-' + Date.now(),
      joinedDate: new Date().toISOString().split('T')[0],
      initialInvestment: partnerData.investment,
      capitalWithdrawals: 0,
      profitAdjustments: 0,
    };
    const updated = [...current, newPartner];
    this.setPartners(updated);

    this.addNotification({
      title: `Partner Added: ${newPartner.name}`,
      message: `${newPartner.name} was onboarded as equity partner with capital of ₨${newPartner.investment.toLocaleString()} and designation ${newPartner.role}.`,
      type: 'partner_change',
      actor,
    });

    return newPartner;
  },

  updatePartner(updatedPartner: Partner, actor = 'CEO Jalees'): void {
    const current = this.getPartners();
    const target = current.find(p => p.id === updatedPartner.id);
    const updated = current.map(p => (p.id === updatedPartner.id ? { ...p, ...updatedPartner } : p));
    this.setPartners(updated);

    this.addNotification({
      title: `Partner Profile Updated: ${updatedPartner.name}`,
      message: `${actor} updated ${updatedPartner.name}'s profile. Designation: ${updatedPartner.role}, Capital: ₨${updatedPartner.investment.toLocaleString()}.`,
      type: 'partner_change',
      actor,
    });
  },

  deletePartner(id: string, actor = 'CEO Jalees'): void {
    const current = this.getPartners();
    const target = current.find(p => p.id === id);
    const updated = current.filter(p => p.id !== id);
    this.setPartners(updated);

    if (target) {
      this.addNotification({
        title: `Partner Removed: ${target.name}`,
        message: `Partner record for ${target.name} (${target.role}) was removed from the system by ${actor}.`,
        type: 'partner_change',
        actor,
      });
    }
  },

  adjustPartnerCapital(
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: PartnerWithdrawal['paymentMode']; reference?: string; notes?: string }, 
    actor = 'CEO Jalees'
  ): void {
    const current = this.getPartners();
    const target = current.find(p => p.id === partnerId);
    if (!target) return;

    if (action === 'Add') {
      const updated = current.map(p => {
        if (p.id === partnerId) {
          return {
            ...p,
            investment: p.investment + amount,
          };
        }
        return p;
      });
      this.setPartners(updated);

      this.addPartnerTransaction({
        partnerId,
        partnerName: target.name,
        date: details.date,
        category: 'Investment',
        action: 'Add',
        amount,
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Capital injection',
        recordedBy: actor,
      });

      this.addNotification({
        title: `Capital Added: ${target.name}`,
        message: `Additional capital injection of ₨${amount.toLocaleString()} recorded for ${target.name} (${details.paymentMode}).`,
        type: 'investment_override',
        actor,
      });
    } else {
      // Withdraw Capital (Return of capital)
      const updated = current.map(p => {
        if (p.id === partnerId) {
          const newCapW = (p.capitalWithdrawals || 0) + amount;
          return {
            ...p,
            investment: Math.max(0, p.investment - amount),
            capitalWithdrawals: newCapW,
          };
        }
        return p;
      });
      this.setPartners(updated);

      this.addWithdrawal({
        partnerId,
        partnerName: target.name,
        date: details.date,
        amount,
        withdrawalType: 'Capital',
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Capital drawdown / return of capital',
      }, actor);

      this.addPartnerTransaction({
        partnerId,
        partnerName: target.name,
        date: details.date,
        category: 'Investment',
        action: 'Withdraw',
        amount,
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Capital drawdown / return of capital',
        recordedBy: actor,
      });
    }
  },

  adjustPartnerProfit(
    partnerId: string, 
    action: 'Add' | 'Withdraw', 
    amount: number, 
    details: { date: string; paymentMode: PartnerWithdrawal['paymentMode']; reference?: string; notes?: string }, 
    actor = 'CEO Jalees'
  ): void {
    const current = this.getPartners();
    const target = current.find(p => p.id === partnerId);
    if (!target) return;

    if (action === 'Add') {
      const updated = current.map(p => {
        if (p.id === partnerId) {
          return {
            ...p,
            profitAdjustments: (p.profitAdjustments || 0) + amount,
          };
        }
        return p;
      });
      this.setPartners(updated);

      this.addPartnerTransaction({
        partnerId,
        partnerName: target.name,
        date: details.date,
        category: 'Profit',
        action: 'Add',
        amount,
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Profit allocation credit / bonus',
        recordedBy: actor,
      });

      this.addNotification({
        title: `Profit Allocation: ${target.name}`,
        message: `Special profit credit of ₨${amount.toLocaleString()} allocated to ${target.name}.`,
        type: 'partner_change',
        actor,
      });
    } else {
      // Withdraw profit
      this.addWithdrawal({
        partnerId,
        partnerName: target.name,
        date: details.date,
        amount,
        withdrawalType: 'Profit',
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Profit withdrawal draw',
      }, actor);

      this.addPartnerTransaction({
        partnerId,
        partnerName: target.name,
        date: details.date,
        category: 'Profit',
        action: 'Withdraw',
        amount,
        paymentMode: details.paymentMode,
        reference: details.reference,
        notes: details.notes || 'Profit withdrawal draw',
        recordedBy: actor,
      });
    }
  },

  getPartnerTransactions(): PartnerTransaction[] {
    const data = localStorage.getItem(KEYS.PARTNER_TRANSACTIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setPartnerTransactions(txs: PartnerTransaction[]): void {
    localStorage.setItem(KEYS.PARTNER_TRANSACTIONS, JSON.stringify(txs));
  },

  addPartnerTransaction(txData: Omit<PartnerTransaction, 'id' | 'createdAt'>): PartnerTransaction {
    const current = this.getPartnerTransactions();
    const newTx: PartnerTransaction = {
      ...txData,
      id: 'ptx-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.setPartnerTransactions([newTx, ...current]);
    return newTx;
  },

  overridePartnerInvestment(partnerId: string, newInvestment: number, actor = 'CEO Jalees'): void {
    const current = this.getPartners();
    const target = current.find(p => p.id === partnerId);
    const updated = current.map(p => (p.id === partnerId ? { ...p, investment: newInvestment } : p));
    this.setPartners(updated);

    this.addNotification({
      title: `Partner Capital Override: ${target?.name || 'Partner'}`,
      message: `${actor} exercised CEO Override Authority to adjust ${target?.name}'s capital investment to ₨${newInvestment.toLocaleString()}.`,
      type: 'investment_override',
      actor,
    });
  },

  getWithdrawals(): PartnerWithdrawal[] {
    const data = localStorage.getItem(KEYS.WITHDRAWALS);
    if (!data) {
      localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
      return INITIAL_WITHDRAWALS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_WITHDRAWALS;
    }
  },

  setWithdrawals(withdrawals: PartnerWithdrawal[]): void {
    localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  },

  addWithdrawal(wData: Omit<PartnerWithdrawal, 'id' | 'createdAt' | 'recordedBy'>, actor = 'CEO Jalees'): PartnerWithdrawal {
    const current = this.getWithdrawals();
    const newW: PartnerWithdrawal = {
      ...wData,
      id: 'w-' + Date.now(),
      createdAt: new Date().toISOString(),
      recordedBy: actor,
    };
    const updated = [newW, ...current];
    this.setWithdrawals(updated);

    this.addNotification({
      title: `${wData.withdrawalType === 'Capital' ? 'Capital' : 'Profit'} Withdrawal: ${wData.partnerName}`,
      message: `${wData.withdrawalType === 'Capital' ? 'Capital return' : 'Profit withdrawal'} of ₨${wData.amount.toLocaleString()} recorded for ${wData.partnerName} (${wData.paymentMode}).`,
      type: 'withdrawal',
      actor,
    });

    return newW;
  },

  updateWithdrawal(updatedW: PartnerWithdrawal, actor = 'CEO Jalees'): void {
    const current = this.getWithdrawals();
    const prev = current.find(w => w.id === updatedW.id);
    if (!prev) return;

    // Adjust partner capital if capital withdrawal amount changed
    const partnerList = this.getPartners();
    const partner = partnerList.find(p => p.id === updatedW.partnerId);
    if (partner) {
      let invDelta = 0;
      let capDelta = 0;

      const wasCapital = prev.withdrawalType === 'Capital';
      const isCapital = updatedW.withdrawalType === 'Capital';

      if (wasCapital && isCapital) {
        // Delta in capital withdrawal
        const diff = updatedW.amount - prev.amount;
        invDelta = -diff;
        capDelta = diff;
      } else if (!wasCapital && isCapital) {
        // Changed from profit to capital withdrawal
        invDelta = -updatedW.amount;
        capDelta = updatedW.amount;
      } else if (wasCapital && !isCapital) {
        // Changed from capital to profit withdrawal
        invDelta = prev.amount;
        capDelta = -prev.amount;
      }

      if (invDelta !== 0 || capDelta !== 0) {
        const updatedPartners = partnerList.map(p => {
          if (p.id === partner.id) {
            return {
              ...p,
              investment: Math.max(0, p.investment + invDelta),
              capitalWithdrawals: Math.max(0, (p.capitalWithdrawals || 0) + capDelta),
            };
          }
          return p;
        });
        this.setPartners(updatedPartners);
      }
    }

    const updated = current.map(w => (w.id === updatedW.id ? { ...updatedW } : w));
    this.setWithdrawals(updated);

    // Sync matching PartnerTransaction
    const txs = this.getPartnerTransactions();
    const matchingTx = txs.find(t => t.partnerId === updatedW.partnerId && Math.abs(t.amount - prev.amount) < 1);
    if (matchingTx) {
      const updatedTxs = txs.map(t => t.id === matchingTx.id ? {
        ...t,
        amount: updatedW.amount,
        date: updatedW.date,
        paymentMode: updatedW.paymentMode,
        reference: updatedW.reference,
        notes: updatedW.notes,
        category: (updatedW.withdrawalType === 'Capital' ? 'Investment' : 'Profit') as 'Investment' | 'Profit',
      } : t);
      this.setPartnerTransactions(updatedTxs);
    }

    this.addNotification({
      title: `Disbursement Updated: ${updatedW.partnerName}`,
      message: `Transaction record updated to ₨${updatedW.amount.toLocaleString()} (${updatedW.paymentMode}, Ref: ${updatedW.reference || 'None'}) by ${actor}.`,
      type: 'partner_change',
      actor,
    });
  },

  deleteWithdrawal(withdrawalId: string, actor = 'CEO Jalees'): void {
    const current = this.getWithdrawals();
    const target = current.find(w => w.id === withdrawalId);
    if (!target) return;

    // Restore partner balance if it was a capital withdrawal
    if (target.withdrawalType === 'Capital') {
      const partnerList = this.getPartners();
      const updatedPartners = partnerList.map(p => {
        if (p.id === target.partnerId) {
          return {
            ...p,
            investment: p.investment + target.amount,
            capitalWithdrawals: Math.max(0, (p.capitalWithdrawals || 0) - target.amount),
          };
        }
        return p;
      });
      this.setPartners(updatedPartners);
    }

    const updated = current.filter(w => w.id !== withdrawalId);
    this.setWithdrawals(updated);

    // Sync matching partner transaction
    const txs = this.getPartnerTransactions();
    const updatedTxs = txs.filter(t => !(t.partnerId === target.partnerId && Math.abs(t.amount - target.amount) < 1));
    this.setPartnerTransactions(updatedTxs);

    this.addNotification({
      title: `Disbursement Record Deleted: ${target.partnerName}`,
      message: `Withdrawal of ₨${target.amount.toLocaleString()} (${target.withdrawalType || 'Profit'}) was removed by ${actor}.`,
      type: 'partner_change',
      actor,
    });
  },

  getRates(): FuelRates {
    const data = localStorage.getItem(KEYS.RATES);
    if (!data) {
      localStorage.setItem(KEYS.RATES, JSON.stringify(INITIAL_RATES));
      return INITIAL_RATES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_RATES;
    }
  },

  getFuelRates(): FuelRates {
    return this.getRates();
  },

  setRates(rates: FuelRates): void {
    localStorage.setItem(KEYS.RATES, JSON.stringify(rates));
    // Append to rate history
    const history = this.getRateHistory();
    const newItem: RateHistoryItem = {
      ...rates,
      id: 'rh-' + Date.now(),
      effectiveDate: new Date().toISOString(),
    };
    const updated = [newItem, ...history].slice(0, 30);
    localStorage.setItem(KEYS.RATE_HISTORY, JSON.stringify(updated));
  },

  saveFuelRates(rates: FuelRates, actor = 'CEO Jalees'): void {
    this.setRates(rates);
    this.addNotification({
      title: 'Fuel Benchmark Rates Revised',
      message: `OGRA/Company tariff updated by ${actor}. Petrol: ₨${rates.psr}/L (Cost ₨${rates.ppr}), Diesel: ₨${rates.dsr}/L (Cost ₨${rates.dpr})${rates.hosr ? `, Hi-Octane: ₨${rates.hosr}/L` : ''}.`,
      type: 'price_change',
      actor,
    });
  },

  getRateHistory(): RateHistoryItem[] {
    const data = localStorage.getItem(KEYS.RATE_HISTORY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  getStationBalances(): StationBalance[] {
    const data = localStorage.getItem(KEYS.STATION_BALANCES);
    if (!data) {
      localStorage.setItem(KEYS.STATION_BALANCES, JSON.stringify(INITIAL_STATION_BALANCES));
      return INITIAL_STATION_BALANCES;
    }
    try {
      const parsed = JSON.parse(data);
      // Ensure each station has status
      return parsed.map((s: StationBalance) => ({
        ...s,
        status: s.status || 'Active',
      }));
    } catch {
      return INITIAL_STATION_BALANCES;
    }
  },

  setStationBalances(balances: StationBalance[]): void {
    localStorage.setItem(KEYS.STATION_BALANCES, JSON.stringify(balances));
  },

  addStation(stationData: StationBalance, actor = 'CEO Jalees'): StationBalance {
    const current = this.getStationBalances();
    const newStation: StationBalance = {
      ...stationData,
      id: stationData.id || 'stn-' + Date.now(),
      status: stationData.status || 'Active',
    };
    const updated = [...current, newStation];
    this.setStationBalances(updated);

    this.addNotification({
      title: `New Station Commissioned: ${newStation.station}`,
      message: `${newStation.station} added with ${newStation.tanksCount || 2} tanks, ${newStation.dispensersCount || 2} dispensers, ${newStation.nozzlesCount || 4} nozzles, and capital of ₨${newStation.allocatedInvestment.toLocaleString()}.`,
      type: 'station_added',
      actor,
      station: newStation.station,
    });

    return newStation;
  },

  updateStation(updatedStation: StationBalance, oldStationName?: string, actor = 'CEO Jalees'): void {
    const current = this.getStationBalances();
    const oldName = oldStationName || updatedStation.station;
    const updated = current.map(s => {
      const match = (updatedStation.id && s.id === updatedStation.id) || s.station === oldName;
      if (match) {
        return {
          ...s,
          ...updatedStation,
          id: s.id || updatedStation.id || 'stn-' + Date.now(),
        };
      }
      return s;
    });
    this.setStationBalances(updated);

    // If station name changed, also synchronize corresponding entries and audits
    if (oldName && oldName !== updatedStation.station) {
      const entries = this.getEntries();
      const updatedEntries = entries.map(e => (e.station === oldName ? { ...e, station: updatedStation.station } : e));
      this.setEntries(updatedEntries);

      const audits = this.getAudits();
      const updatedAudits = audits.map(a => (a.station === oldName ? { ...a, station: updatedStation.station } : a));
      this.setAudits(updatedAudits);
    }

    this.addNotification({
      title: `Station Config Updated: ${updatedStation.station}`,
      message: `Station specifications (${updatedStation.tanksCount || 0} tanks, ${updatedStation.dispensersCount || 0} dispensers, ${updatedStation.nozzlesCount || 0} nozzles) updated by ${actor}.`,
      type: 'station_updated',
      actor,
      station: updatedStation.station,
    });
  },

  deleteStation(stationNameOrId: string, actor = 'CEO Jalees'): StationBalance | null {
    const current = this.getStationBalances();
    const target = current.find(s => s.station === stationNameOrId || s.id === stationNameOrId);
    if (!target) return null;

    const remaining = current.filter(s => s.station !== target.station && s.id !== target.id);
    this.setStationBalances(remaining);

    this.addNotification({
      title: `Station Decommissioned & Deleted: ${target.station}`,
      message: `${target.station} (${target.location || 'Site'}) was decommissioned and removed from the active station list by ${actor}.`,
      type: 'station_deleted',
      actor,
      station: target.station,
    });

    return target;
  },

  toggleStationStatus(stationName: string, actor = 'CEO Jalees'): StationBalance | null {
    const current = this.getStationBalances();
    let updatedTarget: StationBalance | null = null;
    const updated = current.map(s => {
      if (s.station === stationName) {
        const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        updatedTarget = { ...s, status: nextStatus };
        return updatedTarget;
      }
      return s;
    });
    this.setStationBalances(updated);

    if (updatedTarget) {
      const isNowActive = (updatedTarget as StationBalance).status === 'Active';
      this.addNotification({
        title: `Station Status Changed: ${stationName} is now ${(updatedTarget as StationBalance).status}`,
        message: `${stationName} was switched to ${(updatedTarget as StationBalance).status.toUpperCase()} by ${actor}. ${isNowActive ? 'Operations resumed.' : 'Sales entries paused.'}`,
        type: 'station_status',
        actor,
        station: stationName,
      });

      if (!isNowActive) {
        const audits = this.getAudits();
        const auditRecord: AuditRecord = {
          id: 'aud-stat-' + Date.now(),
          station: stationName,
          date: new Date().toISOString().split('T')[0],
          type: 'station_inactive',
          title: `Station Deactivated: ${stationName}`,
          description: `${stationName} has been flagged as Inactive by ${actor}. Audit verification of underground tanks and cash float required.`,
          severity: 'medium',
          status: 'Pending',
        };
        this.setAudits([auditRecord, ...audits]);
      }
    }

    return updatedTarget;
  },

  overrideStationInvestment(
    stationName: string,
    newAllocatedInvestment: number,
    newCashOnHand: number,
    actor = 'CEO Jalees'
  ): void {
    const current = this.getStationBalances();
    const updated = current.map(s => {
      if (s.station === stationName) {
        return {
          ...s,
          allocatedInvestment: newAllocatedInvestment,
          cashOnHand: newCashOnHand,
        };
      }
      return s;
    });
    this.setStationBalances(updated);

    this.addNotification({
      title: `Investment Override: ${stationName}`,
      message: `${actor} exercised CEO Override Authority to adjust ${stationName} capital to ₨${newAllocatedInvestment.toLocaleString()} and cash float to ₨${newCashOnHand.toLocaleString()}.`,
      type: 'investment_override',
      actor,
      station: stationName,
    });
  },

  getAudits(): AuditRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const data = localStorage.getItem(KEYS.AUDITS);
    if (!data) {
      localStorage.setItem(KEYS.AUDITS, JSON.stringify(INITIAL_AUDITS));
      return INITIAL_AUDITS;
    }
    try {
      const parsed: AuditRecord[] = JSON.parse(data);
      const filtered = parsed.filter(a => a.date >= today);
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.AUDITS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return INITIAL_AUDITS;
    }
  },

  setAudits(audits: AuditRecord[]): void {
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(audits));
  },

  deleteAudit(id: string, actor = 'CEO Jalees'): AuditRecord[] {
    const current = this.getAudits();
    const target = current.find(a => a.id === id);
    const updated = current.filter(a => a.id !== id);
    this.setAudits(updated);

    if (target) {
      this.addNotification({
        title: `Audit Resolved & Cleared: ${target.station}`,
        message: `Audit "${target.title}" for ${target.station} was cleared from active tracking by ${actor}.`,
        type: 'audit_action',
        actor,
        station: target.station,
      });
    }
    return updated;
  },

  updateAuditStatus(
    id: string,
    status: AuditStatus,
    notes?: string,
    actor = 'CEO Jalees'
  ): AuditRecord[] {
    const audits = this.getAudits();
    const updated = audits.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status,
          actionTakenBy: actor,
          actionTakenAt: new Date().toISOString(),
          actionNotes: notes || `Action updated to ${status} by ${actor}`,
        };
      }
      return a;
    });
    this.setAudits(updated);

    const target = audits.find(a => a.id === id);
    this.addNotification({
      title: `Audit Action: ${status}`,
      message: `${actor} marked "${target?.title || 'Audit Item'}" (${target?.station || 'Station'}) as "${status}". Note: ${notes || 'No extra notes provided.'}`,
      type: 'audit_action',
      actor,
      station: target?.station,
    });

    return updated;
  },

  clearAllAudits(actor = 'CEO Jalees'): void {
    localStorage.setItem(KEYS.AUDITS, JSON.stringify([]));
    this.addNotification({
      title: 'Audit Directives Reset',
      message: `All audit logs and security directives were cleared by ${actor}.`,
      type: 'system',
      actor,
    });
  },

  // -------------------------------------------------------------
  // BANK ACCOUNTS & TREASURY
  // -------------------------------------------------------------
  getBankAccounts(): BankAccount[] {
    const data = localStorage.getItem(KEYS.BANK_ACCOUNTS);
    if (!data) {
      localStorage.setItem(KEYS.BANK_ACCOUNTS, JSON.stringify(INITIAL_BANK_ACCOUNTS));
      return INITIAL_BANK_ACCOUNTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_BANK_ACCOUNTS;
    }
  },

  setBankAccounts(accounts: BankAccount[]): void {
    localStorage.setItem(KEYS.BANK_ACCOUNTS, JSON.stringify(accounts));
  },

  addBankAccount(account: Omit<BankAccount, 'id'>, actor = 'CEO Jalees'): BankAccount {
    const current = this.getBankAccounts();
    const newAccount: BankAccount = {
      ...account,
      id: 'bank-' + Date.now(),
    };
    const updated = [...current, newAccount];
    this.setBankAccounts(updated);

    this.addNotification({
      title: `Bank Account Registered: ${newAccount.bankName}`,
      message: `New account ${newAccount.accountNumber} (${newAccount.accountTitle}) registered into company treasury by ${actor}.`,
      type: 'system',
      actor,
    });

    return newAccount;
  },

  getBankDeposits(): BankDepositRecord[] {
    const data = localStorage.getItem(KEYS.BANK_DEPOSITS);
    if (!data) {
      localStorage.setItem(KEYS.BANK_DEPOSITS, JSON.stringify(INITIAL_BANK_DEPOSITS));
      return INITIAL_BANK_DEPOSITS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_BANK_DEPOSITS;
    }
  },

  setBankDeposits(deposits: BankDepositRecord[]): void {
    localStorage.setItem(KEYS.BANK_DEPOSITS, JSON.stringify(deposits));
  },

  recordBankDeposit(
    deposit: Omit<BankDepositRecord, 'id' | 'createdAt'>
  ): BankDepositRecord & { auditResult: ImmediateAuditResult; deposit: BankDepositRecord } {
    const currentDeposits = this.getBankDeposits();
    const newDeposit: BankDepositRecord = {
      ...deposit,
      id: 'dep-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.setBankDeposits([newDeposit, ...currentDeposits]);

    // 1. Credit target bank account balance
    const accounts = this.getBankAccounts();
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === deposit.bankAccountId) {
        return { ...acc, currentBalance: acc.currentBalance + deposit.amount };
      }
      return acc;
    });
    this.setBankAccounts(updatedAccounts);

    // 2. If it is Station Drawer Cash, deduct from station's cash on hand
    const stations = this.getStationBalances();
    if (deposit.depositType === 'Daily Cash') {
      const updatedStations = stations.map(st => {
        if (st.station === deposit.station) {
          const remainingCash = Math.max(0, st.cashOnHand - deposit.amount);
          return { ...st, cashOnHand: remainingCash };
        }
        return st;
      });
      this.setStationBalances(updatedStations);
    }

    this.addNotification({
      title: `Bank Deposit Credited: ₨${deposit.amount.toLocaleString()}`,
      message: `${deposit.station} credited ₨${deposit.amount.toLocaleString()} to ${deposit.bankName} (Slip: ${deposit.slipNumber}) by ${deposit.depositedBy}.`,
      type: 'bank_deposit',
      actor: deposit.depositedBy,
      station: deposit.station,
    });

    // -------------------------------------------------------------
    // IMMEDIATE AUDIT TRIGGER FOR TREASURY TRANSFERS
    // -------------------------------------------------------------
    const auditResult = AuditEngine.auditTransferImmediately(newDeposit, stations, deposit.depositedBy || 'Cashier');

    if (!auditResult.passed && auditResult.anomalies.length > 0) {
      const audits = this.getAudits();
      const newAudits: AuditRecord[] = auditResult.anomalies.map((anom, idx) => ({
        id: 'aud-auto-tx-' + Date.now() + '-' + idx,
        station: anom.station,
        date: anom.date,
        type: anom.type,
        title: anom.title,
        description: anom.recommendedAction || anom.irregularityNature,
        severity: anom.severity,
        varianceAmount: anom.varianceAmount,
        irregularityNature: anom.irregularityNature,
        personResponsible: anom.personResponsible,
        status: 'Audit Ordered',
      }));
      this.setAudits([...newAudits, ...audits]);

      auditResult.anomalies.forEach(anom => {
        this.addNotification({
          title: `🚨 AUTO AUDIT ALERT: ${anom.title}`,
          message: `${anom.irregularityNature} [Person Responsible: ${anom.personResponsible}].`,
          type: 'audit_auto_alert',
          actor: 'Automated Treasury Audit',
          station: anom.station,
        });
      });
    }

    return Object.assign(newDeposit, { auditResult, deposit: newDeposit });
  },

  updateBankAccount(account: BankAccount, actor = 'CEO Jalees'): void {
    const current = this.getBankAccounts();
    const updated = current.map(a => a.id === account.id ? { ...account } : a);
    this.setBankAccounts(updated);

    this.addNotification({
      title: `Bank Account Updated: ${account.bankName}`,
      message: `${account.bankName} (${account.accountNumber}) treasury profile updated by ${actor}.`,
      type: 'bank_update',
      actor,
    });
  },

  deleteBankAccount(accountId: string, actor = 'CEO Jalees'): void {
    const current = this.getBankAccounts();
    const target = current.find(a => a.id === accountId);
    const updated = current.filter(a => a.id !== accountId);
    this.setBankAccounts(updated);

    if (target) {
      this.addNotification({
        title: `Bank Account Removed: ${target.bankName}`,
        message: `Account ${target.accountNumber} (${target.accountTitle}) deleted from treasury registry by ${actor}.`,
        type: 'bank_deleted',
        actor,
      });
    }
  },

  updateBankDeposit(updatedDeposit: BankDepositRecord, actor = 'CEO Jalees'): void {
    const deposits = this.getBankDeposits();
    const prev = deposits.find(d => d.id === updatedDeposit.id);
    if (!prev) return;

    // 1. Revert previous bank balance & credit new bank balance
    const accounts = this.getBankAccounts();
    const updatedAccounts = accounts.map(acc => {
      let bal = acc.currentBalance;
      if (acc.id === prev.bankAccountId) {
        bal -= prev.amount;
      }
      if (acc.id === updatedDeposit.bankAccountId) {
        bal += updatedDeposit.amount;
      }
      return { ...acc, currentBalance: Math.max(0, bal) };
    });
    this.setBankAccounts(updatedAccounts);

    // 2. Adjust station cash float if type is Daily Cash
    const stations = this.getStationBalances();
    const updatedStations = stations.map(st => {
      let cash = st.cashOnHand;
      if (prev.depositType === 'Daily Cash' && st.station === prev.station) {
        cash += prev.amount; // restore old
      }
      if (updatedDeposit.depositType === 'Daily Cash' && st.station === updatedDeposit.station) {
        cash = Math.max(0, cash - updatedDeposit.amount); // deduct new
      }
      return { ...st, cashOnHand: cash };
    });
    this.setStationBalances(updatedStations);

    // 3. Save updated deposits list
    const newDeposits = deposits.map(d => d.id === updatedDeposit.id ? { ...updatedDeposit } : d);
    this.setBankDeposits(newDeposits);

    this.addNotification({
      title: `Bank Deposit Edited: ₨${updatedDeposit.amount.toLocaleString()}`,
      message: `Deposit slip ${updatedDeposit.slipNumber} for ${updatedDeposit.station} was adjusted by ${actor}.`,
      type: 'bank_update',
      actor,
      station: updatedDeposit.station,
    });
  },

  deleteBankDeposit(depositId: string, actor = 'CEO Jalees'): void {
    const deposits = this.getBankDeposits();
    const target = deposits.find(d => d.id === depositId);
    if (!target) return;

    // 1. Reverse amount from target bank account
    const accounts = this.getBankAccounts();
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === target.bankAccountId) {
        return { ...acc, currentBalance: Math.max(0, acc.currentBalance - target.amount) };
      }
      return acc;
    });
    this.setBankAccounts(updatedAccounts);

    // 2. Restore cash to station if Daily Cash
    if (target.depositType === 'Daily Cash') {
      const stations = this.getStationBalances();
      const updatedStations = stations.map(st => {
        if (st.station === target.station) {
          return { ...st, cashOnHand: st.cashOnHand + target.amount };
        }
        return st;
      });
      this.setStationBalances(updatedStations);
    }

    // 3. Delete from deposits list
    const updatedDeposits = deposits.filter(d => d.id !== depositId);
    this.setBankDeposits(updatedDeposits);

    this.addNotification({
      title: `Bank Deposit Reversed: ₨${target.amount.toLocaleString()}`,
      message: `Deposit slip ${target.slipNumber} (${target.bankName}) reversed and restored to ${target.station} cash float by ${actor}.`,
      type: 'bank_deleted',
      actor,
      station: target.station,
    });
  },

  checkAndNotifyCriticalStock(actor = 'Inventory Monitor'): BroadcastNotification[] {
    const stations = this.getStationBalances();
    const notifications = this.getNotifications();
    const today = new Date().toISOString().split('T')[0];
    const newAlerts: BroadcastNotification[] = [];

    stations.forEach(st => {
      if (!st.isActive) return;

      // Check Petrol
      const petrolRatio = st.petrolCapacity > 0 ? (st.petrolStock / st.petrolCapacity) : 1;
      if (petrolRatio <= 0.33 || st.petrolStock < 3000) {
        const alreadyNotified = notifications.some(n => 
          n.type === 'critical_stock' && 
          n.station === st.station && 
          n.title.includes('Petrol') &&
          n.timestamp.startsWith(today)
        );
        if (!alreadyNotified) {
          const notif = this.addNotification({
            title: `CRITICAL TANK STOCK: ${st.station} (Petrol)`,
            message: `Underground Petrol (Super 92) tank at ${st.station} is at ${(petrolRatio * 100).toFixed(0)}% (${st.petrolStock.toLocaleString()} L / ${st.petrolCapacity.toLocaleString()} L). Refill tanker dispatch required immediately!`,
            type: 'critical_stock',
            actor,
            station: st.station,
          });
          newAlerts.push(notif);
        }
      }

      // Check Diesel
      const dieselRatio = st.dieselCapacity > 0 ? (st.dieselStock / st.dieselCapacity) : 1;
      if (dieselRatio <= 0.33 || st.dieselStock < 3000) {
        const alreadyNotified = notifications.some(n => 
          n.type === 'critical_stock' && 
          n.station === st.station && 
          n.title.includes('Diesel') &&
          n.timestamp.startsWith(today)
        );
        if (!alreadyNotified) {
          const notif = this.addNotification({
            title: `CRITICAL TANK STOCK: ${st.station} (Diesel)`,
            message: `Underground HSD Diesel tank at ${st.station} is at ${(dieselRatio * 100).toFixed(0)}% (${st.dieselStock.toLocaleString()} L / ${st.dieselCapacity.toLocaleString()} L). Refill tanker dispatch required immediately!`,
            type: 'critical_stock',
            actor,
            station: st.station,
          });
          newAlerts.push(notif);
        }
      }

      // Check Hi-Octane if present
      if (st.hiOctaneCapacity && st.hiOctaneStock !== undefined && st.hiOctaneCapacity > 0) {
        const hoRatio = st.hiOctaneStock / st.hiOctaneCapacity;
        if (hoRatio <= 0.25 || st.hiOctaneStock < 1500) {
          const alreadyNotified = notifications.some(n => 
            n.type === 'critical_stock' && 
            n.station === st.station && 
            n.title.includes('Hi-Octane') &&
            n.timestamp.startsWith(today)
          );
          if (!alreadyNotified) {
            const notif = this.addNotification({
              title: `LOW HOBC STOCK: ${st.station} (Hi-Octane)`,
              message: `Hi-Octane 97 RON tank at ${st.station} has ${st.hiOctaneStock.toLocaleString()} L remaining (${(hoRatio * 100).toFixed(0)}%). Replenishment advised.`,
              type: 'critical_stock',
              actor,
              station: st.station,
            });
            newAlerts.push(notif);
          }
        }
      }
    });

    return newAlerts;
  },

  // -------------------------------------------------------------
  // CLIENT CREDIT / FUEL ON LOAN (KHATA)
  // -------------------------------------------------------------
  getCreditLoans(): CreditClientLoan[] {
    const data = localStorage.getItem(KEYS.CREDIT_LOANS);
    if (!data) {
      localStorage.setItem(KEYS.CREDIT_LOANS, JSON.stringify(INITIAL_CREDIT_LOANS));
      return INITIAL_CREDIT_LOANS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CREDIT_LOANS;
    }
  },

  setCreditLoans(loans: CreditClientLoan[]): void {
    localStorage.setItem(KEYS.CREDIT_LOANS, JSON.stringify(loans));
  },

  addCreditLoan(loan: Omit<CreditClientLoan, 'id'>, actor = 'Operator'): CreditClientLoan {
    const current = this.getCreditLoans();
    const newLoan: CreditClientLoan = {
      ...loan,
      id: 'loan-' + Date.now(),
    };
    this.setCreditLoans([newLoan, ...current]);

    this.addNotification({
      title: `Fuel on Loan (Khata): ${newLoan.clientName}`,
      message: `${newLoan.liters}L ${newLoan.fuelType} (₨${newLoan.amount.toLocaleString()}) issued on credit to ${newLoan.clientName} (${newLoan.vehicleNo}).`,
      type: 'client_loan',
      actor,
    });

    return newLoan;
  },

  getNotifications(): BroadcastNotification[] {
    const today = new Date().toISOString().split('T')[0];
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      const parsed: BroadcastNotification[] = JSON.parse(data);
      const filtered = parsed.filter(n => n.timestamp.split('T')[0] >= today);
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  addNotification(notif: Omit<BroadcastNotification, 'id' | 'timestamp'>): void {
    const current = this.getNotifications();
    const newNotif: BroadcastNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...current].slice(0, 100);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  deleteNotification(id: string): BroadcastNotification[] {
    const current = this.getNotifications();
    const updated = current.filter(n => n.id !== id);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  },

  markNotificationRead(id: string): void {
    const current = this.getNotifications();
    const updated = current.map(n => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  markAllNotificationsRead(): void {
    const current = this.getNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  clearAllNotifications(): void {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
  },

  // -------------------------------------------------------------
  // PHYSICAL DIP TESTS & UNDERGROUND TANK CALIBRATION
  // -------------------------------------------------------------
  getDipTests(): DipTestRecord[] {
    const data = localStorage.getItem(KEYS.DIP_TESTS);
    if (!data) {
      localStorage.setItem(KEYS.DIP_TESTS, JSON.stringify(INITIAL_DIP_TESTS));
      return INITIAL_DIP_TESTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DIP_TESTS;
    }
  },

  setDipTests(tests: DipTestRecord[]): void {
    localStorage.setItem(KEYS.DIP_TESTS, JSON.stringify(tests));
  },

  addDipTestRecord(
    record: Omit<DipTestRecord, 'id' | 'createdAt'>,
    actor = 'Operator'
  ): { record: DipTestRecord; auditResult: ImmediateAuditResult } {
    const current = this.getDipTests();
    const newRecord: DipTestRecord = {
      ...record,
      id: 'dip-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.setDipTests([newRecord, ...current]);

    // Update Dip Schedules for this station
    const schedules = this.getDipSchedules();
    const updatedSchedules = schedules.map(s => {
      if (s.station === record.station) {
        return {
          ...s,
          lastDipDate: record.date,
          lastDipShift: record.shift,
          lastDipVarianceLiters: record.varianceLiters,
          isOverdue: false,
          status: 'completed' as const,
        };
      }
      return s;
    });
    this.setDipSchedules(updatedSchedules);

    // Standard notification
    this.addNotification({
      title: `Dip Test Logged: ${record.station}`,
      message: `${record.shift} physical dip for ${record.fuelType} (Tank #${record.tankNumber}) logged: ${record.calculatedLiters.toLocaleString()} L (Variance: ${record.varianceLiters > 0 ? '+' : ''}${record.varianceLiters} L). Water: ${record.waterDipMm}mm.`,
      type: 'dip_test',
      actor,
      station: record.station,
    });

    // Run Immediate Forensic Audit on Dip Test
    const stationBalances = this.getStationBalances();
    const auditResult = AuditEngine.auditDipTestImmediately(newRecord, stationBalances);

    if (!auditResult.passed && auditResult.anomalies.length > 0) {
      const audits = this.getAudits();
      const newAudits: AuditRecord[] = auditResult.anomalies.map((anom, idx) => ({
        id: 'aud-dip-' + Date.now() + '-' + idx,
        station: anom.station,
        date: anom.date,
        type: anom.type,
        title: anom.title,
        description: anom.recommendedAction || anom.irregularityNature,
        severity: anom.severity,
        varianceLiters: anom.varianceLiters,
        irregularityNature: anom.irregularityNature,
        personResponsible: anom.personResponsible,
        status: 'Audit Ordered',
      }));
      this.setAudits([...newAudits, ...audits]);

      auditResult.anomalies.forEach(anom => {
        this.addNotification({
          title: `🚨 AUTO AUDIT ALERT: ${anom.title}`,
          message: `${anom.irregularityNature} [Person Responsible: ${anom.personResponsible}]. Recommended: ${anom.recommendedAction || 'Physical re-dip.'}`,
          type: 'audit_auto_alert',
          actor: 'Automated Tank Audit',
          station: anom.station,
        });
      });
    }

    return { record: newRecord, auditResult };
  },

  getDipSchedules(): DipTestScheduleItem[] {
    const data = localStorage.getItem(KEYS.DIP_SCHEDULES);
    if (!data) {
      localStorage.setItem(KEYS.DIP_SCHEDULES, JSON.stringify(INITIAL_DIP_SCHEDULES));
      return INITIAL_DIP_SCHEDULES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_DIP_SCHEDULES;
    }
  },

  setDipSchedules(schedules: DipTestScheduleItem[]): void {
    localStorage.setItem(KEYS.DIP_SCHEDULES, JSON.stringify(schedules));
  },

  checkOverdueDipTests(): DipTestScheduleItem[] {
    const schedules = this.getDipSchedules();
    const today = new Date().toISOString().split('T')[0];
    
    // An item is overdue if lastDipDate is not today
    return schedules.map(s => {
      const isCompletedToday = s.lastDipDate === today;
      return {
        ...s,
        isOverdue: !isCompletedToday,
        status: isCompletedToday ? ('completed' as const) : ('overdue' as const),
      };
    });
  },

  // -------------------------------------------------------------
  // EDITABLE DASHBOARD LAYOUT CONFIGURATION
  // -------------------------------------------------------------
  getDashboardLayout(): DashboardLayoutConfig {
    const data = localStorage.getItem(KEYS.DASHBOARD_LAYOUT);
    if (!data) {
      localStorage.setItem(KEYS.DASHBOARD_LAYOUT, JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
      return DEFAULT_DASHBOARD_LAYOUT;
    }
    try {
      const parsed = JSON.parse(data);
      // Ensure all sections are present even if new sections were added
      const allSections = DEFAULT_DASHBOARD_LAYOUT.sectionsOrder;
      const order = Array.isArray(parsed.sectionsOrder) ? parsed.sectionsOrder : allSections;
      allSections.forEach(sec => {
        if (!order.includes(sec)) order.push(sec);
      });
      return {
        sectionsOrder: order,
        hiddenSections: Array.isArray(parsed.hiddenSections) ? parsed.hiddenSections : [],
        density: parsed.density || 'comfortable',
      };
    } catch {
      return DEFAULT_DASHBOARD_LAYOUT;
    }
  },

  saveDashboardLayout(config: DashboardLayoutConfig): void {
    localStorage.setItem(KEYS.DASHBOARD_LAYOUT, JSON.stringify(config));
  },

  resetDashboardLayout(): DashboardLayoutConfig {
    localStorage.setItem(KEYS.DASHBOARD_LAYOUT, JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
    return DEFAULT_DASHBOARD_LAYOUT;
  },

  // Full system data export for CEO Jalees backup / share
  exportFullDataJSON(): string {
    const payload = {
      appName: 'Kashfi Bro Holdings - Fuel Management System (iPhone 18 Edition)',
      exportDate: new Date().toISOString(),
      exportedBy: 'CEO/Admin Jalees',
      credentials: {
        partnerPin: this.getCredentials().partnerPin,
        managerPin: this.getCredentials().managerPin,
        adminPin: '***PROTECTED***',
      },
      stations: this.getStationBalances(),
      partners: this.getPartners(),
      partnerTransactions: this.getPartnerTransactions(),
      withdrawals: this.getWithdrawals(),
      rates: this.getRates(),
      entries: this.getEntries(),
      audits: this.getAudits(),
      bankAccounts: this.getBankAccounts(),
      bankDeposits: this.getBankDeposits(),
      creditLoans: this.getCreditLoans(),
      dipTests: this.getDipTests(),
      dipSchedules: this.getDipSchedules(),
      dashboardLayout: this.getDashboardLayout(),
      notifications: this.getNotifications(),
    };
    return JSON.stringify(payload, null, 2);
  },

  exportBackupJson(): string {
    return this.exportFullDataJSON();
  },

  importBackupJson(jsonString: string): { success: boolean; error?: string } {
    return this.importData(jsonString);
  },

  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (data.entries && Array.isArray(data.entries)) {
        this.setEntries(data.entries);
      }
      if (data.partners && Array.isArray(data.partners)) {
        this.setPartners(data.partners);
      }
      if (data.partnerTransactions && Array.isArray(data.partnerTransactions)) {
        this.setPartnerTransactions(data.partnerTransactions);
      }
      if (data.withdrawals && Array.isArray(data.withdrawals)) {
        this.setWithdrawals(data.withdrawals);
      }
      if (data.stations && Array.isArray(data.stations)) {
        this.setStationBalances(data.stations);
      } else if (data.stationBalances && Array.isArray(data.stationBalances)) {
        this.setStationBalances(data.stationBalances);
      }
      if (data.rates) {
        this.setRates(data.rates);
      }
      if (data.audits && Array.isArray(data.audits)) {
        this.setAudits(data.audits);
      }
      if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
        this.setBankAccounts(data.bankAccounts);
      }
      if (data.bankDeposits && Array.isArray(data.bankDeposits)) {
        this.setBankDeposits(data.bankDeposits);
      }
      if (data.creditLoans && Array.isArray(data.creditLoans)) {
        this.setCreditLoans(data.creditLoans);
      }
      this.addNotification({
        title: 'System Data Restored',
        message: 'A complete JSON backup was successfully imported into the system.',
        type: 'system',
        actor: 'CEO Jalees',
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Invalid JSON format' };
    }
  },
};
