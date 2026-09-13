import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { SmartBizState, BusinessHealthInsight } from '../../types';
import { generateHealthInsights } from '../../db/storage';
import { TabType } from '../common/Navigation';

interface InsightsModuleProps {
  state: SmartBizState;
  onNavigate: (tab: TabType) => void;
}

export const InsightsModule: React.FC<InsightsModuleProps> = ({ state, onNavigate }) => {
  const insights = generateHealthInsights(state);
  const { products, sales, expenses, debtors } = state;

  // Calculate simple health score (0-100)
  let healthScore = 75;
  const lowStockCount = products.filter(p => p.itemType !== 'service' && p.quantity <= p.minStock).length;
  const activeDebtors = debtors.filter(d => d.balanceOwed > 0);
  const totalDebt = activeDebtors.reduce((sum, d) => sum + d.balanceOwed, 0);

  if (lowStockCount > 3) healthScore -= 15;
  if (totalDebt > 100) healthScore -= 10;
  if (sales.length > 5) healthScore += 15;
  if (healthScore > 100) healthScore = 100;
  if (healthScore < 30) healthScore = 30;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Business Health Insights</h2>
        <p className="text-xs text-slate-500">
          Rule-based automated advice • 100% local, no internet needed
        </p>
      </div>

      {/* Business Health Score Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Overall Health Rating
            </span>
            <div className="text-2xl font-black mt-1 flex items-baseline gap-1.5">
              <span>{healthScore}/100</span>
              <span className="text-xs font-semibold text-slate-300">
                {healthScore >= 80 ? '• Excellent Trade' : healthScore >= 60 ? '• Healthy' : '• Action Needed'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {healthScore >= 80
                ? 'Your inventory turns fast and credit debt is manageable.'
                : 'Follow the tips below to collect debt and restock low items.'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-extrabold text-sm shrink-0 bg-slate-800">
            {healthScore}%
          </div>
        </div>
      </div>

      {/* Generated Insights List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Current Observations & Recommendations
        </h3>

        {insights.map(insight => {
          const isPositive = insight.type === 'positive';
          const isWarning = insight.type === 'warning';
          const isAlert = insight.type === 'alert';

          return (
            <div
              key={insight.id}
              className={`p-3.5 rounded-xl border shadow-xs transition-all ${
                isAlert
                  ? 'bg-amber-50/70 border-amber-300'
                  : isWarning
                  ? 'bg-rose-50/70 border-rose-300'
                  : isPositive
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isAlert
                      ? 'bg-amber-100 text-amber-800'
                      : isWarning
                      ? 'bg-rose-100 text-rose-800'
                      : isPositive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isAlert || isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {insight.title}
                    </h4>
                    {insight.metric && (
                      <span className="text-[11px] font-extrabold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-800 shrink-0">
                        {insight.metric}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.message}</p>

                  {insight.actionLabel && insight.actionTab && (
                    <button
                      onClick={() => onNavigate(insight.actionTab as TabType)}
                      className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 active:translate-x-0.5 transition-transform"
                    >
                      <span>{insight.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informal Trader Best Practices */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-700" />
          Tuckshop & Vendor Money Rules
        </h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li><strong>Separate Pocket Money from Shop Money:</strong> Never take bread or cooking oil for home without recording it as an expense.</li>
          <li><strong>Limit Customer Credit:</strong> Cap uncollected debt to under 15% of your weekly sales.</li>
          <li><strong>Currency Hedging:</strong> When accepting EcoCash or ZiG, restock immediately to protect against market exchange shifts.</li>
        </ul>
      </div>
    </div>
  );
};
