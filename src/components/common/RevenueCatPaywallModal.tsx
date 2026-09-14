import React, { useState } from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  PhoneCall,
  Copy,
  MessageSquare,
  Key,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LegalDocType } from '../legal/LegalModal';
import { AppSettings } from '../../types';
import {
  ECOCASH_USSD_CODE,
  ECOCASH_USSD_TEL,
  COMFORT_DESIGNS_PHONE,
  COMFORT_DESIGNS_LOCAL_PHONE,
  PRO_PLAN_PRICE_USD,
  PRO_PLAN_DURATION_DAYS,
  validateSubscriptionKey,
  generateSubscriptionKey,
  getSubscriptionStatus,
  createWhatsAppProofUrl,
  createSmsProofUrl,
} from '../../utils/licenseKey';

interface RevenueCatPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  businessName?: string;
  businessPhone?: string;
  onActivateSubscription: (key: string, days: number) => { success: boolean; expiryDate: string };
  onDowngrade: () => void;
  onOpenLegal: (doc: LegalDocType) => void;
}

export const RevenueCatPaywallModal: React.FC<RevenueCatPaywallModalProps> = ({
  isOpen,
  onClose,
  settings,
  businessName = '',
  businessPhone = '',
  onActivateSubscription,
  onDowngrade,
  onOpenLegal,
}) => {
  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Admin key generator state for Comfort Designs
  const [showAdminTool, setShowAdminTool] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [adminClientNote, setAdminClientNote] = useState('');

  if (!isOpen) return null;

  const subStatus = getSubscriptionStatus(settings);

  const handleCopyUssd = () => {
    navigator.clipboard.writeText(ECOCASH_USSD_CODE);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2000);
  };

  const handleActivate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setKeyError(null);
    setSuccessMessage(null);

    const validation = validateSubscriptionKey(enteredKey);
    if (!validation.isValid) {
      setKeyError(validation.message);
      return;
    }

    const result = onActivateSubscription(enteredKey.trim().toUpperCase(), validation.days);
    if (result.success) {
      const expiryFormatted = new Date(result.expiryDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      setSuccessMessage(`Pro Plan Successfully Activated! Enjoy 30 days of full access until ${expiryFormatted}.`);
      setEnteredKey('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    }
  };

  // Admin Generator Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN or phone match
    if (adminPin === '1234' || adminPin === '0772824132' || adminPin === 'comfort') {
      setIsAdminUnlocked(true);
      setGeneratedKey(generateSubscriptionKey(30, adminClientNote));
    } else {
      alert('Incorrect Admin PIN. (Default: 1234 or contact Comfort Designs)');
    }
  };

  const handleGenerateNewKey = () => {
    setGeneratedKey(generateSubscriptionKey(30, adminClientNote));
  };

  const handleCopyGeneratedKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const whatsAppUrl = createWhatsAppProofUrl(businessName, businessPhone);
  const smsUrl = createSmsProofUrl(businessName);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Paywall Header */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-800 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center shadow-inner">
              <Crown className="w-6 h-6 text-amber-200 fill-amber-300" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[9px] font-black tracking-wider uppercase">
                Production Paywall
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                SmartBiz Pocket Pro
              </h2>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <p className="text-xs text-amber-100">
              Unlimited sales, stock catalog, debtors & auto-backup alerts.
            </p>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-white">${PRO_PLAN_PRICE_USD.toFixed(2)}</span>
              <span className="text-xs text-amber-200 font-medium"> / 30 days</span>
            </div>
          </div>
        </div>

        {/* Current Subscription Status Badge */}
        <div className="bg-slate-900 px-4 py-2.5 text-slate-200 text-xs border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                subStatus.isPro ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-bold">
              {subStatus.isPro ? (
                <span className="text-emerald-400">Pro Plan Active ({subStatus.daysRemaining} days left)</span>
              ) : subStatus.isExpired ? (
                <span className="text-rose-400">Subscription Expired ({subStatus.expiryDateStr})</span>
              ) : (
                <span className="text-slate-300">Free Tier (100 monthly sales limit)</span>
              )}
            </span>
          </div>

          {subStatus.isPro && (
            <span className="text-[10px] text-slate-400">
              Expires: <strong className="text-amber-300">{subStatus.expiryDateStr}</strong>
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-500 rounded-xl text-xs text-emerald-900 flex items-start gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[3]" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Pro Benefits Quick Checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlimited sales recording</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlimited product catalog</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Daily auto backup alerts</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>30-day renewable access</span>
            </div>
          </div>

          {/* 3-Step Subscription Flow */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Subscription Steps (EcoCash Transfer)</span>
            </h3>

            {/* STEP 1: EcoCash USSD Transfer */}
            <div className="p-3.5 rounded-xl border-2 border-emerald-600/80 bg-emerald-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Dial EcoCash USSD Code to Pay $2.00
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-white">
                  $2.00 USD
                </span>
              </div>

              <p className="text-[11px] text-slate-600">
                Direct money transfer to Comfort Designs (<code>0772824132</code>).
              </p>

              {/* Interactive USSD Code Display */}
              <div className="bg-slate-950 p-2.5 rounded-xl flex items-center justify-between text-amber-300 font-mono text-xs sm:text-sm font-bold border border-slate-800 shadow-inner">
                <span className="select-all tracking-wider">{ECOCASH_USSD_CODE}</span>
                <button
                  type="button"
                  onClick={handleCopyUssd}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedUssd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy USSD</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Dial Link */}
              <a
                href={ECOCASH_USSD_TEL}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
              >
                <PhoneCall className="w-4 h-4 text-emerald-200" />
                <span>Tap to Dial *151*1*1*0772824132*2# on Phone</span>
              </a>
            </div>

            {/* STEP 2: Send Proof of Payment */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Send Proof of Payment to Comfort Designs
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Forward your EcoCash confirmation message or approval code to receive your 30-day Pro license key.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Proof</span>
                </a>

                <a
                  href={smsUrl}
                  className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                  <span>SMS Proof</span>
                </a>
              </div>
            </div>

            {/* STEP 3: Enter & Activate Subscription Key */}
            <div className="p-3.5 rounded-xl border-2 border-amber-500/80 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Enter Your 30-Day Pro Key to Activate
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800">
                  Instant Activation
                </span>
              </div>

              <form onSubmit={handleActivate} className="space-y-2">
                <div>
                  <input
                    type="text"
                    value={enteredKey}
                    onChange={e => {
                      setEnteredKey(e.target.value);
                      if (keyError) setKeyError(null);
                    }}
                    placeholder="e.g. SBP-PRO-30D-ABCD-1234"
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal"
                  />
                  {keyError && (
                    <div className="flex items-start gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{keyError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!enteredKey.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Key className="w-4 h-4" />
                  <span>Activate 30-Day Pro Plan</span>
                </button>
              </form>
            </div>
          </div>

          {/* Admin License Key Generator for Comfort Designs */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAdminTool(!showAdminTool)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Comfort Designs Key Generator Tool (Admin)</span>
            </button>

            {showAdminTool && (
              <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">Admin License Generator</span>
                  <span className="text-[10px] text-slate-400 font-mono">0772824132</span>
                </div>

                {!isAdminUnlocked ? (
                  <form onSubmit={handleUnlockAdmin} className="flex gap-2">
                    <input
                      type="password"
                      value={adminPin}
                      onChange={e => setAdminPin(e.target.value)}
                      placeholder="Enter Admin PIN (Default: 1234)"
                      className="flex-1 text-xs p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Unlock
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-300">
                      Generate authentic 30-day Pro keys to send to merchants after receiving $2 EcoCash:
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={adminClientNote}
                        onChange={e => setAdminClientNote(e.target.value)}
                        placeholder="Client note / phone (optional)"
                        className="flex-1 text-xs p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateNewKey}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>New Key</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-emerald-400 text-xs">
                      <span className="select-all font-bold">{generatedKey}</span>
                      <button
                        type="button"
                        onClick={handleCopyGeneratedKey}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-sans font-bold flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredKey(generatedKey);
                          setShowAdminTool(false);
                        }}
                        className="flex-1 py-1 px-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold text-center"
                      >
                        Use Key in Activation Field
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subscribed User Downgrade Option */}
          {subStatus.isPro && (
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need to switch device or reset?</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to revert to the Free Tier?')) {
                    onDowngrade();
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Deactivate Pro Plan
              </button>
            </div>
          )}

          {/* Legal Footer & RevenueCat Reference */}
          <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p>
              SmartBiz Pocket Pro ($2.00 / 30 days) • Designed by Comfort Designs (+263772824132)
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
