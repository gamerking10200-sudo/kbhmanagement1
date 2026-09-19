import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Save, 
  Lock, 
  Gauge, 
  Fuel, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator,
  Sparkles,
  Zap,
  RotateCcw,
  Layers,
  ArrowRight,
  Printer,
  Building2,
  Receipt,
  UserCheck,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AppTheme, 
  BankAccount, 
  BankDepositRecord, 
  CreditClientLoan, 
  FuelRates, 
  NozzleReading, 
  StationBalance, 
  StationEntry, 
  UserSession 
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface EntryTabProps {
  session: UserSession;
  rates: FuelRates;
  stationBalances?: StationBalance[];
  theme?: AppTheme;
  bankAccounts?: BankAccount[];
  initialCreditLoans?: CreditClientLoan[];
  onSaveEntry: (entry: Omit<StationEntry, 'id' | 'createdAt' | 'createdBy'>) => void;
  onNavigateToSummary: () => void;
  onDirectBankDeposit?: (deposit: Omit<BankDepositRecord, 'id' | 'createdAt'>) => void;
  onSaveCreditLoan?: (loan: Omit<CreditClientLoan, 'id'>) => void;
  onOpenPrintModal?: () => void;
}

export const EntryTab: React.FC<EntryTabProps> = ({
  session,
  rates,
  stationBalances = [],
  theme = 'iphone-dark',
  bankAccounts = [],
  initialCreditLoans = [],
  onSaveEntry,
  onNavigateToSummary,
  onDirectBankDeposit,
  onSaveCreditLoan,
  onOpenPrintModal,
}) => {
  const isLight = theme === 'iphone-light';
  const isLocked = !session.canEdit;

  const stationNames = stationBalances.length > 0 
    ? stationBalances.map(s => s.station)
    : ['SWAT 1', 'SWAT 2', 'SWAT 3', 'PCR 1', 'PCR 2'];

  const [station, setStation] = useState<string>(stationNames[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Selected station metadata
  const currentStationObj = stationBalances.find(s => s.station === station);
  const isStationInactive = currentStationObj?.status === 'Inactive';

  // Base rates state
  const [petrolSaleRate, setPetrolSaleRate] = useState<number>(rates.psr);
  const [petrolPurchaseRate, setPetrolPurchaseRate] = useState<number>(rates.ppr);
  const [petrolOldPurchaseRate, setPetrolOldPurchaseRate] = useState<number>(rates.ppr);
  const [petrolMarginMode, setPetrolMarginMode] = useState<'standard' | 'average_stock'>('average_stock');

  const [dieselSaleRate, setDieselSaleRate] = useState<number>(rates.dsr);
  const [dieselPurchaseRate, setDieselPurchaseRate] = useState<number>(rates.dpr);
  const [dieselOldPurchaseRate, setDieselOldPurchaseRate] = useState<number>(rates.dpr);
  const [dieselMarginMode, setDieselMarginMode] = useState<'standard' | 'average_stock'>('average_stock');

  const [hiOctaneSaleRate, setHiOctaneSaleRate] = useState<number>(rates.hosr || 395);
  const [hiOctanePurchaseRate, setHiOctanePurchaseRate] = useState<number>(rates.hopr || 382);
  const [hiOctaneOldPurchaseRate, setHiOctaneOldPurchaseRate] = useState<number>(rates.hopr || 382);
  const [hiOctaneMarginMode, setHiOctaneMarginMode] = useState<'standard' | 'average_stock'>('average_stock');

  const [lubesSaleRate, setLubesSaleRate] = useState<number>(rates.lsr || 1450);
  const [lubesPurchaseRate, setLubesPurchaseRate] = useState<number>(rates.lpr || 1200);

  // Sync rates when props change
  useEffect(() => {
    setPetrolSaleRate(rates.psr);
    setPetrolPurchaseRate(rates.ppr);
    setPetrolOldPurchaseRate(rates.ppr);
    setDieselSaleRate(rates.dsr);
    setDieselPurchaseRate(rates.dpr);
    setDieselOldPurchaseRate(rates.dpr);
    setHiOctaneSaleRate(rates.hosr || 395);
    setHiOctanePurchaseRate(rates.hopr || 382);
    setHiOctaneOldPurchaseRate(rates.hopr || 382);
    setLubesSaleRate(rates.lsr);
    setLubesPurchaseRate(rates.lpr);
  }, [rates]);

  // Purchases & Purchase Tanker Readings
  const [petrolPurchase, setPetrolPurchase] = useState<number>(2000);
  const [dieselPurchase, setDieselPurchase] = useState<number>(2500);
  const [hiOctanePurchase, setHiOctanePurchase] = useState<number>(500);
  const [lubesPurchase, setLubesPurchase] = useState<number>(20);
  const [lubesSales, setLubesSales] = useState<number>(15);

  // --- DYNAMIC NOZZLES AS PER STATION SETTINGS ---
  // Initial default nozzle counts based on station specifications
  const getInitialNozzles = (fuel: 'Petrol' | 'Diesel' | 'Hi-Octane', stationName: string): NozzleReading[] => {
    const stObj = stationBalances.find(s => s.station === stationName);
    const totalCount = stObj?.nozzlesCount || 8;
    
    // Distribute total count into fuel types
    let countForFuel = 3;
    if (fuel === 'Petrol') countForFuel = Math.max(1, Math.floor(totalCount * 0.4));
    else if (fuel === 'Diesel') countForFuel = Math.max(1, Math.floor(totalCount * 0.4));
    else countForFuel = Math.max(1, totalCount - Math.floor(totalCount * 0.8));

    const baseOpen = fuel === 'Petrol' ? 12000 : fuel === 'Diesel' ? 45000 : 8000;
    const baseDispensed = fuel === 'Petrol' ? 620 : fuel === 'Diesel' ? 700 : 225;

    const list: NozzleReading[] = [];
    for (let i = 1; i <= countForFuel; i++) {
      const open = baseOpen + (i - 1) * 3500;
      const close = open + baseDispensed;
      list.push({
        id: `${fuel.toLowerCase()}-noz-${i}`,
        nozzleNumber: i,
        fuelType: fuel,
        openingMeter: open,
        closingMeter: close,
        dispensedLiters: close - open,
      });
    }
    return list;
  };

  const [petrolNozzles, setPetrolNozzles] = useState<NozzleReading[]>(() => getInitialNozzles('Petrol', stationNames[0]));
  const [dieselNozzles, setDieselNozzles] = useState<NozzleReading[]>(() => getInitialNozzles('Diesel', stationNames[0]));
  const [hiOctaneNozzles, setHiOctaneNozzles] = useState<NozzleReading[]>(() => getInitialNozzles('Hi-Octane', stationNames[0]));

  // When station changes, re-initialize nozzles as per station configuration
  useEffect(() => {
    setPetrolNozzles(getInitialNozzles('Petrol', station));
    setDieselNozzles(getInitialNozzles('Diesel', station));
    setHiOctaneNozzles(getInitialNozzles('Hi-Octane', station));
  }, [station]);

  // Aggregate Sales Liters (Sum of dispensed from nozzles)
  const [petrolSales, setPetrolSales] = useState<number>(() => 
    petrolNozzles.reduce((sum, n) => sum + Math.max(0, n.closingMeter - n.openingMeter), 0)
  );
  const [dieselSales, setDieselSales] = useState<number>(() => 
    dieselNozzles.reduce((sum, n) => sum + Math.max(0, n.closingMeter - n.openingMeter), 0)
  );
  const [hiOctaneSales, setHiOctaneSales] = useState<number>(() => 
    hiOctaneNozzles.reduce((sum, n) => sum + Math.max(0, n.closingMeter - n.openingMeter), 0)
  );

  // --- BIDIRECTIONAL AUTO-CALCULATIONS ---
  // DIRECTION 1: Nozzle reading change -> Updates Sales volume
  const handleNozzleChange = (
    fuel: 'Petrol' | 'Diesel' | 'Hi-Octane', 
    nozzleId: string, 
    field: 'openingMeter' | 'closingMeter', 
    value: number
  ) => {
    const updateList = (prev: NozzleReading[]) =>
      prev.map(noz => {
        if (noz.id === nozzleId) {
          const updated = { ...noz, [field]: Number(value) };
          updated.dispensedLiters = Math.max(0, updated.closingMeter - updated.openingMeter);
          return updated;
        }
        return noz;
      });

    if (fuel === 'Petrol') {
      setPetrolNozzles(prev => {
        const next = updateList(prev);
        const total = next.reduce((sum, n) => sum + n.dispensedLiters, 0);
        setPetrolSales(total);
        return next;
      });
    } else if (fuel === 'Diesel') {
      setDieselNozzles(prev => {
        const next = updateList(prev);
        const total = next.reduce((sum, n) => sum + n.dispensedLiters, 0);
        setDieselSales(total);
        return next;
      });
    } else {
      setHiOctaneNozzles(prev => {
        const next = updateList(prev);
        const total = next.reduce((sum, n) => sum + n.dispensedLiters, 0);
        setHiOctaneSales(total);
        return next;
      });
    }
  };

  // Add a new nozzle dynamically
  const handleAddNozzle = (fuel: 'Petrol' | 'Diesel' | 'Hi-Octane') => {
    const list = fuel === 'Petrol' ? petrolNozzles : fuel === 'Diesel' ? dieselNozzles : hiOctaneNozzles;
    const nextNum = list.length + 1;
    const baseOpen = fuel === 'Petrol' ? 15000 : fuel === 'Diesel' ? 50000 : 10000;
    const newNozzle: NozzleReading = {
      id: `${fuel.toLowerCase()}-noz-${Date.now()}`,
      nozzleNumber: nextNum,
      fuelType: fuel,
      openingMeter: baseOpen + nextNum * 1000,
      closingMeter: baseOpen + nextNum * 1000,
      dispensedLiters: 0,
    };

    if (fuel === 'Petrol') setPetrolNozzles([...petrolNozzles, newNozzle]);
    else if (fuel === 'Diesel') setDieselNozzles([...dieselNozzles, newNozzle]);
    else setHiOctaneNozzles([...hiOctaneNozzles, newNozzle]);
  };

  // Remove a nozzle
  const handleRemoveNozzle = (fuel: 'Petrol' | 'Diesel' | 'Hi-Octane', nozzleId: string) => {
    if (fuel === 'Petrol' && petrolNozzles.length > 1) {
      const next = petrolNozzles.filter(n => n.id !== nozzleId);
      setPetrolNozzles(next);
      setPetrolSales(next.reduce((s, n) => s + n.dispensedLiters, 0));
    } else if (fuel === 'Diesel' && dieselNozzles.length > 1) {
      const next = dieselNozzles.filter(n => n.id !== nozzleId);
      setDieselNozzles(next);
      setDieselSales(next.reduce((s, n) => s + n.dispensedLiters, 0));
    } else if (fuel === 'Hi-Octane' && hiOctaneNozzles.length > 1) {
      const next = hiOctaneNozzles.filter(n => n.id !== nozzleId);
      setHiOctaneNozzles(next);
      setHiOctaneSales(next.reduce((s, n) => s + n.dispensedLiters, 0));
    }
  };

  // DIRECTION 2: Direct Sales Liters change -> Auto-calibrates nozzle closing readings
  const handleSalesLitersChange = (fuel: 'Petrol' | 'Diesel' | 'Hi-Octane', targetLiters: number) => {
    const lit = Math.max(0, Number(targetLiters));
    if (fuel === 'Petrol') {
      setPetrolSales(lit);
      setPetrolNozzles(prev => {
        if (prev.length === 0) return prev;
        const count = prev.length;
        const baseShare = Math.floor(lit / count);
        const remainder = lit % count;
        return prev.map((noz, idx) => {
          const share = baseShare + (idx === 0 ? remainder : 0);
          return {
            ...noz,
            closingMeter: noz.openingMeter + share,
            dispensedLiters: share,
          };
        });
      });
    } else if (fuel === 'Diesel') {
      setDieselSales(lit);
      setDieselNozzles(prev => {
        if (prev.length === 0) return prev;
        const count = prev.length;
        const baseShare = Math.floor(lit / count);
        const remainder = lit % count;
        return prev.map((noz, idx) => {
          const share = baseShare + (idx === 0 ? remainder : 0);
          return {
            ...noz,
            closingMeter: noz.openingMeter + share,
            dispensedLiters: share,
          };
        });
      });
    } else {
      setHiOctaneSales(lit);
      setHiOctaneNozzles(prev => {
        if (prev.length === 0) return prev;
        const count = prev.length;
        const baseShare = Math.floor(lit / count);
        const remainder = lit % count;
        return prev.map((noz, idx) => {
          const share = baseShare + (idx === 0 ? remainder : 0);
          return {
            ...noz,
            closingMeter: noz.openingMeter + share,
            dispensedLiters: share,
          };
        });
      });
    }
  };

  // DIRECTION 3: Direct Sales Revenue (PKR) change -> Calculates Liters -> Auto-calibrates nozzles
  const handleSalesRevenueChange = (fuel: 'Petrol' | 'Diesel' | 'Hi-Octane', pkrAmount: number) => {
    const rate = fuel === 'Petrol' ? petrolSaleRate : fuel === 'Diesel' ? dieselSaleRate : hiOctaneSaleRate;
    if (rate > 0) {
      const derivedLiters = Math.round(Number(pkrAmount) / rate);
      handleSalesLitersChange(fuel, derivedLiters);
    }
  };

  // --- 5. EXPENSES ---
  const [salaries, setSalaries] = useState<number>(1200);
  const [wages, setWages] = useState<number>(800);
  const [food, setFood] = useState<number>(500);
  const [travel, setTravel] = useState<number>(300);
  const [maintenance, setMaintenance] = useState<number>(250);
  const [otherExpenses, setOtherExpenses] = useState<number>(150);
  const [notes, setNotes] = useState<string>('Standard daily shift closing & nozzle reconciliation verified.');

  // --- 6. CLIENT CREDIT / FUEL ON LOAN (KHATA BALANCE SHEET) ---
  const [creditLoans, setCreditLoans] = useState<CreditClientLoan[]>(initialCreditLoans);
  const [isAddingLoan, setIsAddingLoan] = useState<boolean>(false);
  const [loanClientName, setLoanClientName] = useState<string>('');
  const [loanVehicleNo, setLoanVehicleNo] = useState<string>('');
  const [loanFuelType, setLoanFuelType] = useState<'Petrol' | 'Diesel' | 'Hi-Octane' | 'Lubes'>('Diesel');
  const [loanLiters, setLoanLiters] = useState<number>(100);
  const [loanSlipNumber, setLoanSlipNumber] = useState<string>(`SLIP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [loanDueDate, setLoanDueDate] = useState<string>(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);

  // Rate for loan client voucher
  const currentLoanRate = loanFuelType === 'Petrol' 
    ? petrolSaleRate 
    : loanFuelType === 'Diesel' 
    ? dieselSaleRate 
    : loanFuelType === 'Hi-Octane' 
    ? hiOctaneSaleRate 
    : lubesSaleRate;
  const loanCalculatedAmount = loanLiters * currentLoanRate;

  const handleAddCreditLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanClientName.trim() || loanLiters <= 0) {
      alert('Please enter a valid client name and fuel volume.');
      return;
    }

    const newLoan: CreditClientLoan = {
      id: 'loan-' + Date.now(),
      clientName: loanClientName.trim(),
      vehicleNo: loanVehicleNo.trim() || 'N/A',
      fuelType: loanFuelType,
      liters: Number(loanLiters),
      rate: currentLoanRate,
      amount: loanCalculatedAmount,
      slipNumber: loanSlipNumber.trim(),
      dueDate: loanDueDate,
      status: 'Pending',
    };

    setCreditLoans([newLoan, ...creditLoans]);
    if (onSaveCreditLoan) {
      onSaveCreditLoan(newLoan);
    }

    setIsAddingLoan(false);
    setLoanClientName('');
    setLoanVehicleNo('');
    setLoanLiters(100);
    setLoanSlipNumber(`SLIP-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleRemoveLoan = (loanId: string) => {
    setCreditLoans(creditLoans.filter(l => l.id !== loanId));
  };

  // --- 7. BANK ACCOUNT DEPOSIT INTEGRATION ---
  const [autoDepositToBank, setAutoDepositToBank] = useState<boolean>(false);
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [bankDepositType, setBankDepositType] = useState<'Daily Cash' | 'Net Profit'>('Daily Cash');
  const [bankDepositSlip, setBankDepositSlip] = useState<string>(`DEP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [bankDepositor, setBankDepositor] = useState<string>(session?.name || 'Zubair Shah');

  // MARGIN CALCULATIONS
  const effectivePetrolCost = petrolMarginMode === 'average_stock'
    ? (petrolOldPurchaseRate + petrolPurchaseRate) / 2
    : petrolPurchaseRate;
  const petrolMargin = petrolSaleRate - effectivePetrolCost;

  const effectiveDieselCost = dieselMarginMode === 'average_stock'
    ? (dieselOldPurchaseRate + dieselPurchaseRate) / 2
    : dieselPurchaseRate;
  const dieselMargin = dieselSaleRate - effectiveDieselCost;

  const effectiveHiOctaneCost = hiOctaneMarginMode === 'average_stock'
    ? (hiOctaneOldPurchaseRate + hiOctanePurchaseRate) / 2
    : hiOctanePurchaseRate;
  const hiOctaneMargin = hiOctaneSaleRate - effectiveHiOctaneCost;

  const lubesMargin = lubesSaleRate - lubesPurchaseRate;

  // REVENUE & GROSS PROFIT
  const petrolRevenue = petrolSales * petrolSaleRate;
  const dieselRevenue = dieselSales * dieselSaleRate;
  const hiOctaneRevenue = hiOctaneSales * hiOctaneSaleRate;
  const lubesRevenue = lubesSales * lubesSaleRate;
  const totalGrossRevenue = petrolRevenue + dieselRevenue + hiOctaneRevenue + lubesRevenue;

  const petrolGrossProfit = petrolSales * petrolMargin;
  const dieselGrossProfit = dieselSales * dieselMargin;
  const hiOctaneGrossProfit = hiOctaneSales * hiOctaneMargin;
  const lubesGrossProfit = lubesSales * lubesMargin;
  const totalGrossProfit = petrolGrossProfit + dieselGrossProfit + hiOctaneGrossProfit + lubesGrossProfit;

  // EXPENSES & NET PROFIT
  const totalExpenses = salaries + wages + food + travel + maintenance + otherExpenses;
  const netProfit = totalGrossProfit - totalExpenses;

  // RECONCILIATION BALANCE SHEET
  const totalCreditLoanSales = creditLoans.reduce((sum, l) => sum + l.amount, 0);
  const netCashCollectedFromFuel = Math.max(0, totalGrossRevenue - totalCreditLoanSales);
  const netStationCashDrawerFloat = Math.max(0, netCashCollectedFromFuel - totalExpenses);

  // Bank deposit amount default
  const bankDepositAmount = bankDepositType === 'Daily Cash' 
    ? netStationCashDrawerFloat 
    : Math.max(0, netProfit);

  // Variances (all nozzles summed vs sales is 0 variance because synced!)
  const totalNozzlePetrol = petrolNozzles.reduce((s, n) => s + n.dispensedLiters, 0);
  const totalNozzleDiesel = dieselNozzles.reduce((s, n) => s + n.dispensedLiters, 0);
  const totalNozzleHiOctane = hiOctaneNozzles.reduce((s, n) => s + n.dispensedLiters, 0);

  const petrolVariance = Math.abs(petrolSales - totalNozzlePetrol);
  const dieselVariance = Math.abs(dieselSales - totalNozzleDiesel);
  const hiOctaneVariance = Math.abs(hiOctaneSales - totalNozzleHiOctane);
  const totalVariance = petrolVariance + dieselVariance + hiOctaneVariance;
  const isAuditFlag = totalVariance > 15 || isStationInactive;

  // SUBMIT HANDLER
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert('Read-only authority. Only active managers and CEO Jalees can record shifts.');
      return;
    }

    // 1. Save Shift Closing Entry
    onSaveEntry({
      date,
      station,
      petrolSales,
      petrolPurchase,
      petrolSaleRate,
      petrolPurchaseRate,
      petrolOldPurchaseRate,
      petrolMarginMode,
      petrolNozzleSaleReading: totalNozzlePetrol,
      petrolNozzlePurchaseReading: petrolPurchase,
      dieselSales,
      dieselPurchase,
      dieselSaleRate,
      dieselPurchaseRate,
      dieselOldPurchaseRate,
      dieselMarginMode,
      dieselNozzleSaleReading: totalNozzleDiesel,
      dieselNozzlePurchaseReading: dieselPurchase,
      hiOctaneSales,
      hiOctanePurchase,
      hiOctaneSaleRate,
      hiOctanePurchaseRate,
      hiOctaneOldPurchaseRate,
      hiOctaneMarginMode,
      hiOctaneNozzleSaleReading: totalNozzleHiOctane,
      hiOctaneNozzlePurchaseReading: hiOctanePurchase,
      lubesSales,
      lubesPurchase,
      lubesSaleRate,
      lubesPurchaseRate,
      salaries,
      wages,
      food,
      travel,
      maintenance,
      otherExpenses,
      grossProfit: totalGrossProfit,
      totalExpenses,
      netProfit,
      revenue: totalGrossRevenue,
      nozzleVariance: totalVariance,
      purchaseNozzleVariance: 0,
      auditFlag: isAuditFlag,
      notes,
      nozzleReadings: [...petrolNozzles, ...dieselNozzles, ...hiOctaneNozzles],
      creditClientLoans: creditLoans,
      depositedToBank: autoDepositToBank,
      bankAccountId: autoDepositToBank ? selectedBankId : undefined,
      bankDepositAmount: autoDepositToBank ? bankDepositAmount : undefined,
      bankDepositSlip: autoDepositToBank ? bankDepositSlip : undefined,
    });

    // 2. Direct Bank Credit if enabled
    if (autoDepositToBank && onDirectBankDeposit && selectedBankId && bankDepositAmount > 0) {
      const targetBank = bankAccounts.find(b => b.id === selectedBankId);
      onDirectBankDeposit({
        date,
        station,
        bankAccountId: selectedBankId,
        bankName: targetBank?.bankName || 'Corporate Bank',
        accountNumber: targetBank?.accountNumber || '0102-0000000000',
        amount: bankDepositAmount,
        depositType: bankDepositType,
        slipNumber: bankDepositSlip,
        depositedBy: bankDepositor,
        notes: `Direct shift closing credit from ${station}`,
      });
    }

    onNavigateToSummary();
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Inactive Station Warning */}
      {isStationInactive && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-extrabold text-white mr-1.5">{station} IS MARKED INACTIVE:</span>
              <span>Recording entries for suspended stations triggers a mandatory compliance audit alert.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header with Preset & Station Switcher */}
      <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  Gas Station Daily Operations &amp; Nozzles Closing
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  TWO-WAY AUTO-SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-nozzle meter reconciliation, client credit balance sheet (loan khata) &amp; treasury bank crediting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Print Button */}
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={onOpenPrintModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Print Shift Closing Statement / Export PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement / PDF</span>
              </button>
            )}

            {/* Station Selector */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold px-2">Station:</span>
              <select
                value={station}
                onChange={e => setStation(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {stationNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold cursor-pointer focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Station Specs Banner */}
        {currentStationObj && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] font-bold">STATION TANKS</span>
              <span className="font-black text-white font-mono">{currentStationObj.tanksCount || 3} Underground Tanks</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] font-bold">DISPENSERS</span>
              <span className="font-black text-white font-mono">{currentStationObj.dispensersCount || 4} Digital Dispensers</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] font-bold">TOTAL NOZZLES</span>
              <span className="font-black text-blue-400 font-mono">{currentStationObj.nozzlesCount || 8} Active Nozzles</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] font-bold">DRAWER CASH</span>
              <span className="font-black text-amber-400 font-mono">₨ {currentStationObj.cashOnHand.toLocaleString()}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] font-bold">MANAGER IN CHARGE</span>
              <span className="font-bold text-slate-300">{currentStationObj.managerInCharge}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ========================================================================= */}
        {/* FUEL SECTION 1: PETROL (SUPER) MULTI-NOZZLE CARD */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
                P
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Petrol (Super 92) Multi-Nozzle Terminal</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {petrolNozzles.length} Nozzles Active
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  Sale Rate: <b>₨{petrolSaleRate}/L</b> • Margin: <b className="text-emerald-400">₨{petrolMargin.toFixed(2)}/L</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddNozzle('Petrol')}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Petrol Nozzle</span>
            </button>
          </div>

          {/* Granular Nozzles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {petrolNozzles.map((noz, idx) => (
              <div key={noz.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-400">Nozzle #{noz.nozzleNumber || (idx + 1)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Dispensed: <b className="text-white">{noz.dispensedLiters.toLocaleString()} L</b>
                    </span>
                    {petrolNozzles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNozzle('Petrol', noz.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete nozzle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Opening Meter</label>
                    <input
                      type="number"
                      value={noz.openingMeter}
                      onChange={e => handleNozzleChange('Petrol', noz.id, 'openingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Closing Meter</label>
                    <input
                      type="number"
                      value={noz.closingMeter}
                      onChange={e => handleNozzleChange('Petrol', noz.id, 'closingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Petrol Summary & Bidirectional Sales Override */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Total Petrol Dispensed: <b className="text-white font-mono text-sm">{petrolSales.toLocaleString()} L</b>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Total Liters:</span>
                <input
                  type="number"
                  value={petrolSales}
                  onChange={e => handleSalesLitersChange('Petrol', Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-amber-500/50 rounded-xl px-2.5 py-1 text-white font-mono font-bold text-right"
                  title="Direct edit auto-calibrates nozzle meters"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Sales Revenue (PKR):</span>
                <input
                  type="number"
                  value={Math.round(petrolRevenue)}
                  onChange={e => handleSalesRevenueChange('Petrol', Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1 text-emerald-400 font-mono font-bold text-right"
                  title="Direct edit auto-calibrates liters & nozzle meters"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FUEL SECTION 2: DIESEL (HSD) MULTI-NOZZLE CARD */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black">
                D
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Diesel (HSD Euro 5) Multi-Nozzle Terminal</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {dieselNozzles.length} Nozzles Active
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  Sale Rate: <b>₨{dieselSaleRate}/L</b> • Margin: <b className="text-emerald-400">₨{dieselMargin.toFixed(2)}/L</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddNozzle('Diesel')}
              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Diesel Nozzle</span>
            </button>
          </div>

          {/* Granular Nozzles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dieselNozzles.map((noz, idx) => (
              <div key={noz.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-400">Nozzle #{noz.nozzleNumber || (idx + 1)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Dispensed: <b className="text-white">{noz.dispensedLiters.toLocaleString()} L</b>
                    </span>
                    {dieselNozzles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNozzle('Diesel', noz.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete nozzle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Opening Meter</label>
                    <input
                      type="number"
                      value={noz.openingMeter}
                      onChange={e => handleNozzleChange('Diesel', noz.id, 'openingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Closing Meter</label>
                    <input
                      type="number"
                      value={noz.closingMeter}
                      onChange={e => handleNozzleChange('Diesel', noz.id, 'closingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-blue-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Diesel Summary & Bidirectional Sales Override */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Total Diesel Dispensed: <b className="text-white font-mono text-sm">{dieselSales.toLocaleString()} L</b>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Total Liters:</span>
                <input
                  type="number"
                  value={dieselSales}
                  onChange={e => handleSalesLitersChange('Diesel', Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-blue-500/50 rounded-xl px-2.5 py-1 text-white font-mono font-bold text-right"
                  title="Direct edit auto-calibrates nozzle meters"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Sales Revenue (PKR):</span>
                <input
                  type="number"
                  value={Math.round(dieselRevenue)}
                  onChange={e => handleSalesRevenueChange('Diesel', Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1 text-emerald-400 font-mono font-bold text-right"
                  title="Direct edit auto-calibrates liters & nozzle meters"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FUEL SECTION 3: HI-OCTANE 97 MULTI-NOZZLE CARD */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black">
                HO
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Hi-Octane 97 RON Multi-Nozzle Terminal</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {hiOctaneNozzles.length} Nozzles Active
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  Sale Rate: <b>₨{hiOctaneSaleRate}/L</b> • Margin: <b className="text-emerald-400">₨{hiOctaneMargin.toFixed(2)}/L</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddNozzle('Hi-Octane')}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hi-Octane Nozzle</span>
            </button>
          </div>

          {/* Granular Nozzles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hiOctaneNozzles.map((noz, idx) => (
              <div key={noz.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-purple-400">Nozzle #{noz.nozzleNumber || (idx + 1)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Dispensed: <b className="text-white">{noz.dispensedLiters.toLocaleString()} L</b>
                    </span>
                    {hiOctaneNozzles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNozzle('Hi-Octane', noz.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete nozzle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Opening Meter</label>
                    <input
                      type="number"
                      value={noz.openingMeter}
                      onChange={e => handleNozzleChange('Hi-Octane', noz.id, 'openingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Closing Meter</label>
                    <input
                      type="number"
                      value={noz.closingMeter}
                      onChange={e => handleNozzleChange('Hi-Octane', noz.id, 'closingMeter', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-purple-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hi-Octane Summary & Bidirectional Sales Override */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Total Hi-Octane Dispensed: <b className="text-white font-mono text-sm">{hiOctaneSales.toLocaleString()} L</b>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Total Liters:</span>
                <input
                  type="number"
                  value={hiOctaneSales}
                  onChange={e => handleSalesLitersChange('Hi-Octane', Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-purple-500/50 rounded-xl px-2.5 py-1 text-white font-mono font-bold text-right"
                  title="Direct edit auto-calibrates nozzle meters"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Sales Revenue (PKR):</span>
                <input
                  type="number"
                  value={Math.round(hiOctaneRevenue)}
                  onChange={e => handleSalesRevenueChange('Hi-Octane', Number(e.target.value))}
                  className="w-32 bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1 text-emerald-400 font-mono font-bold text-right"
                  title="Direct edit auto-calibrates liters & nozzle meters"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXPENSES & CREDIT CLIENTS (FUEL ON LOAN) BALANCE SHEET */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-md">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Shift Expenses &amp; Fleet Credit Clients (Fuel on Loan / Khata)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reconcile operational cash expenses alongside client credit vouchers for true drawer balance settlement
            </p>
          </div>

          {/* 1. Operating Expenses Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Salaries (PKR)</label>
              <input
                type="number"
                value={salaries}
                onChange={e => setSalaries(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Daily Wages (PKR)</label>
              <input
                type="number"
                value={wages}
                onChange={e => setWages(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Food / Mess (PKR)</label>
              <input
                type="number"
                value={food}
                onChange={e => setFood(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Travel / Fuel (PKR)</label>
              <input
                type="number"
                value={travel}
                onChange={e => setTravel(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Maintenance (PKR)</label>
              <input
                type="number"
                value={maintenance}
                onChange={e => setMaintenance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Other Ops (PKR)</label>
              <input
                type="number"
                value={otherExpenses}
                onChange={e => setOtherExpenses(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* 2. Fuel on Loan (Credit Khata) Subsection */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Fuel on Loan / Credit Clients Khata ({creditLoans.length} Vouchers)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total Fuel Loan Receivables: <b className="text-white font-mono">₨ {totalCreditLoanSales.toLocaleString()}</b>
                </p>
              </div>

              {!isAddingLoan && (
                <button
                  type="button"
                  onClick={() => setIsAddingLoan(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Credit Client Voucher</span>
                </button>
              )}
            </div>

            {/* Inline Add Loan Form */}
            {isAddingLoan && (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400">New Client Fuel Credit Voucher</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingLoan(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Client / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. NLC Goods Fleet"
                      value={loanClientName}
                      onChange={e => setLoanClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Vehicle Reg #</label>
                    <input
                      type="text"
                      placeholder="e.g. TL-4920"
                      value={loanVehicleNo}
                      onChange={e => setLoanVehicleNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Fuel Type</label>
                    <select
                      value={loanFuelType}
                      onChange={e => setLoanFuelType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    >
                      <option value="Diesel">Diesel (₨{dieselSaleRate}/L)</option>
                      <option value="Petrol">Petrol (₨{petrolSaleRate}/L)</option>
                      <option value="Hi-Octane">Hi-Octane (₨{hiOctaneSaleRate}/L)</option>
                      <option value="Lubes">Lubes (₨{lubesSaleRate}/can)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Liters</label>
                    <input
                      type="number"
                      value={loanLiters}
                      onChange={e => setLoanLiters(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Slip / Ref #</label>
                    <input
                      type="text"
                      value={loanSlipNumber}
                      onChange={e => setLoanSlipNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={loanDueDate}
                      onChange={e => setLoanDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <div className="text-slate-400">
                    Voucher Value: <b className="text-emerald-400 font-mono text-sm">₨ {loanCalculatedAmount.toLocaleString()}</b>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCreditLoan}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Add to Shift Balance Sheet
                  </button>
                </div>
              </div>
            )}

            {/* Credit Loans Table */}
            {creditLoans.length > 0 && (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Vehicle</th>
                      <th className="p-2.5">Fuel</th>
                      <th className="p-2.5 text-right">Liters</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Loan Amount</th>
                      <th className="p-2.5">Slip #</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {creditLoans.map(loan => (
                      <tr key={loan.id} className="hover:bg-slate-950/40">
                        <td className="p-2.5 text-white font-bold">{loan.clientName}</td>
                        <td className="p-2.5 text-slate-400 font-mono">{loan.vehicleNo}</td>
                        <td className="p-2.5 text-slate-300">{loan.fuelType}</td>
                        <td className="p-2.5 text-right font-mono text-white">{loan.liters} L</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">₨{loan.rate}</td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-400">
                          ₨ {loan.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono">{loan.slipNumber}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLoan(loan.id)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Remove credit voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Comprehensive Shift Settlement Balance Sheet */}
          <div className="pt-3 border-t border-slate-800 bg-slate-950/80 p-4 rounded-2xl space-y-2 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Daily Shift Settlement &amp; Balance Sheet Reconciliation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Gross Fuel Revenue</span>
                <span className="text-base font-black text-blue-400 font-mono">
                  {formatCurrency(totalGrossRevenue)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Total fuel sales value</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">2. Less: Fuel on Loan (Khata)</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  - {formatCurrency(totalCreditLoanSales)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Receivables from fleets</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">3. Less: Station Expenses</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  - {formatCurrency(totalExpenses)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Salaries, mess, travel, repairs</span>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">4. Net Drawer Cash on Hand</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {formatCurrency(netStationCashDrawerFloat)}
                </span>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Physical cash in station drawer</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANK ACCOUNT CREDITING & SUBMISSION */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Bank Account Crediting (Daily Cash &amp; Profits)
                </h3>
                <p className="text-xs text-slate-400">
                  Directly credit today's physical drawer cash or net profit into verified corporate bank accounts
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={autoDepositToBank}
                onChange={e => setAutoDepositToBank(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Deposit to Bank on Saving</span>
            </label>
          </div>

          {/* Direct Bank Deposit Settings when enabled */}
          {autoDepositToBank && (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Target Corporate Bank Account *</label>
                  <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} (₨{b.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposit Nature *</label>
                  <select
                    value={bankDepositType}
                    onChange={e => setBankDepositType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    <option value="Daily Cash">Daily Station Drawer Cash (₨{netStationCashDrawerFloat.toLocaleString()})</option>
                    <option value="Net Profit">Daily Net Operating Profit (₨{netProfit.toLocaleString()})</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Bank Deposit Slip / Ref # *</label>
                  <input
                    type="text"
                    value={bankDepositSlip}
                    onChange={e => setBankDepositSlip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deposited By (Staff / Manager) *</label>
                  <input
                    type="text"
                    value={bankDepositor}
                    onChange={e => setBankDepositor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Amount to be Credited: <b className="font-mono text-sm">₨ {bankDepositAmount.toLocaleString()}</b></span>
                <span className="text-[10px] text-emerald-400">Automatic Ledger Audit Logging Active</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-slate-400 text-xs block mb-1 font-semibold">Shift Notes / Audit Annotations</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-bold text-white">Net Operating Profit:</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                {formatCurrency(netProfit)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNavigateToSummary}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLocked}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Finalize Station Daily Closing</span>
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
