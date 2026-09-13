import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { SmartBizState } from '../../types';
import { TabType } from '../common/Navigation';

interface DashboardModuleProps {
  state: SmartBizState;
  onNavigate: (tab: TabType) => void;
  onQuickAddSale: () => void;
  onQuickAddExpense: () => void;
  onQuickAddProduct: () => void;
  onQuickAddCustomer: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  state,
  onNavigate,
  onQuickAddSale,
  onQuickAddExpense,
  onQuickAddProduct,
  onQuickAddCustomer,
}) => {
  const { products, sales, expenses, debtors, settings } = state;
  const currency = settings.currencySymbol;

  // Calculate Today's figures
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === todayStr);
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.totalSale, 0);
  const totalSalesProfitToday = todaySales.reduce((sum, s) => sum + s.profit, 0);

  const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === todayStr);
  const totalExpensesToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const netProfitToday = totalSalesProfitToday - totalExpensesToday;

  // Stock items & alerts (physical goods only)
  const physicalProducts = products.filter(p => p.itemType !== 'service');
  const totalStockItems = physicalProducts.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockProducts = physicalProducts.filter(p => p.quantity <= p.minStock);

  // Debtors ("People Who Owe Me")
  const activeDebtors = debtors.filter(d => d.balanceOwed > 0);
  const totalDebtOwed = activeDebtors.reduce((sum, d) => sum + d.balanceOwed, 0);

  // Recent 3 transactions
  const recentActivities = [
    ...sales.map(s => ({
      type: 'sale' as const,
      title: `Sale (${s.items.length} items)`,
      desc: s.customerName ? `To ${s.customerName}` : s.paymentMethod,
      amount: s.totalSale,
      time: new Date(s.date),
      isPositive: true,
    })),
    ...expenses.map(e => ({
      type: 'expense' as const,
      title: e.category,
      desc: e.description,
      amount: e.amount,
      time: new Date(e.date),
      isPositive: false,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-6">
      {/* First-Time / Empty State Onboarding Card */}
      {products.length === 0 && sales.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-xl shadow-sm border border-emerald-800/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Welcome to SmartBiz Pocket</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your store is fresh and ready to trade offline. Begin by adding your stock items or recording your first daily sale or expense.
              </p>
              <div className="mt-3 flex items-center flex-wrap gap-2">
                <button
                  onClick={onQuickAddProduct}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Add First Item</span>
                </button>
                <button
                  onClick={onQuickAddSale}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>+ Record Sale</span>
                </button>
                <button
                  onClick={onQuickAddExpense}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>+ Record Expense</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Urgent Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div
          onClick={() => onNavigate('stock')}
          className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {lowStockProducts.length} Product{lowStockProducts.length > 1 ? 's' : ''} Low on Stock!
              </p>
              <p className="text-[11px] text-amber-700 leading-tight">
                {lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                {lowStockProducts.length > 2 && ` +${lowStockProducts.length - 2} more`}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800 flex items-center shrink-0">
            View <ChevronRight className="w-4 h-4 ml-0.5" />
          </span>
        </div>
      )}

      {/* Primary KPI Cards (WhatsApp/Material style) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Today's Sales */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Today's Sales</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currency}{totalSalesToday.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {todaySales.length} transaction{todaySales.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Today's Spent</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currency}{totalExpensesToday.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {todayExpenses.length} expense{todayExpenses.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Today's Profit (Instant calculation) */}
        <div className="col-span-2 bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-200">Today's Net Profit</p>
              <div className="text-2xl font-black tracking-tight mt-0.5">
                {currency}{netProfitToday.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                netProfitToday >= 0 ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
              }`}>
                {totalSalesToday > 0 ? `${Math.round((totalSalesProfitToday / totalSalesToday) * 100)}% Margin` : 'Zero sales'}
              </span>
              <p className="text-[10px] text-emerald-300 mt-1">Calculated instantly</p>
            </div>
          </div>
        </div>

        {/* Stock Items */}
        <div
          onClick={() => onNavigate('stock')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Stock Left</span>
            <Package className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {totalStockItems} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {products.length} product lines
          </div>
        </div>

        {/* People Who Owe Me (Debtors) */}
        <div
          onClick={() => onNavigate('debtors')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">People Who Owe Me</span>
            <Users className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-600">
            {currency}{totalDebtOwed.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {activeDebtors.length} debtor{activeDebtors.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Ultra-Fast Quick Actions Bar (1-tap access) */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Fast Actions (1-2 Taps)
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {/* + Sale */}
          <button
            onClick={onQuickAddSale}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-xs transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mb-1 font-black text-lg">
              +
            </div>
            <span className="text-xs font-bold">Sale</span>
            <span className="text-[9px] text-emerald-200">&lt; 10s</span>
          </button>

          {/* + Expense */}
          <button
            onClick={onQuickAddExpense}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xs transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center mb-1 font-black text-lg">
              -
            </div>
            <span className="text-xs font-bold">Expense</span>
            <span className="text-[9px] text-rose-200">ZESA / Kombi</span>
          </button>

          {/* + Stock */}
          <button
            onClick={onQuickAddProduct}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-800 shadow-xs transition-all"
          >
            <Package className="w-5 h-5 mb-1.5 text-slate-700" />
            <span className="text-xs font-semibold">+ Stock</span>
            <span className="text-[9px] text-slate-500">Restock</span>
          </button>

          {/* + Customer */}
          <button
            onClick={onQuickAddCustomer}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-800 shadow-xs transition-all"
          >
            <Users className="w-5 h-5 mb-1.5 text-slate-700" />
            <span className="text-xs font-semibold">+ Client</span>
            <span className="text-[9px] text-slate-500">Record</span>
          </button>
        </div>
      </div>

      {/* Mini Performance Snapshot / Reports shortcut */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h4 className="text-xs font-bold text-slate-800">Business Performance</h4>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
          >
            Full Reports <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-lg border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 uppercase">Total Sales</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {currency}{sales.reduce((acc, s) => acc + s.totalSale, 0).toFixed(1)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase">Total Spent</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {currency}{expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(1)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase">Net Profit</span>
            <p className="text-xs sm:text-sm font-bold text-emerald-700">
              {currency}{(sales.reduce((acc, s) => acc + s.profit, 0) - expenses.reduce((acc, e) => acc + e.amount, 0)).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-800">Recent Transactions</h4>
          </div>
          <span className="text-[11px] text-slate-400">Latest</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-6 px-4 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No transactions recorded yet today</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sales, customer receipts, and daily expenses will appear here automatically.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={onQuickAddSale}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Record First Sale
              </button>
              <button
                onClick={onQuickAddExpense}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Record Expense
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      act.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {act.isPositive ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">{act.title}</p>
                    <p className="text-[10px] text-slate-400">{act.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      act.isPositive ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {act.isPositive ? '+' : '-'}
                    {currency}{act.amount.toFixed(2)}
                  </span>
                  <p className="text-[9px] text-slate-400">
                    {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
