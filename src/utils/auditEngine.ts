import { 
  AuditRecord, 
  AuditType, 
  BankDepositRecord, 
  DipTestRecord, 
  FuelRates, 
  ImmediateAuditAnomaly, 
  ImmediateAuditResult, 
  Partner, 
  PartnerWithdrawal, 
  StationBalance, 
  StationEntry 
} from '../types';

export const AuditEngine = {
  /**
   * Conduct immediate forensic audit on a newly submitted or updated station entry.
   */
  auditEntryImmediately(
    entry: Omit<StationEntry, 'id' | 'createdAt' | 'createdBy'> | StationEntry,
    stationBalances: StationBalance[],
    fuelRates: FuelRates,
    actor: string
  ): ImmediateAuditResult {
    const anomalies: ImmediateAuditAnomaly[] = [];
    const stationObj = stationBalances.find(s => s.station === entry.station);
    const managerInCharge = stationObj?.managerInCharge || 'Station Manager';

    // 1. NOZZLE READING VS SALES VOLUME VARIANCE AUDIT
    const nozzleVariance = Math.abs(entry.nozzleVariance || 0);
    const totalVolume = (entry.petrolSales || 0) + (entry.dieselSales || 0) + (entry.hiOctaneSales || 0);
    if (nozzleVariance > 10) {
      const isSevere = nozzleVariance > 30;
      const approxRate = entry.petrolSaleRate || fuelRates.psr || 375;
      const lossEstimate = Math.round(nozzleVariance * approxRate);

      anomalies.push({
        type: 'nozzle_variance',
        title: `Discharge Nozzle Variance: ${entry.station} (${nozzleVariance.toFixed(1)} Liters)`,
        severity: isSevere ? 'high' : 'medium',
        station: entry.station,
        date: entry.date,
        varianceLiters: nozzleVariance,
        varianceAmount: lossEstimate,
        metricComparison: `Pump meter: ${((totalVolume + entry.nozzleVariance)).toFixed(1)}L vs Cash Register: ${totalVolume.toFixed(1)}L`,
        irregularityNature: `Mechanical dispenser flow-meter totalizer differs from cash register sales volume by ${nozzleVariance.toFixed(1)} Liters (Est. financial exposure: ₨${lossEstimate.toLocaleString()}). Mechanical pulse totalizer slippage, meter seal tampering, or undocumented fuel dispensing.`,
        personResponsible: `${managerInCharge} (Station Incharge) & ${actor} (Closing Operator)`,
        recommendedAction: 'Immediate physical inspection of dispenser totalizer mechanical seals, calibration test using 10L conical proving measure, and attendant interrogation.',
      });
    }

    // 2. CASH DRAWER & OPERATING EXPENSE DRAIN AUDIT
    if (entry.revenue > 30000 && entry.totalExpenses > 0) {
      const expenseRatio = (entry.totalExpenses / entry.revenue) * 100;
      if (expenseRatio > 12.0) {
        anomalies.push({
          type: 'cash_shortage',
          title: `Abnormal Expense Drain: ${entry.station} (${expenseRatio.toFixed(1)}% of Revenue)`,
          severity: expenseRatio > 20 ? 'high' : 'medium',
          station: entry.station,
          date: entry.date,
          varianceAmount: entry.totalExpenses,
          metricComparison: `Reported expenses: ₨${entry.totalExpenses.toLocaleString()} (${expenseRatio.toFixed(1)}% vs benchmark <6%)`,
          irregularityNature: `Shift operating expenses of ₨${entry.totalExpenses.toLocaleString()} represent ${expenseRatio.toFixed(1)}% of total revenue ₨${entry.revenue.toLocaleString()}, drastically depleting station cash hand-over. Uncharacteristic discretionary cash outflow from station drawer.`,
          personResponsible: `${managerInCharge} (Station Manager in Charge)`,
          recommendedAction: 'Audit all physical expense vouchers, receipts, and station maintenance logs for CEO clearance.',
        });
      }
    }

    // 3. PROFIT MARGIN COMPRESSION AUDIT
    if (entry.revenue > 50000) {
      const netMargin = (entry.netProfit / entry.revenue) * 100;
      if (entry.netProfit <= 0 || netMargin < 1.2) {
        anomalies.push({
          type: 'margin_anomaly',
          title: `Compressed Net Profit Margin: ${entry.station} (${netMargin.toFixed(2)}%)`,
          severity: entry.netProfit <= 0 ? 'high' : 'medium',
          station: entry.station,
          date: entry.date,
          varianceAmount: entry.netProfit,
          metricComparison: `Net Profit: ₨${entry.netProfit.toLocaleString()} (Margin ${netMargin.toFixed(2)}% vs target >3.5%)`,
          irregularityNature: `Gross revenue of ₨${entry.revenue.toLocaleString()} yielded only ₨${entry.netProfit.toLocaleString()} in net profit (${netMargin.toFixed(2)}% margin). Profitability is sub-viable due to elevated procurement rates, sub-tariff fuel pricing, or excessive expense deductions.`,
          personResponsible: `${managerInCharge} (Station Manager in Charge)`,
          recommendedAction: 'Review retail sale tariffs against OGRA regulated pricing and verify procurement invoice discounts.',
        });
      }
    }

    // 4. RATE DISPARITY FROM BENCHMARK AUDIT
    if (fuelRates.psr > 0 && Math.abs(entry.petrolSaleRate - fuelRates.psr) > 2.5) {
      const diff = entry.petrolSaleRate - fuelRates.psr;
      anomalies.push({
        type: 'rate_deviation',
        title: `Petrol Tariff Disparity: ${entry.station} (₨${entry.petrolSaleRate}/L vs ₨${fuelRates.psr})`,
        severity: 'high',
        station: entry.station,
        date: entry.date,
        varianceAmount: Math.abs(diff),
        metricComparison: `Applied Rate: ₨${entry.petrolSaleRate}/L vs Official Benchmark: ₨${fuelRates.psr}/L`,
        irregularityNature: `Petrol was billed at ₨${entry.petrolSaleRate.toFixed(2)}/L instead of official company benchmark rate ₨${fuelRates.psr.toFixed(2)}/L (Disparity of ₨${diff.toFixed(2)}/L). Non-compliant pricing tariff without authorized executive price-change notice.`,
        personResponsible: `${managerInCharge} (Station Manager in Charge)`,
        recommendedAction: 'Recalibrate dispenser price totalizers immediately to match official tariff schedule.',
      });
    }

    if (fuelRates.dsr > 0 && Math.abs(entry.dieselSaleRate - fuelRates.dsr) > 2.5) {
      const diff = entry.dieselSaleRate - fuelRates.dsr;
      anomalies.push({
        type: 'rate_deviation',
        title: `Diesel Tariff Disparity: ${entry.station} (₨${entry.dieselSaleRate}/L vs ₨${fuelRates.dsr})`,
        severity: 'high',
        station: entry.station,
        date: entry.date,
        varianceAmount: Math.abs(diff),
        metricComparison: `Applied Rate: ₨${entry.dieselSaleRate}/L vs Official Benchmark: ₨${fuelRates.dsr}/L`,
        irregularityNature: `Diesel was billed at ₨${entry.dieselSaleRate.toFixed(2)}/L instead of official company benchmark rate ₨${fuelRates.dsr.toFixed(2)}/L (Disparity of ₨${diff.toFixed(2)}/L). Non-compliant pricing tariff without authorized executive price-change notice.`,
        personResponsible: `${managerInCharge} (Station Manager in Charge)`,
        recommendedAction: 'Recalibrate dispenser price totalizers immediately to match official tariff schedule.',
      });
    }

    // 5. INACTIVE STATION OPERATION AUDIT
    if (stationObj && stationObj.status === 'Inactive') {
      anomalies.push({
        type: 'station_inactive',
        title: `Unauthorized Operations on Inactive Station: ${entry.station}`,
        severity: 'high',
        station: entry.station,
        date: entry.date,
        irregularityNature: `Commercial shift operations and sales entries recorded for ${entry.station}, which is officially marked INACTIVE in corporate registry. Violation of operational shutdown orders.`,
        personResponsible: `${managerInCharge} (Station Manager in Charge) & ${actor} (Submitting User)`,
        recommendedAction: 'CEO Jalees intervention required to either reactivate station status or freeze dispensing nozzles.',
      });
    }

    // 6. UNDERGROUND TANK RUNOUT / CRITICAL STOCK ALERT
    if (stationObj) {
      const estRemainingPetrol = stationObj.petrolStock - (entry.petrolSales || 0);
      const estRemainingDiesel = stationObj.dieselStock - (entry.dieselSales || 0);

      if (estRemainingPetrol < 1000 && estRemainingPetrol >= 0) {
        anomalies.push({
          type: 'tank_critical',
          title: `Emergency Petrol Runout Hazard: ${entry.station}`,
          severity: 'high',
          station: entry.station,
          date: entry.date,
          varianceLiters: estRemainingPetrol,
          metricComparison: `Remaining Petrol: ${estRemainingPetrol.toLocaleString()} L (Capacity: ${stationObj.petrolCapacity} L)`,
          irregularityNature: `Underground Petrol tank depleted to critical dead-stock level of ${estRemainingPetrol.toLocaleString()} Liters (<5% capacity). Imminent risk of pump suction airlock and commercial stockout.`,
          personResponsible: `${managerInCharge} (Station Manager in Charge)`,
          recommendedAction: 'Dispatch immediate fuel tanker decanting order from central depot.',
        });
      }

      if (estRemainingDiesel < 1000 && estRemainingDiesel >= 0) {
        anomalies.push({
          type: 'tank_critical',
          title: `Emergency Diesel Runout Hazard: ${entry.station}`,
          severity: 'high',
          station: entry.station,
          date: entry.date,
          varianceLiters: estRemainingDiesel,
          metricComparison: `Remaining Diesel: ${estRemainingDiesel.toLocaleString()} L (Capacity: ${stationObj.dieselCapacity} L)`,
          irregularityNature: `Underground Diesel tank depleted to critical dead-stock level of ${estRemainingDiesel.toLocaleString()} Liters (<5% capacity). Imminent risk of pump suction airlock and commercial stockout.`,
          personResponsible: `${managerInCharge} (Station Manager in Charge)`,
          recommendedAction: 'Dispatch immediate fuel tanker decanting order from central depot.',
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      source: 'entry',
      station: entry.station,
      operator: actor,
      passed: anomalies.length === 0,
      anomalies,
    };
  },

  /**
   * Conduct immediate forensic audit on a bank deposit or cash treasury transfer.
   */
  auditTransferImmediately(
    deposit: Omit<BankDepositRecord, 'id' | 'createdAt'> | BankDepositRecord,
    stationBalances: StationBalance[],
    actor: string
  ): ImmediateAuditResult {
    const anomalies: ImmediateAuditAnomaly[] = [];
    const stationObj = stationBalances.find(s => s.station === deposit.station);
    const managerInCharge = stationObj?.managerInCharge || 'Station Manager';

    // 1. TILL CASH OVERDRAW AUDIT
    if (deposit.depositType === 'Daily Cash' && stationObj) {
      if (deposit.amount > stationObj.cashOnHand) {
        const deficit = deposit.amount - stationObj.cashOnHand;
        anomalies.push({
          type: 'transfer_deficit',
          title: `Till Cash Overdraw Deficit: ${deposit.station} (Deficit: ₨${deficit.toLocaleString()})`,
          severity: 'high',
          station: deposit.station,
          date: deposit.date,
          varianceAmount: deficit,
          metricComparison: `Deposit Request: ₨${deposit.amount.toLocaleString()} vs Station Cash Float: ₨${stationObj.cashOnHand.toLocaleString()}`,
          irregularityNature: `Bank deposit of ₨${deposit.amount.toLocaleString()} to ${deposit.bankName} exceeds station drawer cash on hand (₨${stationObj.cashOnHand.toLocaleString()}) by ₨${deficit.toLocaleString()}. Unaccounted cash float overdraw or unverified cash source.`,
          personResponsible: `${deposit.depositedBy || actor} (Depositing Officer) & ${managerInCharge} (Station Manager in Charge)`,
          recommendedAction: 'Reconcile station physical till cash count and verify actual cash handed over for deposit.',
        });
      }
    }

    // 2. UNVERIFIED HIGH-VALUE TRANSFER (Missing Slip)
    if (deposit.amount >= 100000 && (!deposit.slipNumber || deposit.slipNumber.trim() === '')) {
      anomalies.push({
        type: 'transfer_deficit',
        title: `Unverified High-Value Bank Deposit: ₨${deposit.amount.toLocaleString()}`,
        severity: 'medium',
        station: deposit.station,
        date: deposit.date,
        varianceAmount: deposit.amount,
        metricComparison: `Deposit Amount: ₨${deposit.amount.toLocaleString()} with NULL Slip Number`,
        irregularityNature: `High-value treasury transfer of ₨${deposit.amount.toLocaleString()} to ${deposit.bankName} recorded without bank deposit slip voucher or digital counterfoil reference. Non-compliant documentation.`,
        personResponsible: `${deposit.depositedBy || actor} (Depositing Officer)`,
        recommendedAction: 'Upload or record valid bank deposit slip voucher number immediately.',
      });
    }

    return {
      timestamp: new Date().toISOString(),
      source: 'transfer',
      station: deposit.station,
      operator: actor,
      passed: anomalies.length === 0,
      anomalies,
    };
  },

  /**
   * Conduct immediate forensic audit on partner withdrawals or equity disbursements.
   */
  auditWithdrawalImmediately(
    withdrawal: Omit<PartnerWithdrawal, 'id' | 'createdAt' | 'recordedBy'> | PartnerWithdrawal,
    partners: Partner[],
    actor: string
  ): ImmediateAuditResult {
    const anomalies: ImmediateAuditAnomaly[] = [];
    const partnerObj = partners.find(p => p.id === withdrawal.partnerId);

    // 1. CAPITAL OVERDRAW AUDIT
    if (withdrawal.withdrawalType === 'Capital' && partnerObj) {
      if (withdrawal.amount > partnerObj.investment) {
        const excess = withdrawal.amount - partnerObj.investment;
        anomalies.push({
          type: 'transfer_deficit',
          title: `Partner Capital Equity Overdraw: ${withdrawal.partnerName}`,
          severity: 'high',
          station: 'Corporate Treasury',
          date: withdrawal.date,
          varianceAmount: excess,
          metricComparison: `Disbursement: ₨${withdrawal.amount.toLocaleString()} vs Recorded Capital Base: ₨${partnerObj.investment.toLocaleString()}`,
          irregularityNature: `Capital return of ₨${withdrawal.amount.toLocaleString()} exceeds partner's recorded invested equity of ₨${partnerObj.investment.toLocaleString()} by ₨${excess.toLocaleString()}. Negative capital account balance violation.`,
          personResponsible: `${withdrawal.partnerName} (Partner) & ${actor} (Authorizing Officer)`,
          recommendedAction: 'CEO Jalees executive authorization required before releasing capital in excess of equity base.',
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      source: 'withdrawal',
      station: 'Corporate Treasury',
      operator: actor,
      passed: anomalies.length === 0,
      anomalies,
    };
  },

  /**
   * Conduct immediate forensic audit on physical brass dip tests.
   */
  auditDipTestImmediately(
    dipRecord: Omit<DipTestRecord, 'id' | 'createdAt'> | DipTestRecord,
    stationBalances: StationBalance[]
  ): ImmediateAuditResult {
    const anomalies: ImmediateAuditAnomaly[] = [];
    const varianceLiters = Math.abs(dipRecord.varianceLiters);
    const variancePercent = Math.abs(dipRecord.variancePercent);

    // 1. SIGNIFICANT DIP SHORTAGE / EXCESS VARIANCE
    if (varianceLiters > 150 || variancePercent > 0.6) {
      const isCritical = varianceLiters > 300 || variancePercent > 1.2;
      anomalies.push({
        type: 'dip_anomaly',
        title: `Underground Tank Dip Discrepancy: ${dipRecord.station} (${varianceLiters.toFixed(0)}L, ${variancePercent.toFixed(2)}%)`,
        severity: isCritical ? 'high' : 'medium',
        station: dipRecord.station,
        date: dipRecord.date,
        varianceLiters,
        metricComparison: `Physical Dip: ${dipRecord.calculatedLiters.toLocaleString()}L vs Digital ATG Ledger: ${dipRecord.ledgerLiters.toLocaleString()}L`,
        irregularityNature: `Physical brass dip test indicates ${dipRecord.calculatedLiters.toLocaleString()} Liters in Tank #${dipRecord.tankNumber} (${dipRecord.fuelType}) versus digital ledger book of ${dipRecord.ledgerLiters.toLocaleString()} Liters (Discrepancy: ${varianceLiters.toFixed(1)}L, ${variancePercent.toFixed(2)}%). Underground fuel shrinkage, unmetered pump line leakage, or unrecorded decanting loss.`,
        personResponsible: `${dipRecord.personResponsible} (Station Manager in Charge) & ${dipRecord.conductedBy} (Dip Attendant)`,
        recommendedAction: 'Conduct secondary verification dip with certified calibration rod, check tank manifold valves, and cross-reference pump meter totalizers.',
      });
    }

    // 2. WATER CONTAMINATION DETECTION (Water-finding paste > 0mm)
    if (dipRecord.waterDipMm > 0) {
      anomalies.push({
        type: 'dip_anomaly',
        title: `Water Ingress Contamination: ${dipRecord.station} Tank #${dipRecord.tankNumber} (${dipRecord.waterDipMm}mm)`,
        severity: 'high',
        station: dipRecord.station,
        date: dipRecord.date,
        metricComparison: `Water Paste Level: ${dipRecord.waterDipMm}mm (Zero tolerance required)`,
        irregularityNature: `Water-finding paste test detected ${dipRecord.waterDipMm}mm water layer at tank bottom in Tank #${dipRecord.tankNumber} (${dipRecord.fuelType}). Water ingress causes phase separation and vehicle engine failure.`,
        personResponsible: `${dipRecord.personResponsible} (Station Manager in Charge)`,
        recommendedAction: 'Halt fuel dispensing from this tank immediately. Deploy emergency mobile suction pump to extract bottom water slurry.',
      });
    }

    return {
      timestamp: new Date().toISOString(),
      source: 'dip_test',
      station: dipRecord.station,
      operator: dipRecord.conductedBy,
      passed: anomalies.length === 0,
      anomalies,
    };
  }
};
