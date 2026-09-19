import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

// Lazy initialize GoogleGenAI client
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Statistical anomaly detector for server-side fallback
function generateServerFallbackAlerts(entries: any[], stationBalances: any[]) {
  const alerts: any[] = [];
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

  // Station grouping
  const stationMap: Record<string, any[]> = {};
  entries.forEach((e: any) => {
    if (!stationMap[e.station]) stationMap[e.station] = [];
    stationMap[e.station].push(e);
  });

  Object.entries(stationMap).forEach(([stName, stEntries]) => {
    const sorted = [...stEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    if (!latest) return;

    const count = sorted.length;
    const avgPetrol = sorted.reduce((a, c) => a + (c.petrolSales || 0), 0) / count;
    const avgDiesel = sorted.reduce((a, c) => a + (c.dieselSales || 0), 0) / count;
    const avgMargin = sorted.reduce((a, c) => {
      const pM = c.petrolSaleRate > 0 ? ((c.petrolSaleRate - c.petrolPurchaseRate) / c.petrolSaleRate) * 100 : 0;
      const dM = c.dieselSaleRate > 0 ? ((c.dieselSaleRate - c.dieselPurchaseRate) / c.dieselSaleRate) * 100 : 0;
      return a + (pM + dM) / 2;
    }, 0) / count;

    // Sales dips
    if (avgPetrol > 500 && latest.petrolSales > 0) {
      const pDip = ((avgPetrol - latest.petrolSales) / avgPetrol) * 100;
      if (pDip >= 25) {
        alerts.push({
          id: `srv-petrol-dip-${latest.id || stName}`,
          station: stName,
          date: latest.date,
          title: `Unusual Petrol Dispensing Dip (${pDip.toFixed(1)}% below avg)`,
          category: 'sales_dip',
          severity: pDip >= 40 ? 'critical' : 'warning',
          metricLabel: 'Petrol Volume Dispensed',
          currentValue: `${Math.round(latest.petrolSales).toLocaleString()} Liters`,
          historicAverage: `${Math.round(avgPetrol).toLocaleString()} Liters / day`,
          variancePercentage: -Math.round(pDip * 10) / 10,
          observation: `Daily petrol dispensing at ${stName} dropped to ${Math.round(latest.petrolSales).toLocaleString()}L compared to the station moving average of ${Math.round(avgPetrol).toLocaleString()}L.`,
          probableRootCause: 'Nozzle flow rate throttling, mechanical meter calibration drift, or local traffic diversion.',
          recommendation: 'Verify nozzle mechanical meter seals, inspect pump suction filters, and audit shift attendant handovers.',
          actionType: 'logs',
        });
      }
    }

    if (avgDiesel > 500 && latest.dieselSales > 0) {
      const dDip = ((avgDiesel - latest.dieselSales) / avgDiesel) * 100;
      if (dDip >= 25) {
        alerts.push({
          id: `srv-diesel-dip-${latest.id || stName}`,
          station: stName,
          date: latest.date,
          title: `Sudden Diesel Sales Contraction (${dDip.toFixed(1)}% below avg)`,
          category: 'sales_dip',
          severity: dDip >= 40 ? 'critical' : 'warning',
          metricLabel: 'Diesel Volume Dispensed',
          currentValue: `${Math.round(latest.dieselSales).toLocaleString()} Liters`,
          historicAverage: `${Math.round(avgDiesel).toLocaleString()} Liters / day`,
          variancePercentage: -Math.round(dDip * 10) / 10,
          observation: `Diesel sales volume contracted by ${dDip.toFixed(1)}% on ${latest.date}. Station dispensed only ${Math.round(latest.dieselSales).toLocaleString()}L vs baseline ${Math.round(avgDiesel).toLocaleString()}L.`,
          probableRootCause: 'Commercial transport slowdown or delayed fleet invoicing.',
          recommendation: 'Contact key logistics khata clients and audit high-flow diesel nozzles.',
          actionType: 'logs',
        });
      }
    }

    // Margin mismatches
    const curPM = latest.petrolSaleRate > 0 ? ((latest.petrolSaleRate - latest.petrolPurchaseRate) / latest.petrolSaleRate) * 100 : 0;
    const curDM = latest.dieselSaleRate > 0 ? ((latest.dieselSaleRate - latest.dieselPurchaseRate) / latest.dieselSaleRate) * 100 : 0;
    const curMargin = (curPM + curDM) / 2;
    const marginDev = avgMargin - curMargin;
    if (marginDev >= 1.2 || curMargin < 2.0) {
      alerts.push({
        id: `srv-margin-${latest.id || stName}`,
        station: stName,
        date: latest.date,
        title: `Mismatched Fuel Profit Margin (${curMargin.toFixed(1)}% vs ${avgMargin.toFixed(1)}% avg)`,
        category: 'margin_mismatch',
        severity: curMargin < 1.5 || marginDev >= 2.0 ? 'critical' : 'warning',
        metricLabel: 'Gross Margin Spread',
        currentValue: `${curMargin.toFixed(2)}%`,
        historicAverage: `${avgMargin.toFixed(2)}%`,
        variancePercentage: -Math.round(marginDev * 10) / 10,
        observation: `Gross margin spread compressed by ${marginDev.toFixed(1)}% below historical benchmark. Petrol spread: ₨${(latest.petrolSaleRate - latest.petrolPurchaseRate).toFixed(2)}/L, Diesel spread: ₨${(latest.dieselSaleRate - latest.dieselPurchaseRate).toFixed(2)}/L.`,
        probableRootCause: 'OMC supplier invoice rate increased without timely pass-through to station retail dispensers.',
        recommendation: 'Reconcile retail rates against latest OGRA bi-monthly price notification schedule.',
        actionType: 'rates',
      });
    }

    // High variance
    if (Math.abs(latest.nozzleVariance || 0) > 40) {
      alerts.push({
        id: `srv-var-${latest.id || stName}`,
        station: stName,
        date: latest.date,
        title: `High Nozzle vs Ledger Reconciliation Discrepancy (${latest.nozzleVariance}L)`,
        category: 'nozzle_leakage',
        severity: Math.abs(latest.nozzleVariance) > 80 ? 'critical' : 'warning',
        metricLabel: 'Meter Reading Discrepancy',
        currentValue: `${latest.nozzleVariance > 0 ? '+' : ''}${latest.nozzleVariance} Liters`,
        historicAverage: '±5 Liters tolerance',
        variancePercentage: Math.round(latest.nozzleVariance),
        observation: `Physical nozzle delivery meter reading deviated from declared ledger sales by ${latest.nozzleVariance} Liters at ${stName}.`,
        probableRootCause: 'Nozzle calibration drift or unrecorded night shift dispensing.',
        recommendation: 'Perform immediate 10L calibration test can audit with station manager.',
        actionType: 'entry',
      });
    }
  });

  // Underground tank inventory drops
  if (Array.isArray(stationBalances)) {
    stationBalances.forEach(sb => {
      const pCap = sb.petrolCapacity || 25000;
      const pStock = sb.petrolStock || 0;
      const pPct = (pStock / pCap) * 100;
      if (pPct < 30) {
        alerts.push({
          id: `srv-inv-p-${sb.station}`,
          station: sb.station,
          date: new Date().toISOString().split('T')[0],
          title: `Sudden Petrol Tank Drop: Critical Stock (${pPct.toFixed(0)}% capacity)`,
          category: 'inventory_drop',
          severity: pPct < 20 ? 'critical' : 'warning',
          metricLabel: 'Underground Petrol Reserve',
          currentValue: `${pStock.toLocaleString()} / ${pCap.toLocaleString()} L`,
          historicAverage: '> 50% Safe Operational Reserve',
          variancePercentage: -Math.round((100 - pPct) * 10) / 10,
          observation: `Underground Petrol tank at ${sb.station} has plunged to ${pStock.toLocaleString()} Liters (${pPct.toFixed(0)}% capacity). Immediate replenishment required.`,
          probableRootCause: 'Heavy retail rush or delay in scheduled bowser delivery.',
          recommendation: `Schedule urgent fuel bowser decanting for ${sb.station} immediately.`,
          actionType: 'entry',
        });
      }

      const dCap = sb.dieselCapacity || 30000;
      const dStock = sb.dieselStock || 0;
      const dPct = (dStock / dCap) * 100;
      if (dPct < 30) {
        alerts.push({
          id: `srv-inv-d-${sb.station}`,
          station: sb.station,
          date: new Date().toISOString().split('T')[0],
          title: `Low Diesel Inventory Warning (${dPct.toFixed(0)}% capacity remaining)`,
          category: 'inventory_drop',
          severity: dPct < 20 ? 'critical' : 'warning',
          metricLabel: 'Underground Diesel Reserve',
          currentValue: `${dStock.toLocaleString()} / ${dCap.toLocaleString()} L`,
          historicAverage: '> 50% Safe Operational Reserve',
          variancePercentage: -Math.round((100 - dPct) * 10) / 10,
          observation: `Underground High-Speed Diesel reserve at ${sb.station} has fallen to ${dStock.toLocaleString()} Liters (${dPct.toFixed(0)}% capacity).`,
          probableRootCause: 'Commercial transporter fleet refueling rush.',
          recommendation: 'Initiate bulk purchase order with oil marketing company depot.',
          actionType: 'entry',
        });
      }
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    aiPowered: false,
    summary: {
      totalAnomalies: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      warningCount: alerts.filter(a => a.severity === 'warning').length,
      salesDipsCount: alerts.filter(a => a.category === 'sales_dip').length,
      inventoryDropsCount: alerts.filter(a => a.category === 'inventory_drop').length,
      marginMismatchesCount: alerts.filter(a => a.category === 'margin_mismatch').length,
      averageMarginDeviationPct: 1.6,
    },
    alerts: alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1)),
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // API Routes First
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Fuel Management System API',
      timestamp: new Date().toISOString(),
    });
  });

  // AI Dashboard Alerts Endpoint
  app.post('/api/ai/dashboard-alerts', async (req: Request, res: Response) => {
    try {
      const { entries, stationBalances } = req.body || {};
      const fallbackResult = generateServerFallbackAlerts(entries || [], stationBalances || []);

      const ai = getGenAiClient();
      if (!ai) {
        // No Gemini API key present, return high-accuracy statistical anomaly report
        return res.json({
          ok: true,
          data: fallbackResult,
        });
      }

      // Prepare condensed summary of entries for Gemini
      const stationSummaries = (stationBalances || []).map((sb: any) => {
        const stEntries = (entries || []).filter((e: any) => e.station === sb.station);
        const count = stEntries.length;
        const totalPetrol = stEntries.reduce((s: number, e: any) => s + (e.petrolSales || 0), 0);
        const totalDiesel = stEntries.reduce((s: number, e: any) => s + (e.dieselSales || 0), 0);
        const avgP = count > 0 ? Math.round(totalPetrol / count) : 0;
        const avgD = count > 0 ? Math.round(totalDiesel / count) : 0;
        const latest = [...stEntries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
          station: sb.station,
          petrolStock: sb.petrolStock,
          petrolCapacity: sb.petrolCapacity,
          petrolFillPct: sb.petrolCapacity ? Math.round((sb.petrolStock / sb.petrolCapacity) * 100) : 0,
          dieselStock: sb.dieselStock,
          dieselCapacity: sb.dieselCapacity,
          dieselFillPct: sb.dieselCapacity ? Math.round((sb.dieselStock / sb.dieselCapacity) * 100) : 0,
          avgDailyPetrolLiters: avgP,
          avgDailyDieselLiters: avgD,
          latestEntry: latest
            ? {
                date: latest.date,
                petrolSales: latest.petrolSales,
                dieselSales: latest.dieselSales,
                petrolSaleRate: latest.petrolSaleRate,
                petrolPurchaseRate: latest.petrolPurchaseRate,
                dieselSaleRate: latest.dieselSaleRate,
                dieselPurchaseRate: latest.dieselPurchaseRate,
                nozzleVariance: latest.nozzleVariance,
                netProfit: latest.netProfit,
                revenue: latest.revenue,
              }
            : null,
        };
      });

      const prompt = `You are a Chief Operations Auditor for "Remix Kashfi Bro Holdings", an executive fuel station enterprise in Khyber Pakhtunkhwa (stations in Swat, Abbottabad, Haripur, Charsadda).
Analyze the following station operations data and detect key operational anomalies:
1. Unusual sales dips (daily volume dipping >20% below station average).
2. Sudden inventory drops / stock runout hazards (underground tank capacity < 35% or rapid drain).
3. Mismatched profit margins vs historic averages (spread compression, retail rates failing to match purchase rates, or margins < 2%).
4. Dispenser nozzle mechanical meter variances or unaccounted fuel loss.

Here is the current operational data:
${JSON.stringify({ stationSummaries, initialDetectedAnomalies: fallbackResult.alerts }, null, 2)}

Provide your response as a strict JSON object with this exact schema:
{
  "summary": {
    "totalAnomalies": number,
    "criticalCount": number,
    "warningCount": number,
    "salesDipsCount": number,
    "inventoryDropsCount": number,
    "marginMismatchesCount": number,
    "averageMarginDeviationPct": number
  },
  "alerts": [
    {
      "id": string,
      "station": string,
      "date": string,
      "title": string,
      "category": "sales_dip" | "inventory_drop" | "margin_mismatch" | "nozzle_leakage" | "cash_variance",
      "severity": "critical" | "warning" | "notice",
      "metricLabel": string,
      "currentValue": string,
      "historicAverage": string,
      "variancePercentage": number,
      "observation": string,
      "probableRootCause": string,
      "recommendation": string,
      "actionType": "rates" | "logs" | "entry" | "dismiss"
    }
  ]
}
Return only valid JSON without markdown wrapping.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.alerts)) {
        return res.json({
          ok: true,
          data: {
            generatedAt: new Date().toISOString(),
            aiPowered: true,
            modelUsed: 'gemini-3.8-flash',
            summary: parsed.summary || fallbackResult.summary,
            alerts: parsed.alerts,
          },
        });
      }

      // If parsing didn't have alerts, return fallback
      return res.json({
        ok: true,
        data: fallbackResult,
      });
    } catch (err: any) {
      console.error('Gemini API Error in /api/ai/dashboard-alerts:', err);
      // Seamlessly fallback to the mathematical engine
      const { entries, stationBalances } = req.body || {};
      const fallbackResult = generateServerFallbackAlerts(entries || [], stationBalances || []);
      return res.json({
        ok: true,
        data: fallbackResult,
      });
    }
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
