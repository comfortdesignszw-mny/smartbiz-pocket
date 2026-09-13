import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { SmartBizState } from '../../types';

interface ReportsModuleProps {
  state: SmartBizState;
  onNavigate?: (tab: any) => void;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ReportsModule: React.FC<ReportsModuleProps> = ({ state, onNavigate }) => {
  const { sales, expenses, products, debtors, settings, business } = state;
  const currency = settings.currencySymbol;

  const [period, setPeriod] = useState<PeriodType>('weekly');

  // Time filter calculations
  const now = new Date();
  const getPeriodFilterDate = () => {
    const d = new Date();
    if (period === 'daily') {
      d.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      d.setDate(d.getDate() - 7);
    } else if (period === 'monthly') {
      d.setMonth(d.getMonth() - 1);
    } else if (period === 'yearly') {
      d.setFullYear(d.getFullYear() - 1);
    }
    return d;
  };

  const filterDate = getPeriodFilterDate();

  const filteredSales = sales.filter(s => new Date(s.date) >= filterDate);
  const filteredExpenses = expenses.filter(e => new Date(e.date) >= filterDate);

  // Financial calculations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalSale, 0);
  const totalCostOfGoods = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Best & worst selling products
  const productPerformance = new Map<string, { name: string; qty: number; rev: number }>();
  products.forEach(p => {
    productPerformance.set(p.id, { name: p.name, qty: 0, rev: 0 });
  });

  filteredSales.forEach(s => {
    s.items.forEach(item => {
      const existing = productPerformance.get(item.productId);
      if (existing) {
        existing.qty += item.quantity;
        existing.rev += item.totalSale;
      }
    });
  });

  const sortedProducts = Array.from(productPerformance.values()).sort((a, b) => b.qty - a.qty);
  const bestProduct = sortedProducts[0]?.qty > 0 ? sortedProducts[0] : null;
  const worstProduct = sortedProducts[sortedProducts.length - 1];

  // Asset values
  const totalStockRetailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalDebtorValue = debtors.filter(d => d.balanceOwed > 0).reduce((sum, d) => sum + d.balanceOwed, 0);

  // CSV Export
  const handleExportCSV = () => {
    const lines = [
      `"SmartBiz Pocket - Business Performance Report"`,
      `"Business Name","${business.name}"`,
      `"Period","${period.toUpperCase()}"`,
      `"Generated At","${new Date().toLocaleString()}"`,
      '',
      `"METRIC","VALUE (${currency})"`,
      `"Total Sales (Money In)","${totalRevenue.toFixed(2)}"`,
      `"Total Expenses (Money Out)","${totalExpenses.toFixed(2)}"`,
      `"Net Profit","${netProfit.toFixed(2)}"`,
      `"Profit Margin","${profitMargin}%"`,
      `"Stock Retail Valuation","${totalStockRetailValue.toFixed(2)}"`,
      `"Money Owed by Customers","${totalDebtorValue.toFixed(2)}"`,
      '',
      `"TOP SELLING PRODUCTS"`,
      `"Product","Units Sold","Revenue (${currency})"`,
      ...sortedProducts.slice(0, 5).map(p => `"${p.name}","${p.qty}","${p.rev.toFixed(2)}"`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartbiz_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Business Performance</h2>
          <p className="text-xs text-slate-500">Zero accounting jargon • Instant clarity on profits</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            title="Download CSV"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            title="Print Statement"
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Empty State Callout when no transactions exist */}
      {sales.length === 0 && expenses.length === 0 && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl text-center space-y-2 shadow-xs">
          <BarChart3 className="w-8 h-8 text-emerald-700 mx-auto" />
          <h3 className="text-xs font-bold text-slate-800">No trading activity recorded yet</h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Your real-time net profit margins, top sellers, and financial statements will automatically calculate here once you record sales and expenses.
          </p>
          {onNavigate && (
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => onNavigate('sales')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Record First Sale
              </button>
              <button
                type="button"
                onClick={() => onNavigate('stock')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Record Expense
              </button>
            </div>
          )}
        </div>
      )}

      {/* Period Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center justify-between gap-1 text-xs">
        {(['daily', 'weekly', 'monthly', 'yearly'] as PeriodType[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-all ${
              period === p
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'This Year'}
          </button>
        ))}
      </div>

      {/* Main Financial KPI Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase">Net Earnings (Profit)</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-extrabold ${
              netProfit >= 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {profitMargin}% Profit Margin
          </span>
        </div>

        <div className="text-center py-2">
          <span className="text-xs text-slate-500 font-medium">What You Keep In Your Pocket</span>
          <div
            className={`text-3xl font-black tracking-tight mt-0.5 ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {currency}{netProfit.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Total In (Sales)
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {currency}{totalRevenue.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500">{filteredSales.length} transactions</p>
          </div>

          <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-800 font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Total Out (Expenses)
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {currency}{totalExpenses.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500">{filteredExpenses.length} records</p>
          </div>
        </div>
      </div>

      {/* Asset Snapshot Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Stock Value on Shelves</span>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            {currency}{totalStockRetailValue.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Across {products.length} products</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Money Owed to You</span>
          <div className="text-base font-extrabold text-rose-600 mt-0.5">
            {currency}{totalDebtorValue.toFixed(2)}
          </div>
          <span className="text-[10px] text-rose-700 font-medium">In uncollected credit</span>
        </div>
      </div>

      {/* Best vs Slowest Product */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800">Product Performance Highlights</h4>

        {bestProduct ? (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase">#1 Best Seller</span>
              <p className="text-xs font-bold text-slate-900">{bestProduct.name}</p>
              <p className="text-[11px] text-slate-600">
                {bestProduct.qty} units sold • {currency}{bestProduct.rev.toFixed(2)} revenue
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No product sales in this timeframe.</p>
        )}

        {worstProduct && worstProduct.qty === 0 && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Slow Moving Stock</span>
              <p className="text-xs font-bold text-slate-900">{worstProduct.name}</p>
              <p className="text-[11px] text-slate-500">0 units sold during this period.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
