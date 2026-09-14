import React, { useState } from 'react';
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
  Crown,
  Key,
  MessageSquare,
  Copy,
  Check,
  PhoneCall,
} from 'lucide-react';
import { SmartBizState } from '../../types';
import { TabType } from '../common/Navigation';
import {
  getSubscriptionStatus,
  ECOCASH_USSD_CODE,
  ECOCASH_USSD_TEL,
  createRenewalWhatsAppUrl,
} from '../../utils/licenseKey';

interface DashboardModuleProps {
  state: SmartBizState;
  onNavigate: (tab: TabType) => void;
  onOpenPaywall?: () => void;
  onQuickAddSale: () => void;
  onQuickAddExpense: () => void;
  onQuickAddProduct: () => void;
  onQuickAddCustomer: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  state,
  onNavigate,
  onOpenPaywall,
  onQuickAddSale,
  onQuickAddExpense,
  onQuickAddProduct,
  onQuickAddCustomer,
}) => {
  const { products, sales, expenses, debtors, settings } = state;
  const currency = settings.currencySymbol;
  const [copiedUssd, setCopiedUssd] = useState(false);

  // Pro Subscription Expiry calculation with 5-Day and 2-Day Alerts
  const subStatus = getSubscriptionStatus(settings);
  const isAlert2Days = subStatus.isPro && subStatus.daysRemaining <= 2 && !subStatus.isExpired;
  const isAlert5Days = subStatus.isPro && subStatus.daysRemaining <= 5 && subStatus.daysRemaining > 2 && !subStatus.isExpired;
  const isExpired = subStatus.isExpired;

  const handleCopyUssd = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ECOCASH_USSD_CODE);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2000);
  };

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
      {/* ================================================================ */}
      {/* Pro Subscription Alerts: 2-Day Urgent Alert & 5-Day Notice Banner*/}
      {/* ================================================================ */}
      {isAlert2Days && (
        <div className="bg-gradient-to-br from-rose-600 via-orange-600 to-amber-600 text-white p-4 rounded-2xl shadow-xl border-2 border-rose-300 relative overflow-hidden animate-fadeIn">
          {/* Subtle background glow */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2.5 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-slate-950 text-rose-300 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-rose-300 text-[10px] font-black uppercase tracking-wider shadow-xs animate-bounce">
                {subStatus.daysRemaining === 1
                  ? '🚨 2-Day Alert: Expires in 1 Day'
                  : subStatus.daysRemaining <= 0
                  ? '🚨 2-Day Alert: Expires Today'
                  : '🚨 2-Day Alert: Expires in 2 Days'}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-950 bg-rose-200 px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs">
                Expires {subStatus.expiryDateStr}
              </span>
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <h3 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
              <span>Urgent: Pro Subscription Expiring in {subStatus.daysRemaining <= 1 ? 'under 24 hours' : '2 days'}!</span>
            </h3>
            <p className="text-xs text-rose-100 mt-1 leading-relaxed font-medium">
              Your 30-day SmartBiz Pro subscription will expire on{' '}
              <strong className="underline decoration-white/50 text-white">
                {subStatus.expiryDateStr}
              </strong>
              . Pay $2.00 via EcoCash or contact Comfort Designs for your renewal key immediately to prevent your sales and products from reverting to free-tier restrictions.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-3 flex items-center flex-wrap gap-2 relative z-10">
            <button
              type="button"
              onClick={() => (onOpenPaywall ? onOpenPaywall() : onNavigate('settings'))}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 active:scale-98 text-amber-300 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Renew & Enter Key ($2.00)</span>
            </button>

            <a
              href={createRenewalWhatsAppUrl(state.business.name, subStatus.daysRemaining)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Request Key via WhatsApp</span>
            </a>

            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/20 px-2.5 py-1.5 rounded-xl text-amber-300 text-[11px] font-mono font-bold ml-auto sm:ml-0 shadow-2xs">
              <span>{ECOCASH_USSD_CODE}</span>
              <button
                type="button"
                onClick={handleCopyUssd}
                className="hover:text-white p-0.5 rounded cursor-pointer"
                title="Copy EcoCash USSD code"
              >
                {copiedUssd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAlert5Days && (
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4 rounded-2xl shadow-lg border-2 border-amber-300 relative overflow-hidden animate-fadeIn">
          {/* Subtle background decoration */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2.5 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-xs">
                ⚠️ 5-Day Alert: Expires in {subStatus.daysRemaining} Days
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-900 bg-amber-400/90 px-2 py-0.5 rounded-md border border-amber-300/60 shadow-2xs">
                Expires {subStatus.expiryDateStr}
              </span>
            </div>
          </div>

          <div className="mt-2.5 relative z-10">
            <h3 className="text-sm font-black text-slate-950 leading-tight">
              5-Day Advance Notice: Pro Subscription Renewal Due Soon
            </h3>
            <p className="text-xs text-slate-900/95 mt-1 leading-relaxed font-medium">
              Your 30-day SmartBiz Pro subscription will expire in{' '}
              <strong className="underline decoration-slate-950/40">
                {subStatus.daysRemaining} days
              </strong>{' '}
              ({subStatus.expiryDateStr}). Secure your renewal key ahead of time to ensure continuous unlimited sales recording, unlimited stock catalog, and automatic backups.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-3 flex items-center flex-wrap gap-2 relative z-10">
            <button
              type="button"
              onClick={() => (onOpenPaywall ? onOpenPaywall() : onNavigate('settings'))}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 active:scale-98 text-amber-300 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Renew & Enter Key ($2.00)</span>
            </button>

            <a
              href={createRenewalWhatsAppUrl(state.business.name, subStatus.daysRemaining)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Request Key via WhatsApp</span>
            </a>

            <div className="flex items-center gap-1.5 bg-amber-400/90 border border-amber-300/80 px-2.5 py-1.5 rounded-xl text-slate-950 text-[11px] font-mono font-bold ml-auto sm:ml-0 shadow-2xs">
              <span>{ECOCASH_USSD_CODE}</span>
              <button
                type="button"
                onClick={handleCopyUssd}
                className="hover:text-slate-800 p-0.5 rounded cursor-pointer"
                title="Copy EcoCash USSD code"
              >
                {copiedUssd ? <Check className="w-3 h-3 text-emerald-900" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When Expired */}
      {isExpired && (
        <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white p-4 rounded-2xl shadow-lg border-2 border-rose-400 relative overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-slate-950 text-rose-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </span>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                  Pro Plan Expired
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Subscription Expired on {subStatus.expiryDateStr}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => (onOpenPaywall ? onOpenPaywall() : onNavigate('settings'))}
              className="px-3 py-1.5 bg-white text-rose-950 text-xs font-black rounded-lg shadow-sm hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              Reactivate ($2.00)
            </button>
          </div>
          <p className="text-xs text-rose-100 mt-2">
            Your 30-day Pro plan has expired. Sales limit is currently capped at 100/mo. Generate or enter your new 30-day key to restore full unlimited Pro access.
          </p>
        </div>
      )}

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
