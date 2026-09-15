/**
 * SmartBiz Pocket - Standard Document PDF & Print Engine
 * Generates official, standard A4/Letter size business performance reports
 * completely independent of mobile/phone layout frames.
 */
import { SmartBizState } from '../types';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface StandardReportOptions {
  state: SmartBizState;
  period: ReportPeriod;
  paperSize?: 'a4' | 'letter';
  customNotes?: string;
  reportFocus?: 'all' | 'financial' | 'inventory' | 'debtors';
}

export interface ReportCalculations {
  periodLabel: string;
  periodDateRange: string;
  filteredSales: SmartBizState['sales'];
  filteredExpenses: SmartBizState['expenses'];
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalUnitsSold: number;
  averageTicketValue: number;
  totalStockRetailValue: number;
  totalStockCostValue: number;
  totalDebtorValue: number;
  activeDebtorsCount: number;
  paymentMethodsBreakdown: { method: string; count: number; total: number; percentage: number }[];
  expenseCategoriesBreakdown: { category: string; count: number; total: number; percentage: number }[];
  topProducts: { name: string; category: string; qty: number; rev: number; unitPrice: number }[];
  slowProducts: { name: string; category: string; quantity: number; sellingPrice: number }[];
  lowStockItems: SmartBizState['products'];
}

/**
 * Calculates standard performance metrics for any specified period
 */
