import React from 'react';
import { SmartBizState } from '../../types';
import { calculateReportData, StandardReportOptions } from '../../utils/pdfExport';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface StandardReportDocumentProps {
  options: StandardReportOptions;
}

export const StandardReportDocument: React.FC<StandardReportDocumentProps> = ({ options }) => {
  const { state, period, paperSize = 'a4', customNotes } = options;
  const currency = state.settings?.currencySymbol || '$';
  const business = state.business || {
    name: 'SmartBiz Merchant',
    phone: '',
    location: '',
    ownerName: '',
  };

  const calc = calculateReportData(state, period);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="bg-white text-slate-900 mx-auto shadow-lg border border-slate-300 p-8 sm:p-12 w-full max-w-[780px] min-h-[1050px] flex flex-col justify-between font-sans select-text text-left"
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div>
        {/* Official Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                SB
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
                {business.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {business.ownerName ? `Proprietor: ${business.ownerName} • ` : ''}
              {business.phone ? `Tel: ${business.phone} • ` : ''}
              {business.location ? `Location: ${business.location}` : 'Official Merchant Statement'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-emerald-800 text-white text-[11px] font-bold uppercase tracking-wider rounded">
              Standard Financial Report
            </span>
            <div className="text-[11px] text-slate-600 mt-1.5 space-y-0.5">
              <p>
                <strong>Format:</strong> Standard {paperSize.toUpperCase()} Portrait
              </p>
              <p>
                <strong>Period:</strong> {calc.periodLabel}
              </p>
              <p>
                <strong>Date Range:</strong> {calc.periodDateRange}
              </p>
              <p>
                <strong>Generated:</strong> {dateFormatted} {timeFormatted}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary 4-column KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Gross Sales (In)
            </span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">
              {currency}{calc.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">
              {calc.filteredSales.length} orders ({calc.totalUnitsSold} units)
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Cost of Goods (COGS)
            </span>
            <span className="text-lg font-black text-slate-800 block mt-0.5">
              {currency}{calc.totalCostOfGoods.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">Inventory base cost</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Expenses (Out)
            </span>
            <span className="text-lg font-black text-rose-600 block mt-0.5">
              {currency}{calc.totalExpenses.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">
              {calc.filteredExpenses.length} operating records
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              calc.netProfit >= 0
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
              Net Profit (Pocket)
            </span>
            <span
              className={`text-lg font-black block mt-0.5 ${
                calc.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {currency}{calc.netProfit.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold text-emerald-700">
              {calc.profitMargin}% Net Margin
            </span>
          </div>
        </div>

        {/* Section 1: Working Capital & Assets Snapshot */}
        <div className="mb-6">
          <div className="border-b border-slate-200 pb-1 mb-2 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Balance & Working Capital Snapshot
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">Active Position</span>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y border-slate-300 text-[10px] uppercase">
                <th className="py-1.5 px-2 font-bold">Balance Sheet Item</th>
                <th className="py-1.5 px-2 font-bold">Scope & Description</th>
                <th className="py-1.5 px-2 text-right font-bold">Valuation ({currency})</th>
                <th className="py-1.5 px-2 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="py-1.5 px-2 font-semibold text-slate-900">
                  Stock Retail Value (Selling Value)
                </td>
                <td className="py-1.5 px-2 text-slate-600">
                  Goods in stock ready for customers across {state.products?.length || 0} product lines
                </td>
                <td className="py-1.5 px-2 text-right font-black text-emerald-700">
                  {currency}{calc.totalStockRetailValue.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right text-[11px] text-slate-500">Shelf Capital</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold text-slate-900">
                  Stock Replacement Cost (Wholesale)
                </td>
                <td className="py-1.5 px-2 text-slate-600">
                  Cost invested into currently unsold inventory
                </td>
                <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                  {currency}{calc.totalStockCostValue.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right text-[11px] text-slate-500">Asset Cost</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold text-slate-900">
                  Money Owed by Customers (Debtors)
                </td>
                <td className="py-1.5 px-2 text-slate-600">
                  Outstanding credit balance owed by {calc.activeDebtorsCount} debtor(s)
                </td>
                <td
                  className={`py-1.5 px-2 text-right font-black ${
                    calc.totalDebtorValue > 0 ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {currency}{calc.totalDebtorValue.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right text-[11px]">
                  {calc.totalDebtorValue > 0 ? (
                    <span className="text-rose-700 font-semibold">Pending Collection</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Zero Debt Owed</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold text-slate-900">
                  Average Ticket Size (Per Transaction)
                </td>
                <td className="py-1.5 px-2 text-slate-600">
                  Average revenue collected per customer sale during this timeframe
                </td>
                <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                  {currency}{calc.averageTicketValue.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right text-[11px] text-slate-500">Per Basket</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2 & 3: Side-by-Side Payment Channels & Expenses Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Payment Methods */}
          <div>
            <div className="border-b border-slate-200 pb-1 mb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Payment Methods (Sales Inflow)
              </h2>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-y border-slate-300 text-[10px] uppercase">
                  <th className="py-1.5 px-2 font-bold">Method</th>
                  <th className="py-1.5 px-2 text-center font-bold">Sales</th>
                  <th className="py-1.5 px-2 text-right font-bold">Amount ({currency})</th>
                  <th className="py-1.5 px-2 text-right font-bold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {calc.paymentMethodsBreakdown.length > 0 ? (
                  calc.paymentMethodsBreakdown.map(p => (
                    <tr key={p.method}>
                      <td className="py-1 px-2 font-semibold text-slate-900">{p.method}</td>
                      <td className="py-1 px-2 text-center">{p.count}</td>
                      <td className="py-1 px-2 text-right font-bold text-emerald-700">
                        {currency}{p.total.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-500">{p.percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-slate-400 italic">
                      No sales recorded in period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expenses by Category */}
          <div>
            <div className="border-b border-slate-200 pb-1 mb-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Operating Expenses Breakdown
              </h2>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-y border-slate-300 text-[10px] uppercase">
                  <th className="py-1.5 px-2 font-bold">Category</th>
                  <th className="py-1.5 px-2 text-center font-bold">Records</th>
                  <th className="py-1.5 px-2 text-right font-bold">Amount ({currency})</th>
                  <th className="py-1.5 px-2 text-right font-bold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {calc.expenseCategoriesBreakdown.length > 0 ? (
                  calc.expenseCategoriesBreakdown.map(e => (
                    <tr key={e.category}>
                      <td className="py-1 px-2 font-semibold text-slate-900">{e.category}</td>
                      <td className="py-1 px-2 text-center">{e.count}</td>
                      <td className="py-1 px-2 text-right font-bold text-rose-600">
                        {currency}{e.total.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-500">{e.percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-2 text-center text-slate-400 italic">
                      No expenses recorded in period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Top Performing Products */}
        <div className="mb-6">
          <div className="border-b border-slate-200 pb-1 mb-2 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Product Trading Performance
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">Ranked by Units Sold</span>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y border-slate-300 text-[10px] uppercase">
                <th className="py-1.5 px-2 text-center font-bold" style={{ width: '32px' }}>
                  #
                </th>
                <th className="py-1.5 px-2 font-bold">Product Item</th>
                <th className="py-1.5 px-2 font-bold">Category</th>
                <th className="py-1.5 px-2 text-center font-bold">Units Sold</th>
                <th className="py-1.5 px-2 text-right font-bold">Selling Price ({currency})</th>
                <th className="py-1.5 px-2 text-right font-bold">Total Sales ({currency})</th>
                <th className="py-1.5 px-2 text-right font-bold">% Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {calc.topProducts.length > 0 ? (
                calc.topProducts.map((p, idx) => (
                  <tr key={p.name + idx}>
                    <td className="py-1.5 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-1.5 px-2 text-slate-600">{p.category}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-emerald-800">{p.qty}</td>
                    <td className="py-1.5 px-2 text-right">{currency}{p.unitPrice.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right font-black text-emerald-700">
                      {currency}{p.rev.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-500 font-medium">
                      {calc.totalRevenue > 0 ? Math.round((p.rev / calc.totalRevenue) * 100) : 0}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-slate-400 italic">
                    No product transactions during this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Optional Proprietor Notes */}
        {customNotes && (
          <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900">
            <strong className="block text-[10px] uppercase font-bold text-amber-800 mb-0.5">
              Proprietor Notes / Annotation:
            </strong>
            {customNotes}
          </div>
        )}
      </div>

      {/* Official Sign-off & Verification Footer Block */}
      <div className="mt-8 pt-4 border-t border-slate-200 bg-slate-50/60 p-4 rounded-lg border border-slate-200">
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong>Merchant Statement Verification:</strong> This document represents an official,
          standard full-size business performance report prepared from the ledger records of{' '}
          <strong>{business.name}</strong>. Rendered in standard document aspect ratio (Standard A4 /
          US Letter), formatted for official financial recordkeeping, tax preparation, partner review,
          or banking verification.
        </p>

        <div className="grid grid-cols-2 gap-8 mt-6 pt-4 border-t border-dashed border-slate-300">
          <div>
            <div className="border-b border-slate-900 w-3/4 mb-1 h-6"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              Prepared By: {business.ownerName || 'Business Proprietor'}
            </span>
          </div>

          <div className="text-right">
            <div className="border-b border-slate-900 w-3/4 ml-auto mb-1 h-6"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              Date & Official Stamp: {dateFormatted}
            </span>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-4 mt-3 border-t border-slate-200 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SmartBiz Pocket • Standard Full-Size PDF & Print Document Engine</span>
        </div>
      </div>
    </div>
  );
};
