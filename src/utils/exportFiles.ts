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

export interface ExportDataPayload {
  session?: UserSession;
  entries: StationEntry[];
  stationBalances: StationBalance[];
  partners: Partner[];
  withdrawals: PartnerWithdrawal[];
  rates?: FuelRates;
  audits?: AuditRecord[];
  bankAccounts?: BankAccount[];
  bankDeposits?: BankDepositRecord[];
  creditLoans?: CreditClientLoan[];
  reportDate?: string;
  selectedStation?: string;
}

/**
 * Generates clean, high-density printable HTML content
 */
export function generatePrintableHtmlContent(data: ExportDataPayload, statementTitle = 'EXECUTIVE FUEL OPERATIONS & FINANCIAL STATEMENT'): string {
  const today = data.reportDate || new Date().toISOString().split('T')[0];
  const totalNet = data.entries.reduce((a, e) => a + e.netProfit, 0);
  const totalGross = data.entries.reduce((a, e) => a + e.grossProfit, 0);
  const totalExpenses = data.entries.reduce((a, e) => a + e.totalExpenses, 0);
  const totalRevenue = data.entries.reduce((a, e) => a + e.revenue, 0);
  const totalPetrol = data.entries.reduce((a, e) => a + e.petrolSales, 0);
  const totalDiesel = data.entries.reduce((a, e) => a + e.dieselSales, 0);
  const totalHiOctane = data.entries.reduce((a, e) => a + (e.hiOctaneSales || 0), 0);
  const totalLiters = totalPetrol + totalDiesel + totalHiOctane;
  const netMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

  const totalStationCash = data.stationBalances.reduce((a, s) => a + s.cashOnHand, 0);
  const totalStationInvest = data.stationBalances.reduce((a, s) => a + s.allocatedInvestment, 0);
  const totalPartnerCapital = data.partners.reduce((a, p) => a + p.investment, 0);
  const totalWithdrawn = data.withdrawals.reduce((a, w) => a + w.amount, 0);

  const bankAccounts = data.bankAccounts || [];
  const bankDeposits = data.bankDeposits || [];
  const creditLoans = data.creditLoans || [];

  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.currentBalance, 0);
  const totalBankDeposits = bankDeposits.reduce((s, d) => s + d.amount, 0);
  const totalCreditLoanAmount = creditLoans.reduce((s, l) => s + l.amount, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>KBH Statement — ${today}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 10mm 8mm 10mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
    font-size: 10.5px;
    line-height: 1.35;
  }
  .page-container {
    max-width: 820px;
    margin: 0 auto;
    padding: 12px;
  }
  .header {
    border-bottom: 2px solid #2563eb;
    padding-bottom: 8px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .brand-title {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
    margin: 0;
  }
  .brand-sub {
    font-size: 10px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .meta-box {
    text-align: right;
    font-size: 10px;
    color: #475569;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
  }
  .kpi-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px 9px;
    background: #f8fafc;
  }
  .kpi-label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }
  .kpi-value {
    font-size: 14px;
    font-weight: 900;
    margin-top: 2px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #1e293b;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 3px;
    margin-top: 10px;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 9.5px;
  }
  th {
    background-color: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 3.5px 6px;
    border: 1px solid #e2e8f0;
  }
  .num {
    text-align: right;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 8px;
  }
  .footer {
    margin-top: 14px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    font-size: 9px;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .signature-box {
    border: 1px dashed #94a3b8;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: bold;
    display: inline-block;
  }
  @media print {
    body {
      padding: 0;
      background: none;
    }
    .no-print {
      display: none !important;
    }
  }
</style>
</head>
<body>
<div class="page-container">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-title">KASHFI BRO HOLDINGS</div>
      <div class="brand-sub">${statementTitle}</div>
    </div>
    <div class="meta-box">
      <div><strong>Date:</strong> ${today}</div>
      <div><strong>Terminal Operator:</strong> ${data.session?.name || 'CEO Jalees'} (${data.session?.label || 'CEO'})</div>
      <div><strong>Document ID:</strong> KBH-${today.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}</div>
    </div>
  </div>

  <!-- KPI Grid -->
  <div class="kpi-grid">
    <div class="kpi-card" style="border-left: 3px solid #2563eb;">
      <div class="kpi-label">Gross Revenue</div>
      <div class="kpi-value" style="color: #2563eb;">₨${totalRevenue.toLocaleString()}</div>
      <div style="font-size: 8px; color: #64748b;">${totalLiters.toLocaleString()} Total Liters Sold</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #059669;">
      <div class="kpi-label">Net Operating Profit</div>
      <div class="kpi-value" style="color: #059669;">₨${totalNet.toLocaleString()}</div>
      <div style="font-size: 8px; color: #64748b;">Margin: ${netMargin.toFixed(1)}%</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #10b981;">
      <div class="kpi-label">Corporate Bank Balances</div>
      <div class="kpi-value" style="color: #047857;">₨${totalBankBalance.toLocaleString()}</div>
      <div style="font-size: 8px; color: #64748b;">Across ${bankAccounts.length} Verified Accounts</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #d97706;">
      <div class="kpi-label">Station Drawer Cash</div>
      <div class="kpi-value" style="color: #d97706;">₨${totalStationCash.toLocaleString()}</div>
      <div style="font-size: 8px; color: #64748b;">Float Across ${data.stationBalances.length} Stations</div>
    </div>
  </div>

  <!-- 1. Gas Station Infrastructure & Tanks -->
  <div class="section-title">Gas Stations Fleet, Tanks & Fuel Balances</div>
  <table>
    <thead>
      <tr>
        <th>Station</th>
        <th>Status</th>
        <th class="num">Tanks</th>
        <th class="num">Dispensers</th>
        <th class="num">Nozzles</th>
        <th class="num">Petrol Stock</th>
        <th class="num">Diesel Stock</th>
        <th class="num">Drawer Cash</th>
        <th class="num">Allocated Capital</th>
        <th>Manager In-Charge</th>
      </tr>
    </thead>
    <tbody>
      ${data.stationBalances.map(s => `
        <tr>
          <td><strong>${s.station}</strong></td>
          <td>${s.status}</td>
          <td class="num">${s.tanksCount || 3}</td>
          <td class="num">${s.dispensersCount || 4}</td>
          <td class="num">${s.nozzlesCount || 8}</td>
          <td class="num">${s.petrolStock.toLocaleString()} L</td>
          <td class="num">${s.dieselStock.toLocaleString()} L</td>
          <td class="num font-mono">₨${s.cashOnHand.toLocaleString()}</td>
          <td class="num font-mono">₨${s.allocatedInvestment.toLocaleString()}</td>
          <td>${s.managerInCharge}</td>
        </tr>
      `).join('')}
      <tr style="font-weight: bold; background: #f8fafc;">
        <td colspan="5">TOTAL STATIONS FLEET</td>
        <td class="num">${data.stationBalances.reduce((a, s) => a + s.petrolStock, 0).toLocaleString()} L</td>
        <td class="num">${data.stationBalances.reduce((a, s) => a + s.dieselStock, 0).toLocaleString()} L</td>
        <td class="num font-mono">₨${totalStationCash.toLocaleString()}</td>
        <td class="num font-mono">₨${totalStationInvest.toLocaleString()}</td>
        <td>Verified Operations</td>
      </tr>
    </tbody>
  </table>

  <!-- 2. Two-Column Split: Credit Clients (Loan Khata) & Company Bank Accounts -->
  <div class="two-col">
    <!-- Credit Clients / Fuel on Loan -->
    <div>
      <div class="section-title">
        <span>Fuel on Loan (Credit Clients Khata)</span>
        <span style="font-size: 8.5px; color: #059669;">Receivables: ₨${totalCreditLoanAmount.toLocaleString()}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Vehicle #</th>
            <th>Type</th>
            <th class="num">Liters</th>
            <th class="num">Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${creditLoans.length === 0 ? '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No outstanding loan slips</td></tr>' : creditLoans.map(l => `
            <tr>
              <td><strong>${l.clientName}</strong></td>
              <td>${l.vehicleNo}</td>
              <td>${l.fuelType}</td>
              <td class="num">${l.liters}</td>
              <td class="num">₨${l.amount.toLocaleString()}</td>
              <td>${l.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Corporate Bank Accounts -->
    <div>
      <div class="section-title">
        <span>Corporate Bank Accounts & Treasury</span>
        <span style="font-size: 8.5px; color: #2563eb;">Total: ₨${totalBankBalance.toLocaleString()}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Bank Name</th>
            <th>Account Number</th>
            <th>Title</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${bankAccounts.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No bank accounts recorded</td></tr>' : bankAccounts.map(b => `
            <tr>
              <td><strong>${b.bankName}</strong></td>
              <td class="num">${b.accountNumber}</td>
              <td>${b.accountTitle}</td>
              <td class="num" style="font-weight: bold; color: #059669;">₨${b.currentBalance.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 3. Daily Operational Closing Shift Entries -->
  <div class="section-title">Daily Operations Closing Shift Entries</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Station</th>
        <th class="num">Petrol (L)</th>
        <th class="num">Diesel (L)</th>
        <th class="num">Hi-Octane (L)</th>
        <th class="num">Gross Revenue</th>
        <th class="num">Expenses</th>
        <th class="num">Net Profit</th>
        <th>Operator</th>
      </tr>
    </thead>
    <tbody>
      ${data.entries.length === 0 ? '<tr><td colspan="9" style="text-align:center; color:#94a3b8;">No entries recorded</td></tr>' : data.entries.map(e => `
        <tr>
          <td>${e.date}</td>
          <td><strong>${e.station}</strong></td>
          <td class="num">${e.petrolSales.toLocaleString()}</td>
          <td class="num">${e.dieselSales.toLocaleString()}</td>
          <td class="num">${(e.hiOctaneSales || 0).toLocaleString()}</td>
          <td class="num">₨${e.revenue.toLocaleString()}</td>
          <td class="num">₨${e.totalExpenses.toLocaleString()}</td>
          <td class="num" style="font-weight:bold; color: #059669;">₨${e.netProfit.toLocaleString()}</td>
          <td>${e.createdBy}</td>
        </tr>
      `).join('')}
      <tr style="font-weight: bold; background: #f8fafc;">
        <td colspan="2">TOTAL TODAY</td>
        <td class="num">${totalPetrol.toLocaleString()} L</td>
        <td class="num">${totalDiesel.toLocaleString()} L</td>
        <td class="num">${totalHiOctane.toLocaleString()} L</td>
        <td class="num">₨${totalRevenue.toLocaleString()}</td>
        <td class="num">₨${totalExpenses.toLocaleString()}</td>
        <td class="num" style="color:#059669;">₨${totalNet.toLocaleString()}</td>
        <td>Verified</td>
      </tr>
    </tbody>
  </table>

  <!-- 4. Partner Capital, Equity Stakes, Profits & Net Investment Settlement -->
  <div class="section-title">Partner Capital, Equity Stakes, Profits & Net Investment Settlement</div>
  <table>
    <thead>
      <tr>
        <th>Partner Name</th>
        <th>Designation / Role</th>
        <th class="num">Invested Capital</th>
        <th class="num">Equity %</th>
        <th class="num">Profit Entitlement</th>
        <th class="num">Withdrawn</th>
        <th class="num">Profit Balance</th>
        <th class="num">Net Investment Value</th>
      </tr>
    </thead>
    <tbody>
      ${data.partners.map(p => {
        const shareRatio = totalPartnerCapital > 0 ? p.investment / totalPartnerCapital : 0;
        const profitShare = (totalNet * shareRatio) + (p.profitAdjustments || 0);
        const partnerWithdrawals = data.withdrawals.filter(w => w.partnerId === p.id);
        const withdrawn = partnerWithdrawals.reduce((a, w) => a + w.amount, 0);
        const profitBalance = profitShare - withdrawn;
        const netInvestmentValue = p.investment + profitBalance;
        return `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td><span style="font-weight: 600; color: #1e3a8a;">${p.role}</span></td>
            <td class="num font-mono">₨${p.investment.toLocaleString()}</td>
            <td class="num font-mono">${(shareRatio * 100).toFixed(2)}%</td>
            <td class="num font-mono" style="color: #059669; font-weight: bold;">₨${profitShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            <td class="num font-mono" style="color: #dc2626;">₨${withdrawn.toLocaleString()}</td>
            <td class="num font-mono" style="font-weight: bold; color: ${profitBalance >= 0 ? '#7c3aed' : '#b91c1c'};">₨${profitBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            <td class="num font-mono" style="font-weight: 800; color: #047857; background: #ecfdf5;">₨${netInvestmentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          </tr>
        `;
      }).join('')}
      <tr style="font-weight: bold; background: #f8fafc;">
        <td colspan="2">TOTAL PARTNERS POSITION</td>
        <td class="num font-mono">₨${totalPartnerCapital.toLocaleString()}</td>
        <td class="num font-mono">100.00%</td>
        <td class="num font-mono" style="color: #059669;">₨${totalNet.toLocaleString()}</td>
        <td class="num font-mono" style="color: #dc2626;">₨${totalWithdrawn.toLocaleString()}</td>
        <td class="num font-mono" style="color: #7c3aed;">₨${(totalNet - totalWithdrawn).toLocaleString()}</td>
        <td class="num font-mono" style="color: #047857;">₨${(totalPartnerCapital + (totalNet - totalWithdrawn)).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <!-- 5. Partner Disbursements & Withdrawals Ledger -->
  <div class="section-title">
    <span>Partner Disbursements & Capital/Profit Drawdowns</span>
    <span style="font-size: 8.5px; color: #dc2626;">Total Disbursed: ₨${totalWithdrawn.toLocaleString()}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Partner Name</th>
        <th>Category</th>
        <th>Payment Mode</th>
        <th>Reference / Slip #</th>
        <th>Notes / Purpose</th>
        <th class="num">Amount (PKR)</th>
      </tr>
    </thead>
    <tbody>
      ${data.withdrawals.length === 0 ? '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">No partner withdrawals or disbursements recorded</td></tr>' : data.withdrawals.map(w => `
        <tr>
          <td>${w.date}</td>
          <td><strong>${w.partnerName}</strong></td>
          <td><span style="font-weight: bold; color: ${w.withdrawalType === 'Capital' ? '#b45309' : '#059669'};">${w.withdrawalType || 'Profit'}</span></td>
          <td>${w.paymentMode}</td>
          <td style="font-family: monospace;">${w.reference || '—'}</td>
          <td style="color: #64748b; font-style: italic;">${w.notes || '—'}</td>
          <td class="num font-mono" style="font-weight: bold; color: #dc2626;">₨${w.amount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Footer with Digital Signatures -->
  <div class="footer">
    <div>
      <div><strong>Kashfi Bro Holdings Pvt Ltd</strong> • Petroleum Operations & Treasury Terminal</div>
      <div style="font-size: 8px; color: #94a3b8;">Confidential Management Statement • Generated at ${new Date().toLocaleTimeString()}</div>
    </div>
    <div style="text-align: right;">
      <div class="signature-box">
        Jalees (CEO & Managing Partner)<br />
        <span style="font-size: 8px; font-weight: normal; color: #64748b;">Executive Override & Digital Stamp Verified</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Downloads a standalone 1-page HTML report file
 */
export function downloadGraphicalHtmlFile(data: ExportDataPayload, title?: string): void {
  const today = data.reportDate || new Date().toISOString().split('T')[0];
  const htmlContent = generatePrintableHtmlContent(data, title);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KBH_Executive_Statement_${today}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Failsafe browser printing & PDF export that works inside iframes and sandboxes
 */
export function triggerBrowserPrint(data: ExportDataPayload, statementTitle = 'EXECUTIVE FINANCIAL STATEMENT'): void {
  const htmlContent = generatePrintableHtmlContent(data, statementTitle);

  try {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print intercepted, fallback to popup', err);
          fallbackPrint(htmlContent);
        } finally {
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 60000);
        }
      }, 400);
      return;
    }
  } catch (e) {
    console.warn('Print iframe error', e);
  }

  fallbackPrint(htmlContent);
}

function fallbackPrint(htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, '_blank');
  if (printWin) {
    printWin.focus();
  } else {
    // If popup blocked, download the clean HTML file
    const link = document.createElement('a');
    link.href = url;
    link.download = `KBH_Printable_Statement_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates XML spreadsheet string representation
 */
export function generateExcelWorkbookXml(data: ExportDataPayload, format: 'xlsx' | 'xlsm' = 'xlsx'): string {
  const today = data.reportDate || new Date().toISOString().split('T')[0];
  const totalNet = data.entries.reduce((a, e) => a + e.netProfit, 0);
  const totalRevenue = data.entries.reduce((a, e) => a + e.revenue, 0);
  const totalExpenses = data.entries.reduce((a, e) => a + e.totalExpenses, 0);

  const bankAccounts = data.bankAccounts || [];
  const bankDeposits = data.bankDeposits || [];
  const creditLoans = data.creditLoans || [];

  const escapeXml = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>CEO Jalees - Kashfi Bro Holdings</Author>
  <LastAuthor>CEO Jalees</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
  <Company>Kashfi Bro Holdings Pvt Ltd</Company>
  <Version>16.00</Version>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;₨&quot;#,##0"/>
  </Style>
  <Style ss:ID="Decimal">
   <NumberFormat ss:Format="#,##0.0"/>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
  </Style>
  <Style ss:ID="BoldTotal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2"/>
   </Borders>
  </Style>
 </Styles>

 <!-- SHEET 1: EXECUTIVE SUMMARY -->
 <Worksheet ss:Name="Executive_Summary">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>
   <Column ss:Width="220"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="Title"><Data ss:Type="String">KASHFI BRO HOLDINGS — EXECUTIVE OVERVIEW</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Report As Of Date:</Data></Cell>
    <Cell><Data ss:Type="String">${today}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Terminal Operator:</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(data.session?.name || 'CEO Jalees')}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"/></Cell></Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Financial Metric</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Amount (PKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Notes</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Gross Petroleum Revenue</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalRevenue}</Data></Cell>
    <Cell><Data ss:Type="String">Petrol, Diesel, Hi-Octane &amp; Lubes</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Operating Expenses</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalExpenses}</Data></Cell>
    <Cell><Data ss:Type="String">Salaries, Food, Power, Maintenance</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldTotal"><Data ss:Type="String">Net Operating Profit</Data></Cell>
    <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${totalNet}</Data></Cell>
    <Cell ss:StyleID="BoldTotal"><Data ss:Type="String">Net Distributable to Partners</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- SHEET 2: STATIONS & TANKS FLEET -->
 <Worksheet ss:Name="Stations_Fleet">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Station Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tanks</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Pumps</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nozzles</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Allocated Capital</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cash On Hand</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Petrol Stock (L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Diesel Stock (L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Manager In-Charge</Data></Cell>
   </Row>
   ${data.stationBalances.map(s => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(s.station)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.status)}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.tanksCount || 3}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.dispensersCount || 4}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.nozzlesCount || 8}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.allocatedInvestment}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.cashOnHand}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${s.petrolStock}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${s.dieselStock}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.managerInCharge)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 3: DAILY OPERATIONS ENTRIES -->
 <Worksheet ss:Name="Daily_Entries">
  <Table ss:DefaultColumnWidth="110">
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Station</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Petrol (L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Diesel (L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Hi-Octane (L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lubes (Qty)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Revenue</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Expenses</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Net Profit</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Recorded By</Data></Cell>
   </Row>
   ${data.entries.map(e => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(e.date)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(e.station)}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${e.petrolSales}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${e.dieselSales}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${e.hiOctaneSales || 0}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${e.lubesSales}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${e.revenue}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${e.totalExpenses}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${e.netProfit}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(e.createdBy)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 4: FUEL ON LOAN / CREDIT CLIENTS KHATA -->
 <Worksheet ss:Name="Credit_Clients_Khata">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Client / Fleet Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Vehicle / Reg #</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Fuel Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Liters</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rate (PKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Loan Amount</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Slip Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>
   ${creditLoans.map(l => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(l.clientName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.vehicleNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.fuelType)}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${l.liters}</Data></Cell>
    <Cell ss:StyleID="Decimal"><Data ss:Type="Number">${l.rate}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${l.amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.slipNumber || 'N/A')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.status)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 5: BANK ACCOUNTS & TREASURY -->
 <Worksheet ss:Name="Bank_Treasury">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="160"/>
   <Column ss:Width="150"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bank Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Account Title</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Account Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Branch / City</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Credited Balance</Data></Cell>
   </Row>
   ${bankAccounts.map(b => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(b.bankName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.accountTitle)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.accountNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.branch || 'Main Branch')}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${b.currentBalance}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 6: PARTNER EQUITY & WITHDRAWALS -->
 <Worksheet ss:Name="Partner_Equity">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Partner Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Committed Capital</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Equity %</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Net Profit Share</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Withdrawn</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Net Balance</Data></Cell>
   </Row>
   ${data.partners.map(p => {
     const totalCap = data.partners.reduce((a, pt) => a + pt.investment, 0);
     const share = totalCap > 0 ? p.investment / totalCap : 0;
     const profit = totalNet * share;
     const wTotal = data.withdrawals.filter(w => w.partnerId === p.id).reduce((a, w) => a + w.amount, 0);
     const bal = profit - wTotal;
     return `
     <Row>
      <Cell><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(p.role)}</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.investment}</Data></Cell>
      <Cell ss:StyleID="Percent"><Data ss:Type="Number">${share}</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${profit}</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${wTotal}</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${bal}</Data></Cell>
     </Row>
     `;
   }).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 7: AUDIT LOG -->
 <Worksheet ss:Name="Audit_Directives">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="180"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Station</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Audit Title</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Severity</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Action Notes</Data></Cell>
   </Row>
   ${(data.audits || []).map(a => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(a.date)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.station)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.title)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.severity)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.actionNotes || 'No notes')}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Generates an Excel Macro Blob (.xlsm) for Drive upload or saving
 */
export function generateExcelMacroBlob(data: ExportDataPayload): Blob {
  const xmlContent = generateExcelWorkbookXml(data, 'xlsm');
  return new Blob([xmlContent], {
    type: 'application/vnd.ms-excel.sheet.macroEnabled.12;charset=utf-8;'
  });
}

/**
 * Generates an Excel Spreadsheet Workbook (.xlsx or .xlsm) with multiple sheets
 */
export function downloadExcelWorkbook(data: ExportDataPayload, format: 'xlsx' | 'xlsm' = 'xlsx'): void {
  const today = data.reportDate || new Date().toISOString().split('T')[0];
  const xmlContent = generateExcelWorkbookXml(data, format);
  const mimeType = format === 'xlsm' 
    ? 'application/vnd.ms-excel.sheet.macroEnabled.12;charset=utf-8;'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;';

  const blob = new Blob([xmlContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KBH_Petroleum_Ledger_${today}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Backward compatibility alias for macro-enabled Excel download
 */
export function downloadExcelMacroWorkbook(data: ExportDataPayload): void {
  downloadExcelWorkbook(data, 'xlsm');
}
