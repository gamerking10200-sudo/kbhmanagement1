export type UserRole = 'partner' | 'manager' | 'ceo_jalees';

export type TabType = 'home' | 'entry' | 'summary' | 'audit' | 'logs' | 'partners' | 'rates' | 'drive' | 'market_pulse';

export type AppTheme = 'iphone-dark' | 'iphone-light' | 'nordic-light' | 'sandstone-light' | 'emerald-luxury' | 'midnight-amber';

export type CalendarTimeframe = 'all' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export interface UserSession {
  role: UserRole;
  label: string;
  name: string;
  canEdit: boolean;
  canEditRates: boolean;
  canEditPartners: boolean;
  canDeleteEntries: boolean;
}

export type StationName = string;

export interface NozzleReading {
  id: string;
  nozzleNumber: number;
  name?: string;
  fuelType: 'petrol' | 'diesel' | 'hiOctane' | 'Petrol' | 'Diesel' | 'Hi-Octane';
  openingMeter: number;
  closingMeter: number;
  dispensedLiters: number;
}

export interface CreditClientLoan {
  id: string;
  clientName: string;
  vehicleNo: string;
  fuelType: 'Petrol' | 'Diesel' | 'Hi-Octane' | 'Lubes';
  liters: number;
  rate: number;
  amount: number;
  slipNumber?: string;
  dueDate?: string;
  status: 'Pending' | 'Cleared';
  notes?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branch?: string;
  currentBalance: number;
  isPrimary?: boolean;
}

export interface BankDepositRecord {
  id: string;
  date: string;
  station: StationName;
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  depositType: 'Daily Cash' | 'Net Profit' | 'Capital Deposit' | 'Other';
  slipNumber: string;
  depositedBy: string;
  notes?: string;
  createdAt: string;
}

export interface StationEntry {
  id: string;
  station: StationName;
  date: string;
  shift?: string;
  // Petrol Sales & Purchase
  petrolSales: number;
  petrolPurchase: number;
  petrolSaleRate: number;
  petrolPurchaseRate: number;
  petrolOldPurchaseRate?: number;
  petrolMarginMode: 'standard' | 'average_stock';
  petrolNozzleSaleReading: number;
  petrolNozzlePurchaseReading?: number; // Nozzle/delivery meter reading for purchase
  
  // Diesel Sales & Purchase
  dieselSales: number;
  dieselPurchase: number;
  dieselSaleRate: number;
  dieselPurchaseRate: number;
  dieselOldPurchaseRate?: number;
  dieselMarginMode: 'standard' | 'average_stock';
  dieselNozzleSaleReading: number;
  dieselNozzlePurchaseReading?: number; // Nozzle/delivery meter reading for purchase
  
  // Hi-Octane 97 (HOBC) Sales & Purchase
  hiOctaneSales?: number;
  hiOctanePurchase?: number;
  hiOctaneSaleRate?: number;
  hiOctanePurchaseRate?: number;
  hiOctaneOldPurchaseRate?: number;
  hiOctaneMarginMode?: 'standard' | 'average_stock';
  hiOctaneNozzleSaleReading?: number;
  hiOctaneNozzlePurchaseReading?: number;

  // Lubes Sales & Purchase
  lubesSales: number;
  lubesPurchase: number;
  lubesSaleRate: number;
  lubesPurchaseRate: number;
  
  // Operating Expenses
  salaries: number;
  wages: number;
  food: number;
  travel: number;
  maintenance: number;
  otherExpenses: number;

  // Granular Nozzles Breakdown
  nozzleReadings?: NozzleReading[];

  // Clients Getting Fuel on Loan / Credit (Khata & Receivables)
  creditClientLoans?: CreditClientLoan[];
  totalCreditLoanAmount?: number;
  netCashCollected?: number;

  // Daily Bank Credit / Deposit
  bankDepositAmount?: number;
  bankAccountId?: string;
  bankDepositSlip?: string;
  