export function calculateReportData(
  state: SmartBizState,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
): ReportCalculations {
  const sales = state.sales || [];
  const expenses = state.expenses || [];
  const products = state.products || [];
  const debtors = state.debtors || [];

  const now = new Date();
  let filterDate: Date | null = new Date();
  let periodLabel = 'This Week';

  if (period === 'daily') {
    filterDate.setHours(0, 0, 0, 0);
    periodLabel = 'Today';
  } else if (period === 'weekly') {
    filterDate.setDate(filterDate.getDate() - 7);
    periodLabel = 'Last 7 Days (Weekly)';
  } else if (period === 'monthly') {
    filterDate.setMonth(filterDate.getMonth() - 1);
    periodLabel = 'Last 30 Days (Monthly)';
  } else if (period === 'yearly') {
    filterDate.setFullYear(filterDate.getFullYear() - 1);
    periodLabel = 'Last 365 Days (Annual)';
  } else {
    filterDate = null;
    periodLabel = 'All-Time Record';
  }

  const periodDateRange = filterDate
    ? `${filterDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `All historical entries up to ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const filteredSales = filterDate
    ? sales.filter(s => s && s.date && new Date(s.date) >= filterDate)
    : [...sales];

  const filteredExpenses = filterDate
    ? expenses.filter(e => e && e.date && new Date(e.date) >= filterDate)
    : [...expenses];

  // Financial calculations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalSale || 0), 0);
  const totalCostOfGoods = filteredSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Units sold & average ticket
  let totalUnitsSold = 0;
  filteredSales.forEach(s => {
    (s.items || []).forEach(item => {
      totalUnitsSold += item.quantity || 1;
    });
  });
  const averageTicketValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Payment methods breakdown
  const paymentMap = new Map<string, { count: number; total: number }>();
  filteredSales.forEach(s => {
    const method = s.paymentMethod || 'Cash USD';
    const current = paymentMap.get(method) || { count: 0, total: 0 };
    current.count += 1;
    current.total += s.totalSale || 0;
    paymentMap.set(method, current);
  });

  const paymentMethodsBreakdown = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Expense categories breakdown
  const expenseMap = new Map<string, { count: number; total: number }>();
  filteredExpenses.forEach(e => {
    const cat = e.category || 'General';
    const current = expenseMap.get(cat) || { count: 0, total: 0 };
    current.count += 1;
    current.total += e.amount || 0;
    expenseMap.set(cat, current);
  });

  const expenseCategoriesBreakdown = Array.from(expenseMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Product sales performance
  const productSalesMap = new Map<string, { name: string; category: string; qty: number; rev: number; unitPrice: number }>();
  products.forEach(p => {
    productSalesMap.set(p.id, {
      name: p.name,
      category: p.category || 'General',
      qty: 0,
      rev: 0,
      unitPrice: p.sellingPrice || 0,
    });
  });

  filteredSales.forEach(s => {
    (s.items || []).forEach(item => {
      const existing = productSalesMap.get(item.productId);
      if (existing) {
        existing.qty += item.quantity || 1;
        existing.rev += item.totalSale || 0;
      } else {
        productSalesMap.set(item.productId, {
          name: item.productName || 'Product',
          category: 'General',
          qty: item.quantity || 1,
          rev: item.totalSale || 0,
          unitPrice: item.unitSellingPrice || 0,
        });
      }
    });
  });

  const sortedAllProducts = Array.from(productSalesMap.values()).sort((a, b) => b.qty - a.qty);
  const topProducts = sortedAllProducts.filter(p => p.qty > 0).slice(0, 10);

  // Slow moving stock (items with 0 sales in period but currently in stock)
  const slowProducts = products
    .filter(p => p.itemType !== 'service' && p.quantity > 0)
    .filter(p => {
      const sold = productSalesMap.get(p.id);
      return !sold || sold.qty === 0;
    })
    .map(p => ({
      name: p.name,
      category: p.category || 'General',
      quantity: p.quantity,
      sellingPrice: p.sellingPrice,
    }))
    .slice(0, 5);

  // Inventory & Asset Valuations
  const totalStockRetailValue = products.reduce((sum, p) => sum + (p.sellingPrice || 0) * (p.quantity || 0), 0);
  const totalStockCostValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.quantity || 0), 0);
  const totalDebtorValue = debtors.filter(d => d && (d.balanceOwed || 0) > 0).reduce((sum, d) => sum + (d.balanceOwed || 0), 0);
  const activeDebtorsCount = debtors.filter(d => d && (d.balanceOwed || 0) > 0).length;

  const lowStockItems = products.filter(p => p.itemType !== 'service' && p.quantity <= p.minStock);

  return {
    periodLabel,
    periodDateRange,
    filteredSales,
    filteredExpenses,
    totalRevenue,
    totalCostOfGoods,
    grossProfit,
    totalExpenses,
    netProfit,
    profitMargin,
    totalUnitsSold,
    averageTicketValue,
    totalStockRetailValue,
    totalStockCostValue,
    totalDebtorValue,
    activeDebtorsCount,
    paymentMethodsBreakdown,
    expenseCategoriesBreakdown,
    topProducts,
    slowProducts,
    lowStockItems,
  };
}

/**
 * Generates clean, standard A4/Letter print HTML document with zero phone frame styling
 */
