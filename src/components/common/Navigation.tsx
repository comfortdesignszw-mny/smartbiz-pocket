import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ArrowDownCircle,
  Package,
  Users,
  Menu,
  BarChart3,
  Lightbulb,
  Database,
  Settings as SettingsIcon,
  Code2,
  X,
  UserCheck,
} from 'lucide-react';
import { LegalDocType } from '../legal/LegalModal';

export type TabType =
  | 'dashboard'
  | 'sales'
  | 'expenses'
  | 'stock'
  | 'debtors'
  | 'customers'
  | 'reports'
  | 'insights'
  | 'backup'
  | 'settings'
  | 'flutter';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  debtorCount: number;
  lowStockCount: number;
  isMoreOpen: boolean;
  onToggleMore: (open: boolean) => void;
  isPremium?: boolean;
  onOpenLegal?: (doc: LegalDocType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  debtorCount,
  lowStockCount,
  isMoreOpen,
  onToggleMore,
  isPremium = false,
  onOpenLegal,
}) => {
  const isMoreActive = ['customers', 'reports', 'insights', 'backup', 'settings', 'flutter'].includes(activeTab);

  return (
    <>
      {/* "More" Drawer / Modal */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center transition-opacity"
          onClick={() => onToggleMore(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl p-4 shadow-2xl pb-6 animate-in slide-in-from-bottom-5 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">All Modules & Tools</h3>
              </div>
              <button
                onClick={() => onToggleMore(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  onSelectTab('customers');
                  onToggleMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeTab === 'customers'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5 mb-1.5 text-emerald-700" />
                <span className="text-xs font-semibold">Customers</span>
                <span className="text-[10px] text-slate-500">History & Details</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('reports');
                  onToggleMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeTab === 'reports'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-5 h-5 mb-1.5 text-indigo-600" />
                <span className="text-xs font-semibold">Performance</span>
                <span className="text-[10px] text-slate-500">Daily, Weekly, PDF</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('insights');
                  onToggleMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeTab === 'insights'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Lightbulb className="w-5 h-5 mb-1.5 text-amber-500" />
                <span className="text-xs font-semibold">Health Insights</span>
                <span className="text-[10px] text-slate-500">Offline Analytics</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('backup');
                  onToggleMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeTab === 'backup'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Database className="w-5 h-5 mb-1.5 text-sky-600" />
                <span className="text-xs font-semibold">Backup & Data</span>
                <span className="text-[10px] text-slate-500">JSON/SQLite Export</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  onToggleMore(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <SettingsIcon className="w-5 h-5 mb-1.5 text-slate-600" />
                <span className="text-xs font-semibold">Settings</span>
                <span className="text-[10px] text-slate-500">Currency & PIN</span>
              </button>

              {isPremium && (
                <button
                  onClick={() => {
                    onSelectTab('flutter');
                    onToggleMore(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    activeTab === 'flutter'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Code2 className="w-5 h-5 mb-1.5 text-teal-600" />
                  <span className="text-xs font-semibold">Flutter Code</span>
                  <span className="text-[10px] text-teal-600 font-bold">PRO Architecture</span>
                </button>
              )}
            </div>

            {/* Legal & Attribution in More Drawer */}
            <div className="pt-3 mt-1 border-t border-slate-200/80 text-center space-y-1">
              <p className="text-[11px] font-semibold text-slate-700">
                @2026 SmartBiz Pocket. All Rights Reserved.
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Designed by Comfort Designs-+263772824132
              </p>
              <div className="flex items-center justify-center gap-2 pt-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    onToggleMore(false);
                    onOpenLegal?.('terms');
                  }}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  Terms of Service
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMore(false);
                    onOpenLegal?.('privacy');
                  }}
                  className="text-emerald-700 hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Fixed Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shrink-0 z-40 select-none shadow-lg">
        {/* 1. Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Home</span>
        </button>

        {/* 2. Sales */}
        <button
          onClick={() => onSelectTab('sales')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            activeTab === 'sales' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Sales</span>
        </button>

        {/* 3. Expenses */}
        <button
          onClick={() => onSelectTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            activeTab === 'expenses' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Expenses</span>
        </button>

        {/* 4. Stock / Inventory */}
        <button
          onClick={() => onSelectTab('stock')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            activeTab === 'stock' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-5 h-5" />
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-3 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white leading-tight">
              {lowStockCount}
            </span>
          )}
          <span className="text-[11px] mt-0.5">Stock</span>
        </button>

        {/* 5. Debtors / People Who Owe Me */}
        <button
          onClick={() => onSelectTab('debtors')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            activeTab === 'debtors' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          {debtorCount > 0 && (
            <span className="absolute top-0 right-3 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white leading-tight">
              {debtorCount}
            </span>
          )}
          <span className="text-[11px] mt-0.5">Debtors</span>
        </button>

        {/* 6. More Menu */}
        <button
          onClick={() => onToggleMore(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 ${
            isMoreActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