  // Calculated summaries
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  revenue: number;
  nozzleVariance: number;
  purchaseNozzleVariance?: number;
  auditFlag: boolean;
  
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  role: string; // Designation e.g. CEO & Managing Partner, Lead Partner, Executive Director, Director Operations, Finance Director, Silent Partner
  investment: number; // Current invested capital
  initialInvestment?: number;
  capitalWithdrawals?: number; // Total capital returned / withdrawn
  profitAdjustments?: number; // Manual profit adjustments or bonuses
  phone?: string;
  email?: string;
  notes?: string;
  joinedDate: string;
}

export interface PartnerWithdrawal {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  amount: number;
  withdrawalType?: 'Profit' | 'Capital';
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online Banking' | 'Pay Order';
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface PartnerTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  category: 'Investment' | 'Profit';
  action: 'Add' | 'Withdraw';
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online Banking' | 'Pay Order';
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface TankDetail {
  id: string;
  tankNumber: number;
  fuelType: 'Petrol' | 'Diesel' | 'Hi-Octane' | 'Lubes';
  capacity: number;
  currentStock: number;
  typeOfTank?: string;
}

export interface StationBalance {
  id?: string;
  station: StationName;
  status: 'Active' | 'Inactive';
  allocatedInvestment: number; // Station initial capital float
  cashOnHand: number;          // Current station drawer cash / working balance
  petrolCapacity: number;
  dieselCapacity: number;
  lubesCapacity: number;
  hiOctaneCapacity?: number;
  petrolStock: number;
  dieselStock: number;
  lubesStock: number;
  hiOctaneStock?: number;
  supportsPetrol?: boolean;
  supportsDiesel?: boolean;
  supportsHiOctane?: boolean;
  typeOfTanks?: string;
  tanksCount?: number;
  dispensersCount?: number;
  nozzlesCount?: number;
  tanksDetails?: TankDetail[];
  managerInCharge: string;
  location?: string;
  phone?: string;
}

export type AuditStatus = 'Pending' | 'Audit Ordered' | 'In Progress' | 'Resolved' | 'Completed';

export type AuditType = 
  | 'nozzle_variance' 
  | 'purchase_variance' 
  | 'tank_critical' 
  | 'tank_warning' 
  | 'missing_closing' 
  | 'station_inactive'
  | 'dip_anomaly'
  | 'transfer_deficit'
  | 'cash_shortage'
  | 'margin_anomaly'
  | 'rate_deviation';

export interface AuditRecord {
  id: string;
  station: StationName;
  date: string;
  type: AuditType;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  varianceLiters?: number;
  varianceAmount?: number;
  irregularityNature?: string;
  personResponsible?: string;
  status: AuditStatus;
  actionTakenBy?: string;
  actionTakenAt?: string;
  actionNotes?: string;
}

export interface BroadcastNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 
    | 'audit_action' 
    | 'audit_auto_alert'
    | 'dip_test'
    | 'system' 
    | 'new_entry'
    | 'price_change'
    | 'critical_stock'
    | 'bank_update'
    | 'bank_deleted'
    | 'withdrawal_update'
    | 'withdrawal_deleted'
    | 'password_change' 
    | 'partner_change' 
    | 'withdrawal' 
    | 'entry_reset' 
    | 'investment_override' 
    | 'station_status' 
    | 'station_added' 
    | 'station_deleted' 
    | 'station_updated' 
    | 'bank_deposit' 
    | 'client_loan';
  actor: string;
  station?: StationName;
  read?: boolean;
  isRead?: boolean;
}

// -------------------------------------------------------------
// DIP TEST & PHYSICAL TANK CALIBRATION SCHEDULE TYPES
// -------------------------------------------------------------
export type DipShift = 'Morning (06:00)' | 'Evening (18:00)' | 'Post-Decanting' | 'Special Audit';