export function generateStandardReportHtml(options: StandardReportOptions): string {
  const { state, period, paperSize = 'a4', customNotes } = options;
  const currency = state.settings?.currencySymbol || '$';
  const business = state.business || {
    name: 'SmartBiz Merchant',
    phone: '',
    location: '',
    ownerName: '',
  };

  const calc = calculateReportData(state, period);
  const generatedDate = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const reportRef = `SBM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const pageMargin = paperSize === 'a4' ? '15mm' : '0.5in';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${business.name} - Performance Report (${calc.periodLabel})</title>
  <style>
    @page {
      size: ${paperSize} portrait;
      margin: ${pageMargin};
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 9.5pt;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .report-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Header Section */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .business-title {
      font-size: 18pt;
      font-weight: 800;
      color: #047857;
      margin: 0 0 3px 0;
      letter-spacing: -0.5px;
    }
    .business-subtitle {
      font-size: 8.5pt;
      color: #475569;
      margin: 0;
    }
    .report-title-badge {
      text-align: right;
    }
    .report-badge {
      display: inline-block;
      background: #047857;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta {
      font-size: 8pt;
      color: #64748b;
      margin-top: 4px;
    }

    /* KPI Summary Row */
    .kpi-grid {
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-bottom: 16px;
      border-spacing: 6px 0;
    }
    .kpi-cell {
      display: table-cell;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      vertical-align: top;
    }
    .kpi-cell.highlight {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .kpi-cell.negative {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .kpi-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .kpi-cell.highlight .kpi-value {
      color: #047857;
    }
    .kpi-cell.negative .kpi-value {
      color: #e11d48;
    }
    .kpi-subtext {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 2px;
    }

    /* Section Headings */
    .section-heading {
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table.data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    table.data-table tr:nth-child(even) td {
      background: #fbfcfe;
    }
    .text-right {
      text-align: right !important;
    }
    .text-center {
      text-align: center !important;
    }
    .font-bold {
      font-weight: 700;
    }
    .text-emerald {
      color: #047857;
    }
    .text-rose {
      color: #e11d48;
    }
    .text-muted {
      color: #64748b;
    }

    /* Two-Column Layout for Tables */
    .columns-row {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-spacing: 12px 0;
      margin-bottom: 12px;
    }
    .column-cell {
      display: table-cell;
      vertical-align: top;
      width: 50%;
    }

    /* Sign-off & Audit Box */
    .audit-box {
      margin-top: 18px;
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .signature-row {
      display: table;
      width: 100%;
      margin-top: 16px;
    }
    .signature-col {
      display: table-cell;
      width: 50%;
      vertical-align: bottom;
    }
    .signature-line {
      border-bottom: 1px solid #0f172a;
      width: 75%;
      margin-top: 24px;
      margin-bottom: 4px;
    }
    .signature-title {
      font-size: 7.5pt;
      color: #64748b;
      text-transform: uppercase;
    }
    .footer-stamp {
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 12px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }

    @media print {
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <table class="header-table" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align: middle;">
          <h1 class="business-title">${business.name}</h1>
          <p class="business-subtitle">
            ${business.ownerName ? 'Proprietor: ' + business.ownerName + ' • ' : ''}
            ${business.phone ? 'Tel: ' + business.phone + ' • ' : ''}
            ${business.location ? 'Location: ' + business.location : 'Informal Merchant'}
          </p>
        </td>
        <td class="report-title-badge" style="vertical-align: middle;">
          <span class="report-badge">Official Financial Statement</span>
          <div class="report-meta">
            <strong>Period:</strong> ${calc.periodLabel}<br>
            <strong>Date Range:</strong> ${calc.periodDateRange}<br>
            <strong>Generated:</strong> ${generatedDate}<br>
            <strong>Ref:</strong> ${reportRef}
          </div>
        </td>
      </tr>
    </table>

    <!-- Executive Financial KPIs -->
    <div class="kpi-grid">
      <div class="kpi-cell">
        <div class="kpi-label">Gross Sales (Money In)</div>
        <div class="kpi-value text-emerald">${currency}${calc.totalRevenue.toFixed(2)}</div>
        <div class="kpi-subtext">${calc.filteredSales.length} transactions (${calc.totalUnitsSold} units)</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Cost of Goods (COGS)</div>
        <div class="kpi-value">${currency}${calc.totalCostOfGoods.toFixed(2)}</div>
        <div class="kpi-subtext">Direct wholesale stock cost</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">Expenses (Money Out)</div>
        <div class="kpi-value text-rose">${currency}${calc.totalExpenses.toFixed(2)}</div>
        <div class="kpi-subtext">${calc.filteredExpenses.length} operational records</div>
      </div>
      <div class="kpi-cell ${calc.netProfit >= 0 ? 'highlight' : 'negative'}">
        <div class="kpi-label">Net Profit (Pocket)</div>
        <div class="kpi-value">${currency}${calc.netProfit.toFixed(2)}</div>
        <div class="kpi-subtext"><strong>${calc.profitMargin}%</strong> Net Margin</div>
      </div>
    </div>

    <!-- Balance & Working Capital Snapshot -->
    <div class="section-heading">
      <span>1. Working Capital & Balance Snapshot</span>
      <span style="font-size: 8pt; font-weight: normal; color: #64748b;">Current Active Ledger</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Asset / Liability Item</th>
          <th>Description & Coverage</th>
          <th class="text-right">Valuation (${currency})</th>
          <th class="text-right">Financial Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="font-bold">Inventory Valuation (Retail Selling Value)</td>
          <td>Available stock on shelves across ${state.products?.length || 0} product types</td>
          <td class="text-right font-bold text-emerald">${currency}${calc.totalStockRetailValue.toFixed(2)}</td>
          <td class="text-right text-muted">Ready for Sale</td>
        </tr>
        <tr>
          <td class="font-bold">Inventory Valuation (Cost Value)</td>
          <td>Direct wholesale replacement value of warehouse/shelf inventory</td>
          <td class="text-right font-bold">${currency}${calc.totalStockCostValue.toFixed(2)}</td>
          <td class="text-right text-muted">Capital Invested</td>
        </tr>
        <tr>
          <td class="font-bold">Outstanding Customer Credit (Debtors)</td>
          <td>Uncollected book credit owed by ${calc.activeDebtorsCount} customer(s)</td>
          <td class="text-right font-bold ${calc.totalDebtorValue > 0 ? 'text-rose' : 'text-muted'}">${currency}${calc.totalDebtorValue.toFixed(2)}</td>
          <td class="text-right ${calc.totalDebtorValue > 0 ? 'text-rose font-bold' : 'text-muted'}">
            ${calc.totalDebtorValue > 0 ? 'Pending Collection' : 'Fully Settled'}
          </td>
        </tr>
        <tr>
          <td class="font-bold">Average Transaction Value (Ticket Size)</td>
          <td>Average money collected per customer checkout during this period</td>
          <td class="text-right font-bold">${currency}${calc.averageTicketValue.toFixed(2)}</td>
          <td class="text-right text-muted">Per Customer</td>
        </tr>
      </tbody>
    </table>

    <!-- Two-column tables: Payment Channels & Expense Breakdown -->
    <div class="columns-row">
      <!-- Payment Channels -->
      <div class="column-cell">
        <div class="section-heading">
          <span>2. Payment Methods (Sales)</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th class="text-center">Sales</th>
              <th class="text-right">Amount (${currency})</th>
              <th class="text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            ${
              calc.paymentMethodsBreakdown.length > 0
                ? calc.paymentMethodsBreakdown
                    .map(
                      p => `<tr>
                        <td class="font-bold">${p.method}</td>
                        <td class="text-center">${p.count}</td>
                        <td class="text-right font-bold">${currency}${p.total.toFixed(2)}</td>
                        <td class="text-right text-muted">${p.percentage}%</td>
                      </tr>`
                    )
                    .join('')
                : `<tr><td colspan="4" class="text-center text-muted">No sales recorded in period</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <!-- Expense Categories Breakdown -->
      <div class="column-cell">
        <div class="section-heading">
          <span>3. Operational Expenses</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-center">Count</th>
              <th class="text-right">Amount (${currency})</th>
              <th class="text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            ${
              calc.expenseCategoriesBreakdown.length > 0
                ? calc.expenseCategoriesBreakdown
                    .map(
                      e => `<tr>
                        <td class="font-bold">${e.category}</td>
                        <td class="text-center">${e.count}</td>
                        <td class="text-right font-bold text-rose">${currency}${e.total.toFixed(2)}</td>
                        <td class="text-right text-muted">${e.percentage}%</td>
                      </tr>`
                    )
                    .join('')
                : `<tr><td colspan="4" class="text-center text-muted">No expenses recorded in period</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Products Performance -->
    <div class="section-heading">
      <span>4. Top Performing Products (${calc.periodLabel})</span>
      <span style="font-size: 8pt; font-weight: normal; color: #64748b;">Units Sold & Revenue Contribution</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px;" class="text-center">#</th>
          <th>Product / Item Description</th>
          <th>Category</th>
          <th class="text-center">Units Sold</th>
          <th class="text-right">Unit Price (${currency})</th>
          <th class="text-right">Total Revenue (${currency})</th>
          <th class="text-right">% of Sales</th>
        </tr>
      </thead>
      <tbody>
        ${
          calc.topProducts.length > 0
            ? calc.topProducts
                .map(
                  (p, idx) => `<tr>
                    <td class="text-center text-muted font-bold">${idx + 1}</td>
                    <td class="font-bold">${p.name}</td>
                    <td>${p.category}</td>
                    <td class="text-center font-bold">${p.qty}</td>
                    <td class="text-right">${currency}${p.unitPrice.toFixed(2)}</td>
                    <td class="text-right font-bold text-emerald">${currency}${p.rev.toFixed(2)}</td>
                    <td class="text-right text-muted">${calc.totalRevenue > 0 ? Math.round((p.rev / calc.totalRevenue) * 100) : 0}%</td>
                  </tr>`
                )
                .join('')
            : `<tr><td colspan="7" class="text-center text-muted">No product sales transactions recorded during this period</td></tr>`
        }
      </tbody>
    </table>

    ${
      calc.slowProducts.length > 0
        ? `
      <!-- Slow Moving Products Notice -->
      <div class="section-heading">
        <span>5. Inventory Attention: Slow-Moving Stock</span>
        <span style="font-size: 8pt; font-weight: normal; color: #64748b;">In Stock but 0 Units Sold This Period</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th class="text-center">Current In-Stock Quantity</th>
            <th class="text-right">Selling Price (${currency})</th>
            <th class="text-right">Tied-Up Capital Value</th>
          </tr>
        </thead>
        <tbody>
          ${calc.slowProducts
            .map(
              p => `<tr>
                <td class="font-bold">${p.name}</td>
                <td>${p.category}</td>
                <td class="text-center font-bold text-rose">${p.quantity}</td>
                <td class="text-right">${currency}${p.sellingPrice.toFixed(2)}</td>
                <td class="text-right font-bold">${currency}${(p.quantity * p.sellingPrice).toFixed(2)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `
        : ''
    }

    ${
      customNotes
        ? `
      <div style="margin-top: 10px; padding: 8px 12px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 8pt;">
        <strong>Proprietor Notes:</strong> ${customNotes}
      </div>
    `
        : ''
    }

    <!-- Official Certification & Audit Box -->
    <div class="audit-box">
      <div style="font-size: 8pt; color: #334155; line-height: 1.4;">
        <strong>Merchant Certification:</strong> This document represents a standard business record compiled from the verified offline ledger of <strong>${business.name}</strong>. Generated in compliance with standard reporting dimensions (Standard A4 / Letter format).
      </div>
      <div class="signature-row">
        <div class="signature-col">
          <div class="signature-line"></div>
          <div class="signature-title">Prepared By: ${business.ownerName || 'Business Owner / Manager'}</div>
        </div>
        <div class="signature-col" style="text-align: right;">
          <div class="signature-line" style="margin-left: auto;"></div>
          <div class="signature-title">Date & Official Store Stamp</div>
        </div>
      </div>
      <div class="footer-stamp">
        SmartBiz Pocket • Standard A4 Business Performance & Financial Report • Reference: ${reportRef} • Page 1 of 1
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers standard full-page A4/Letter print using an isolated iframe
 * completely bypassing the phone frame and container widths.
 */
export function printStandardReport(options: StandardReportOptions): void {
  const html = generateStandardReportHtml(options);

  // Create an invisible iframe dedicated to the standard print job
  const existingIframe = document.getElementById('smartbiz-standard-print-frame');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'smartbiz-standard-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open in new window if iframe document is unavailable
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 250);
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.open', err);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 250);
      }
    }
  }, 350);
}

/**
 * Opens standard document report in a clean standalone window
 */
export function openStandardReportTab(options: StandardReportOptions): void {
  const html = generateStandardReportHtml(options);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
  }
}
