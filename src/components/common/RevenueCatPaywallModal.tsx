import React, { useState } from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Key,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { LegalDocType } from '../legal/LegalModal';

interface RevenueCatPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  onOpenLegal: (doc: LegalDocType) => void;
}

export const RevenueCatPaywallModal: React.FC<RevenueCatPaywallModalProps> = ({
  isOpen,
  onClose,
  isPremium,
  onTogglePremium,
  onOpenLegal,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseSuccess(true);
      if (!isPremium) {
        onTogglePremium();
      }
      setTimeout(() => {
        setPurchaseSuccess(false);
        onClose();
      }, 1500);
    }, 900);
  };

  const handleRestore = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('RevenueCat: Queried entitlements for test_RVdhYytnLyhMFndYhQvPFRKjhYI. Pro status synchronized.');
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Paywall Header */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-800 text-slate-950 p-5 relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center text-white mb-3 shadow-inner">
            <Crown className="w-7 h-7 text-amber-200 fill-amber-300" />
          </div>

          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-black tracking-wider uppercase mb-1">
            RevenueCat Paywall
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            Upgrade to SmartBiz Pro
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            Remove limits and run your shop with enterprise-grade offline speed.
          </p>
        </div>

        {/* RevenueCat Integration Badge */}
        <div className="bg-slate-900 px-4 py-2 text-slate-300 text-[11px] border-b border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-emerald-400">
              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[210px]">API: test_RVdhYytnLyhMFndYhQvPFRKjhYI</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              iOS & Android
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
            <span>Entitlement:</span>
            <span className="font-mono text-amber-300 font-semibold">smartbiz_pocket_pro</span>
          </div>
        </div>

        {/* Paywall Features List */}
        <div className="p-5 space-y-4">
          <div className="space-y-2.5">
            {[
              {
                title: 'Unlimited Sales & Receipts',
                desc: 'No 100 sales/mo limit. Record as many customer orders as you need.',
              },
              {
                title: 'Unlimited Inventory Catalog',
                desc: 'Add unlimited items, categories, cost prices, and wholesale tracking.',
              },
              {
                title: 'Automated Daily Backup Prompts',
                desc: 'Keep your cashbook, debtors, and stock tamper-proof with JSON snapshots.',
              },
              {
                title: 'Flutter & Drift SQLite Codebase',
                desc: 'Full production mobile blueprint with RevenueCat integration included.',
              },
            ].map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{feat.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Card: $2 Monthly */}
          <div className="p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/60 relative">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider">
              Most Popular
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Pro Monthly Subscription</p>
                <p className="text-[11px] text-slate-500">Auto-renews monthly • Cancel anytime</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-800">$2.00</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to RevenueCat...</span>
                </>
              ) : purchaseSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Pro Plan Activated!</span>
                </>
              ) : isPremium ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Already Subscribed ($2/mo Pro)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Subscribe for $2 / month</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRestore}
                disabled={isProcessing}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold py-1.5 px-2 transition-colors cursor-pointer"
              >
                Restore Purchases
              </button>

              {isPremium && (
                <button
                  type="button"
                  onClick={() => {
                    onTogglePremium();
                    onClose();
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold py-1.5 px-2 transition-colors cursor-pointer"
                >
                  Downgrade to Free Tier
                </button>
              )}
            </div>

            {isPremium && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-lg">
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-900">Pro Subscription Active</span>
                  <p className="text-[10px] text-slate-500">Managed via RevenueCat Customer Center</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'RevenueCat Customer Center: In Flutter, RevenueCatUI.presentCustomerCenter() opens the self-service subscription sheet to manage plan, view billing history, or cancel.'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] cursor-pointer"
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </div>

          {/* Legal Footnote */}
          <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p>
              Protected by RevenueCat SDK. Subscriptions billed at $2.00 monthly until cancelled.
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLegal('terms');
                }}
                className="underline hover:text-emerald-700 cursor-pointer"
              >
                Terms of Use
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLegal('privacy');
                }}
                className="underline hover:text-emerald-700 cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