export interface DipTestRecord {
  id: string;
  station: StationName;
  date: string;
  shift: DipShift;
  fuelType: 'Petrol' | 'Diesel' | 'Hi-Octane';
  tankNumber: number;
  dipReadingMm: number;        // Physical brass dip rod height in mm
  calculatedLiters: number;    // Converted volume via tank calibration chart
  ledgerLiters: number;        // Digital ATG or book volume
  varianceLiters: number;      // physical - ledger
  variancePercent: number;     // (varianceLiters / ledgerLiters) * 100
  waterDipMm: number;          // Water-finding paste measurement in mm (0 is clean)
  conductedBy: string;         // Attendant / Dip tester
  personResponsible: string;   // Station Manager in charge
  status: 'normal' | 'minor_variance' | 'critical_variance' | 'water_detected';
  notes?: string;
  createdAt: string;
}

export interface DipTestScheduleItem {
  id: string;
  station: StationName;
  shift: DipShift;
  scheduledTime: string;       // e.g. "06:00 AM" or "06:00 PM"
  managerInCharge: string;
  lastDipDate?: string;
  lastDipShift?: string;
  lastDipVarianceLiters?: number;
  isOverdue: boolean;
  status: 'completed' | 'pending' | 'overdue';
}

// -------------------------------------------------------------
// EDITABLE DASHBOARD LAYOUT TYPES
// -------------------------------------------------------------
export type DashboardSectionId = 
  | 'kpi_banner'
  | 'stats_grid'
  | 'ai_alerts'
  | 'dip_test_widget'
  | 'market_pulse'
  | 'station_balances'
  | 'tank_stocks';

export interface DashboardLayoutConfig {
  sectionsOrder: DashboardSectionId[];
  hiddenSections: DashboardSectionId[];
  density: 'comfortable' | 'compact' | 'executive';
}

// -------------------------------------------------------------
// IMMEDIATE AUTOMATED FORENSIC AUDIT TYPES
// -------------------------------------------------------------
export interface ImmediateAuditAnomaly {
  type: AuditType;
  title: string;
  irregularityNature: string;
  personResponsible: string;
  severity: 'high' | 'medium';
  station: StationName;
  date: string;
  varianceLiters?: number;
  varianceAmount?: number;
  metricComparison?: string;
  recommendedAction?: string;
}

export interface ImmediateAuditResult {
  timestamp: string;
  source: 'entry' | 'transfer' | 'dip_test' | 'withdrawal';
  station: StationName;
  operator: string;
  passed: boolean;
  anomalies: ImmediateAuditAnomaly[];
}

export interface FuelRates {
  psr: number; // Petrol Sale Rate
  ppr: number; // Petrol Purchase Rate
  dsr: number; // Diesel Sale Rate
  dpr: number; // Diesel Purchase Rate
  hosr?: number; // Hi-Octane Sale Rate
  hopr?: number; // Hi-Octane Purchase Rate
  lsr: number; // Lubes Sale Rate
  lpr: number; // Lubes Purchase Rate
  lastUpdated: string;
  updatedBy: string;
}

export interface RateHistoryItem extends FuelRates {
  id: string;
  effectiveDate: string;
}

export interface AppCredentials {
  partnerPin: string;
  managerPin: string;
  adminPin: string;
}

export type AnomalySeverity = 'critical' | 'warning' | 'notice' | 'info';
export type AnomalyCategory = 'sales_dip' | 'inventory_drop' | 'margin_mismatch' | 'nozzle_leakage' | 'cash_variance';

export interface DashboardAlertItem {
  id: string;
  station: StationName | 'All Stations';
  date: string;
  title: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  metricLabel: string;
  currentValue: string;
  historicAverage: string;
  variancePercentage: number; // e.g. -38.5%
  observation: string;
  probableRootCause: string;
  recommendation: string;
  actionType?: 'rates' | 'logs' | 'entry' | 'dismiss';
  acknowledged?: boolean;
}

export interface DashboardAlertsResponse {
  generatedAt: string;
  aiPowered: boolean;
  modelUsed?: string;
  summary: {
    totalAnomalies: number;
    criticalCount: number;
    warningCount: number;
    salesDipsCount: number;
    inventoryDropsCount: number;
    marginMismatchesCount: number;
    averageMarginDeviationPct: number;
  };
  alerts: DashboardAlertItem[];
}
