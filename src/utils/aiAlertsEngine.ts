import { StationEntry, StationBalance, DashboardAlertItem, DashboardAlertsResponse } from '../types';

export function runStatisticalAnomalyDetection(
  entries: StationEntry[],
  stationBalances: StationBalance[]
): DashboardAlertsResponse {
  const alerts: DashboardAlertItem[] = [];

  if (!entries || entries.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      aiPowered: false,
      summary: {
        totalAnomalies: 0,
        criticalCount: 0,
        warningCount: 0,
        salesDipsCount: 0,
        inventoryDropsCount: 0,
        marginMismatchesCount: 0,
        averageMarginDeviationPct: 0,
      },
      alerts: [],
    };
  }

  // Group entries by station
  const stationEntriesMap: Record<string, StationEntry[]> = {};
  entries.forEach(e => {
    if (!stationEntriesMap[e.station]) {
      stationEntriesMap[e.station] = [];
    }
    stationEntriesMap[e.station].push(e);
  });

  // Calculate historic averages per station
  Object.entries(stationEntriesMap).forEach(([stationName, stEntries]) => {
    // Sort descending by date
    const sorted = [...stEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];

    if (!latest) return;

    // Averages across other entries (or all entries)
    const count = sorted.length;
    const avgPetrol = sorted.reduce((acc, cur) => acc + (cur.petrolSales || 0), 0) / count;
    const avgDiesel = sorted.reduce((acc, cur) => acc + (cur.dieselSales || 0), 0) / count;
    
    // Margins
    const margins = sorted.map(e => {
      const pMargin = e.petrolSaleRate > 0 ? ((e.petrolSaleRate - e.petrolPurchaseRate) / e.petrolSaleRate) * 100 : 0;
      const dMargin = e.dieselSaleRate > 0 ? ((e.dieselSaleRate - e.dieselPurchaseRate) / e.dieselSaleRate) * 100 : 0;
      return (pMargin + dMargin) / 2;
    });
    const avgMargin = margins.reduce((a, b) => a + b, 0) / (margins.length || 1);

    // 1. UNUSUAL SALES DIPS CHECK (Petrol & Diesel)
    if (avgPetrol > 500 && latest.petrolSales > 0) {
      const petrolDipPct = ((avgPetrol - latest.petrolSales) / avgPetrol) * 100;
      if (petrolDipPct >= 25) {
        const isCrit = petrolDipPct >= 40;
        alerts.push({
          id: `alert-sales-petrol-${latest.id || stationName}`,
          station: stationName as any,
          date: latest.date,
          title: `Unusual Petrol Dispensing Dip (${petrolDipPct.toFixed(1)}% below avg)`,
          category: 'sales_dip',
          severity: isCrit ? 'critical' : 'warning',
          metricLabel: 'Petrol Volume Dispensed',
          currentValue: `${Math.round(latest.petrolSales).toLocaleString()} Liters`,
          historicAverage: `${Math.round(avgPetrol).toLocaleString()} Liters / day`,
          variancePercentage: -Math.round(petrolDipPct * 10) / 10,
          observation: `Daily petrol dispensing at ${stationName} dropped to ${Math.round(latest.petrolSales).toLocaleString()}L compared to the station moving average of ${Math.round(avgPetrol).toLocaleString()}L.`,
          probableRootCause: isCrit
            ? 'Possible nozzle flow-rate sensor throttling, electronic totalizer reset, or underground tank suction pump line airlock.'
            : 'Localized traffic diversion, intermittent pump electrical tripping, or regional consumer demand fluctuation.',
          recommendation: 'Verify nozzle mechanical meter seals, inspect pump strainer filters, and audit shift attendant handovers.',
          actionType: 'logs',
        });
      }
    }

    if (avgDiesel > 500 && latest.dieselSales > 0) {
      const dieselDipPct = ((avgDiesel - latest.dieselSales) / avgDiesel) * 100;
      if (dieselDipPct >= 25) {
        const isCrit = dieselDipPct >= 40;
        alerts.push({
          id: `alert-sales-diesel-${latest.id || stationName}`,
          station: stationName as any,
          date: latest.date,
          title: `Sudden Diesel Sales Contraction (${dieselDipPct.toFixed(1)}% below avg)`,
          category: 'sales_dip',
          severity: isCrit ? 'critical' : 'warning',
          metricLabel: 'Diesel Volume Dispensed',
          currentValue: `${Math.round(latest.dieselSales).toLocaleString()} Liters`,
          historicAverage: `${Math.round(avgDiesel).toLocaleString()} Liters / day`,
          variancePercentage: -Math.round(dieselDipPct * 10) / 10,
          observation: `Diesel sales volume contracted by ${dieselDipPct.toFixed(1)}% on ${latest.date}. Station dispensed only ${Math.round(latest.dieselSales).toLocaleString()}L vs baseline ${Math.round(avgDiesel).toLocaleString()}L.`,
          probableRootCause: 'Interruption in heavy commercial freight or fleet transport corridor, or local diesel price gap.',
          recommendation: 'Check commercial transporter khata accounts and ensure high-flow diesel nozzles are operating at full PSI.',
          actionType: 'logs',
        });
      }
    }

    // 2. MISMATCHED PROFIT MARGINS VS HISTORIC AVERAGES
    const latestPMargin = latest.petrolSaleRate > 0 ? ((latest.petrolSaleRate - latest.petrolPurchaseRate) / latest.petrolSaleRate) * 100 : 0;
    const latestDMargin = latest.dieselSaleRate > 0 ? ((latest.dieselSaleRate - latest.dieselPurchaseRate) / latest.dieselSaleRate) * 100 : 0;
    const latestAvgMargin = (latestPMargin + latestDMargin) / 2;

    const marginDeviation = avgMargin - latestAvgMargin;
    if (marginDeviation >= 1.2 || latestAvgMargin < 2.0) {
      const isSevere = latestAvgMargin < 1.5 || marginDeviation >= 2.0;
      alerts.push({
        id: `alert-margin-${latest.id || stationName}`,
        station: stationName as any,
        date: latest.date,
        title: `Mismatched Fuel Profit Margin (${latestAvgMargin.toFixed(1)}% vs ${avgMargin.toFixed(1)}% avg)`,
        category: 'margin_mismatch',
        severity: isSevere ? 'critical' : 'warning',
        metricLabel: 'Gross Margin Spread',
        currentValue: `${latestAvgMargin.toFixed(2)}%`,
        historicAverage: `${avgMargin.toFixed(2)}%`,
        variancePercentage: -Math.round(marginDeviation * 10) / 10,
        observation: `Gross margin spread compressed by ${marginDeviation.toFixed(1)}% below historical benchmark. Petrol spread: ₨${(latest.petrolSaleRate - latest.petrolPurchaseRate).toFixed(2)}/L, Diesel spread: ₨${(latest.dieselSaleRate - latest.dieselPurchaseRate).toFixed(2)}/L.`,
        probableRootCause: 'Purchase rate from OMC supplier or refinery increased without timely adjustment in station retail sales rate, or high-cost inventory was sold prior to price revision.',
        recommendation: 'Synchronize retail rates with official OGRA price notifications and check stock margin calculation mode (Standard vs Average Stock).',
        actionType: 'rates',
      });
    }

    // 3. UNUSUAL NOZZLE OR CASH VARIANCE
    if (Math.abs(latest.nozzleVariance || 0) > 40) {
      alerts.push({
        id: `alert-variance-${latest.id || stationName}`,
        station: stationName as any,
        date: latest.date,
        title: `High Nozzle vs Cash Reconciliation Variance (${Math.abs(latest.nozzleVariance)}L)`,
        category: 'nozzle_leakage',
        severity: Math.abs(latest.nozzleVariance) > 80 ? 'critical' : 'warning',
        metricLabel: 'Meter Reading Discrepancy',
        currentValue: `${latest.nozzleVariance > 0 ? '+' : ''}${latest.nozzleVariance} Liters`,
        historicAverage: '±5 Liters tolerance',
        variancePercentage: Math.round(latest.nozzleVariance),
        observation: `Physical nozzle delivery meter reading deviated from declared ledger sales by ${latest.nozzleVariance} Liters at ${stationName}.`,
        probableRootCause: 'Nozzle calibration drift, fuel delivery line evaporation/temperature contraction, or unrecorded cash fueling.',
        recommendation: 'Order immediate calibration dip-test on all active nozzles using official 10L measuring can.',
        actionType: 'entry',
      });
    }
  });

  // 4. SUDDEN INVENTORY DROPS & TANK RUNOUT HAZARDS
  stationBalances.forEach(sb => {
    const petCap = sb.petrolCapacity || 25000;
    const petStock = sb.petrolStock || 0;
    const petPct = (petStock / petCap) * 100;

    const dieCap = sb.dieselCapacity || 30000;
    const dieStock = sb.dieselStock || 0;
    const diePct = (dieStock / dieCap) * 100;

    if (petPct < 30) {
      alerts.push({
        id: `alert-inv-petrol-${sb.station}`,
        station: sb.station,
        date: new Date().toISOString().split('T')[0],
        title: `Sudden Petrol Tank Drop: Critical Stock (${petPct.toFixed(0)}% capacity)`,
        category: 'inventory_drop',
        severity: petPct < 20 ? 'critical' : 'warning',
        metricLabel: 'Underground Petrol Reserve',
        currentValue: `${petStock.toLocaleString()} / ${petCap.toLocaleString()} L`,
        historicAverage: '> 50% Safe Operational Reserve',
        variancePercentage: -Math.round((100 - petPct) * 10) / 10,
        observation: `Underground Petrol tank at ${sb.station} has plunged to ${petStock.toLocaleString()} Liters (${petPct.toFixed(0)}% capacity). Immediate replenishment required.`,
        probableRootCause: 'Accelerated dispensing turnover or delay in bulk bowser dispatch from refinery / OMC depot.',
        recommendation: `Schedule urgent fuel bowser decanting for ${sb.station} before tank hits dead-bottom sediment level.`,
        actionType: 'entry',
      });
    }

    if (diePct < 30) {
      alerts.push({
        id: `alert-inv-diesel-${sb.station}`,
        station: sb.station,
        date: new Date().toISOString().split('T')[0],
        title: `Low Diesel Inventory Warning (${diePct.toFixed(0)}% capacity remaining)`,
        category: 'inventory_drop',
        severity: diePct < 20 ? 'critical' : 'warning',
        metricLabel: 'Underground Diesel Reserve',
        currentValue: `${dieStock.toLocaleString()} / ${dieCap.toLocaleString()} L`,
        historicAverage: '> 50% Safe Operational Reserve',
        variancePercentage: -Math.round((100 - diePct) * 10) / 10,
        observation: `Underground High-Speed Diesel reserve at ${sb.station} has fallen to ${dieStock.toLocaleString()} Liters (${diePct.toFixed(0)}% capacity).`,
        probableRootCause: 'Heavy fleet bulk purchasing or delayed transit on supply highway.',
        recommendation: 'Place emergency purchase indent with OMC supply coordinator.',
        actionType: 'entry',
      });
    }
  });

  // Calculate summary counts
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const salesDipsCount = alerts.filter(a => a.category === 'sales_dip').length;
  const inventoryDropsCount = alerts.filter(a => a.category === 'inventory_drop').length;
  const marginMismatchesCount = alerts.filter(a => a.category === 'margin_mismatch').length;

  return {
    generatedAt: new Date().toISOString(),
    aiPowered: false,
    summary: {
      totalAnomalies: alerts.length,
      criticalCount,
      warningCount,
      salesDipsCount,
      inventoryDropsCount,
      marginMismatchesCount,
      averageMarginDeviationPct: 1.6,
    },
    alerts: alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1)),
  };
}

// Fetch AI-enhanced anomalies from server-side Gemini route
export async function fetchAiDashboardAlerts(
  entries: StationEntry[],
  stationBalances: StationBalance[]
): Promise<DashboardAlertsResponse> {
  // Always prepare baseline statistical detection first
  const fallback = runStatisticalAnomalyDetection(entries, stationBalances);

  try {
    const res = await fetch('/api/ai/dashboard-alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entries,
        stationBalances,
      }),
    });

    if (!res.ok) {
      console.warn('API /api/ai/dashboard-alerts returned non-200, using statistical detection');
      return fallback;
    }

    const data = await res.json();
    if (data && data.data && Array.isArray(data.data.alerts)) {
      return data.data;
    }

    return fallback;
  } catch (err) {
    console.warn('Error connecting to /api/ai/dashboard-alerts, falling back to client engine:', err);
    return fallback;
  }
}
