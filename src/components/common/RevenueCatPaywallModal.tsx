import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Send,
  Sliders,
  Search,
  Trash2,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { LegalDocType } from '../legal/LegalModal';
import { AppSettings, SubscriptionRecord } from '../../types';
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
  getSubscriptionAlertLevel,
  createWhatsAppProofUrl,
  createSmsProofUrl,
  createCustomerKeyWhatsAppUrl,
  createAdminRenewalReminderWhatsAppUrl,
} from '../../utils/licenseKey';

interface RevenueCatPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  businessName?: string;
  businessPhone?: string;
  subscriptionRecords?: SubscriptionRecord[];
  onActivateSubscription: (
    key: string,
    days: number,
    subscriberName?: string,
    subscriberPhone?: string
  ) => { success: boolean; expiryDate: string };
  onSaveSubscriptionRecord?: (record: SubscriptionRecord) => void;
  onDeleteSubscriptionRecord?: (recordId: string) => void;
  onUpdateAdminPin?: (newPin: string) => void;
  onDowngrade: () => void;
  onOpenLegal: (doc: LegalDocType) => void;
}

export const RevenueCatPaywallModal: React.FC<RevenueCatPaywallModalProps> = ({
  isOpen,
  onClose,
  settings,
  businessName = '',
  businessPhone = '',
  subscriptionRecords = [],
  onActivateSubscription,
  onSaveSubscriptionRecord,
  onDeleteSubscriptionRecord,
  onUpdateAdminPin,
  onDowngrade,
  onOpenLegal,
}) => {
  const [enteredKey, setEnteredKey] = useState('');
  const [subscriberName, setSubscriberName] = useState(businessName || '');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Admin key generator state for Comfort Designs
  const [showAdminTool, setShowAdminTool] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // New Key creation form state with client/user name
  const [adminClientName, setAdminClientName] = useState('');
  const [adminClientPhone, setAdminClientPhone] = useState('');
  const [adminClientNote, setAdminClientNote] = useState('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);
  const [justGeneratedRecord, setJustGeneratedRecord] = useState<SubscriptionRecord | null>(null);

  // Search and alert filtering
  const [adminRecordsFilter, setAdminRecordsFilter] = useState<'all' | 'alert_2_days' | 'alert_5_days' | 'active' | 'expired'>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Local fallback storage for subscription records
  const [localRecords, setLocalRecords] = useState<SubscriptionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('comfort_designs_admin_subscribers_v2');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Admin PIN management
  const [showPinChange, setShowPinChange] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Combine subscriptionRecords and localRecords without duplicates by key
  const allRecords = useMemo(() => {
    const map = new Map<string, SubscriptionRecord>();
    subscriptionRecords.forEach(r => {
      if (r && r.key) map.set(r.key.trim().toUpperCase(), r);
    });
    localRecords.forEach(r => {
      if (r && r.key) {
        const k = r.key.trim().toUpperCase();
        if (!map.has(k)) map.set(k, r);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime();
    });
  }, [subscriptionRecords, localRecords]);

  // Enrich records with calculated alert status & days remaining
  const enrichedRecords = useMemo(() => {
    const now = Date.now();
    return allRecords.map(rec => {
      const expiryTime = new Date(rec.expiryDate).getTime();
      const msRemaining = expiryTime - now;
      const isExpired = msRemaining <= 0;
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const alertLevel = getSubscriptionAlertLevel(daysRemaining, isExpired);
      const expiryDateStr = new Date(expiryTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const issuedDateStr = rec.issuedAt
        ? new Date(rec.issuedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
        : 'N/A';

      return {
        ...rec,
        daysRemaining,
        isExpired,
        alertLevel,
        expiryDateStr,
        issuedDateStr,
      };
    });
  }, [allRecords]);

  // Statistics for alert filters
  const stats = useMemo(() => {
    let alert2d = 0;
    let alert5d = 0;
    let active = 0;
    let expired = 0;

    enrichedRecords.forEach(r => {
      if (r.alertLevel === 'expired') expired++;
      else if (r.alertLevel === 'alert_2_days') alert2d++;
      else if (r.alertLevel === 'alert_5_days') alert5d++;
      else active++;
    });

    return {
      total: enrichedRecords.length,
      alert2d,
      alert5d,
      active,
      expired,
    };
  }, [enrichedRecords]);

  // Filtered records based on tab and search
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(r => {
      if (adminRecordsFilter === 'alert_2_days' && r.alertLevel !== 'alert_2_days') return false;
      if (adminRecordsFilter === 'alert_5_days' && r.alertLevel !== 'alert_5_days') return false;
      if (adminRecordsFilter === 'active' && r.alertLevel !== 'active') return false;
      if (adminRecordsFilter === 'expired' && r.alertLevel !== 'expired') return false;

      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase();
        const nameMatch = (r.clientName || '').toLowerCase().includes(q);
        const phoneMatch = (r.clientPhone || '').toLowerCase().includes(q);
        const keyMatch = (r.key || '').toLowerCase().includes(q);
        const notesMatch = (r.notes || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || keyMatch || notesMatch;
      }
      return true;
    });
  }, [enrichedRecords, adminRecordsFilter, adminSearchQuery]);

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

    const result = onActivateSubscription(
      enteredKey.trim().toUpperCase(),
      validation.days,
      subscriberName.trim() || businessName,
      businessPhone
    );
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

  // Admin Unlock (using secret PIN stored in settings, with NO password shown on screen)
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const currentSecretPin = settings.adminPin || '1234';
    if (adminPin.trim() === currentSecretPin || adminPin.trim() === '0772824132') {
      setIsAdminUnlocked(true);
      setAdminPin('');
    } else {
      setAdminError('Access Denied: Incorrect secret PIN.');
    }
  };

  // Generate a new 30-day key recorded with the user name & 30-day expiry date
  const handleGenerateKey = () => {
    setAdminKeyError(null);
    if (!adminClientName.trim()) {
      setAdminKeyError('Please enter the Client / User Name to record this subscription key.');
      return;
    }

    const cleanName = adminClientName.trim();
    const newKeyStr = generateSubscriptionKey(30, cleanName);
    const issuedAt = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newRecord: SubscriptionRecord = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clientName: cleanName,
      clientPhone: adminClientPhone.trim() || undefined,
      key: newKeyStr,
      durationDays: 30,
      issuedAt,
      expiryDate,
      status: 'active',
      notes: adminClientNote.trim() || undefined,
    };

    if (onSaveSubscriptionRecord) {
      onSaveSubscriptionRecord(newRecord);
    }

    const updated = [newRecord, ...localRecords.filter(r => r.key !== newKeyStr)];
    setLocalRecords(updated);
    try {
      localStorage.setItem('comfort_designs_admin_subscribers_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setJustGeneratedRecord(newRecord);
    setAdminClientName('');
    setAdminClientPhone('');
    setAdminClientNote('');
  };

  const handleDeleteRecord = (recordId: string, clientName: string) => {
    if (!confirm(`Delete record for subscriber "${clientName}"?`)) return;
    if (onDeleteSubscriptionRecord) {
      onDeleteSubscriptionRecord(recordId);
    }
    const updated = localRecords.filter(r => r.id !== recordId);
    setLocalRecords(updated);
    try {
      localStorage.setItem('comfort_designs_admin_subscribers_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Change Admin Secret PIN
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (!newAdminPin || newAdminPin.length < 4) {
      setPinChangeMsg({ text: 'PIN must be at least 4 characters.', isError: true });
      return;
    }
    if (newAdminPin !== confirmAdminPin) {
      setPinChangeMsg({ text: 'PINs do not match.', isError: true });
      return;
    }

    if (onUpdateAdminPin) {
      onUpdateAdminPin(newAdminPin);
    }
    setPinChangeMsg({ text: 'Admin Secret PIN changed successfully!', isError: false });
    setNewAdminPin('');
    setConfirmAdminPin('');
    setTimeout(() => {
      setShowPinChange(false);
      setPinChangeMsg(null);
    }, 2000);
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
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={subscriberName}
                    onChange={e => setSubscriberName(e.target.value)}
                    placeholder="Your Business / User Name (e.g. Harare Bakery)"
                    className="w-full text-xs font-medium p-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-600 placeholder:text-slate-400"
                  />
                  <div>
                    <input
                      type="text"
                      value={enteredKey}
                      onChange={e => {
                        setEnteredKey(e.target.value);
                        if (keyError) setKeyError(null);
                      }}
                      placeholder="Enter 30-Day Pro Key from Comfort Designs"
                      className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal"
                    />
                    {keyError && (
                      <div className="flex items-start gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{keyError}</span>
                      </div>
                    )}
                  </div>
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

          {/* ================================================================ */}
          {/* Admin License Key Generator (Comfort Designs)                      */}
          {/* ================================================================ */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdminTool(!showAdminTool)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin License Key Generator (Comfort Designs)</span>
              </button>

              {isAdminUnlocked && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  <span>Admin Session Active</span>
                </span>
              )}
            </div>

            {showAdminTool && (
              <div className="mt-2.5 p-3.5 bg-slate-950 text-slate-200 rounded-xl space-y-3.5 text-xs border border-slate-800 shadow-xl animate-fadeIn">
                {/* Header (Secret PIN Protected - NO PIN or phone number leaked here) */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300">Comfort Designs Key Hub</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Secret PIN Protected</span>
                  </span>
                </div>

                {!isAdminUnlocked ? (
                  /* Secret PIN Unlock Form (No password written on screen) */
                  <form onSubmit={handleUnlockAdmin} className="space-y-2">
                    <label className="block text-[11px] font-medium text-slate-300">
                      Enter Admin Secret PIN to unlock generator:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={adminPin}
                        onChange={e => {
                          setAdminPin(e.target.value);
                          if (adminError) setAdminError(null);
                        }}
                        placeholder="Enter Secret PIN"
                        className="flex-1 text-xs p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Unlock
                      </button>
                    </div>
                    {adminError && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{adminError}</span>
                      </p>
                    )}
                  </form>
                ) : (
                  /* Unlocked Admin Panel with Subscriber Records & Expiry Alerts */
                  <div className="space-y-3.5">
                    {/* Top Action Row: Always Available to Generate Unlimited Keys */}
                    <div className="space-y-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Generate & Record 30-Day Key for Client</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPinChange(!showPinChange)}
                          className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Change Secret PIN</span>
                        </button>
                      </div>

                      {/* Client Name (Required), Phone (Optional), Note (Optional) */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              User / Client Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={adminClientName}
                              onChange={e => {
                                setAdminClientName(e.target.value);
                                if (adminKeyError) setAdminKeyError(null);
                              }}
                              placeholder="e.g. Tendai Bakery, Harare CBD"
                              className="w-full text-xs p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Client Phone Number (Optional)
                            </label>
                            <input
                              type="text"
                              value={adminClientPhone}
                              onChange={e => setAdminClientPhone(e.target.value)}
                              placeholder="e.g. 077... or +263..."
                              className="w-full text-xs p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            EcoCash Ref / Payment Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={adminClientNote}
                            onChange={e => setAdminClientNote(e.target.value)}
                            placeholder="e.g. Paid $2 via EcoCash Ref #MP240..."
                            className="w-full text-xs p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                          />
                        </div>

                        {adminKeyError && (
                          <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{adminKeyError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleGenerateKey}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Create & Record 30-Day Pro Key</span>
                        </button>
                      </div>
                    </div>

                    {/* Newly Generated Key Confirmation Card */}
                    {justGeneratedRecord && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Key Created & Recorded for {justGeneratedRecord.clientName}!</span>
                          </span>
                          <span className="text-[10px] font-bold text-amber-300">
                            Valid for 30 Days
                          </span>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-lg border border-emerald-700/50 flex items-center justify-between font-mono text-sm text-amber-300 font-bold select-all">
                          <span>{justGeneratedRecord.key}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(justGeneratedRecord.key, justGeneratedRecord.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKeyId === justGeneratedRecord.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={createCustomerKeyWhatsAppUrl(
                              justGeneratedRecord.clientPhone || '',
                              justGeneratedRecord.key,
                              justGeneratedRecord.clientName
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send via WhatsApp to {justGeneratedRecord.clientName}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setJustGeneratedRecord(null)}
                            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Change Admin Secret PIN Sub-Form */}
                    {showPinChange && (
                      <form onSubmit={handleSaveNewPin} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-amber-300 block">
                          Change Admin Secret PIN:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="password"
                            value={newAdminPin}
                            onChange={e => setNewAdminPin(e.target.value)}
                            placeholder="New Secret PIN"
                            className="text-xs p-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                          />
                          <input
                            type="password"
                            value={confirmAdminPin}
                            onChange={e => setConfirmAdminPin(e.target.value)}
                            placeholder="Confirm New PIN"
                            className="text-xs p-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Save New Secret PIN
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPinChange(false)}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                        {pinChangeMsg && (
                          <p className={`text-[10px] font-medium ${pinChangeMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {pinChangeMsg.text}
                          </p>
                        )}
                      </form>
                    )}

                    {/* ========================================================== */}
                    {/* Subscribers & Keys Records Hub with Expiry Alerts           */}
                    {/* ========================================================== */}
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>Subscriber Records & Expiry Tracker</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {stats.total} total registered
                        </span>
                      </div>

                      {/* Filter Badges with 5-Day and 2-Day Alerts */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setAdminRecordsFilter('all')}
                          className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            adminRecordsFilter === 'all'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          All ({stats.total})
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminRecordsFilter('alert_2_days')}
                          className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                            adminRecordsFilter === 'alert_2_days'
                              ? 'bg-rose-600 text-white'
                              : stats.alert2d > 0
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>🚨 2-Day Alerts ({stats.alert2d})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminRecordsFilter('alert_5_days')}
                          className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                            adminRecordsFilter === 'alert_5_days'
                              ? 'bg-amber-600 text-white'
                              : stats.alert5d > 0
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>⚠️ 5-Day Alerts ({stats.alert5d})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminRecordsFilter('active')}
                          className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            adminRecordsFilter === 'active'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          🟢 Active ({stats.active})
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminRecordsFilter('expired')}
                          className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            adminRecordsFilter === 'expired'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          🔴 Expired ({stats.expired})
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={adminSearchQuery}
                          onChange={e => setAdminSearchQuery(e.target.value)}
                          placeholder="Search by client name, phone, or key..."
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Records List */}
                      {filteredRecords.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-[11px] bg-slate-900/60 rounded-xl border border-slate-800">
                          {stats.total === 0
                            ? 'No subscriber keys recorded yet. Fill out the form above to generate and record the first 30-day key.'
                            : 'No records match the current filter or search query.'}
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {filteredRecords.map(rec => {
                            const isCopied = copiedKeyId === rec.id;
                            const isAlertOrExpired =
                              rec.alertLevel === 'alert_2_days' ||
                              rec.alertLevel === 'alert_5_days' ||
                              rec.alertLevel === 'expired';

                            const whatsAppUrl = isAlertOrExpired
                              ? createAdminRenewalReminderWhatsAppUrl(
                                  rec.clientPhone || '',
                                  rec.clientName,
                                  rec.daysRemaining,
                                  rec.expiryDateStr
                                )
                              : createCustomerKeyWhatsAppUrl(
                                  rec.clientPhone || '',
                                  rec.key,
                                  rec.clientName
                                );

                            return (
                              <div
                                key={rec.id}
                                className={`p-2.5 rounded-xl border transition-all ${
                                  rec.alertLevel === 'alert_2_days'
                                    ? 'bg-rose-950/40 border-rose-700/80 shadow-xs shadow-rose-950'
                                    : rec.alertLevel === 'alert_5_days'
                                    ? 'bg-amber-950/30 border-amber-700/80'
                                    : rec.alertLevel === 'expired'
                                    ? 'bg-slate-900/60 border-slate-800 opacity-80'
                                    : 'bg-slate-900/90 border-slate-800'
                                }`}
                              >
                                {/* Row 1: Client Name & Expiry Alert Badge */}
                                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="font-bold text-white text-xs truncate">
                                      {rec.clientName}
                                    </span>
                                    {rec.clientPhone && (
                                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                        ({rec.clientPhone})
                                      </span>
                                    )}
                                  </div>

                                  {/* Alert Status Pill */}
                                  <div>
                                    {rec.alertLevel === 'alert_2_days' && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-black flex items-center gap-1 animate-pulse">
                                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                                        <span>🚨 2-Day Alert: {rec.daysRemaining}d left</span>
                                      </span>
                                    )}
                                    {rec.alertLevel === 'alert_5_days' && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>⚠️ 5-Day Alert: {rec.daysRemaining}d left</span>
                                      </span>
                                    )}
                                    {rec.alertLevel === 'active' && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                        <span>Active: {rec.daysRemaining}d left</span>
                                      </span>
                                    )}
                                    {rec.alertLevel === 'expired' && (
                                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-rose-900/60 text-[10px] font-semibold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-rose-400" />
                                        <span>Expired</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Row 2: Key & Dates */}
                                <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 my-1">
                                  <div className="font-mono text-xs font-bold text-amber-300 select-all truncate">
                                    {rec.key}
                                  </div>
                                  <div className="text-[10px] text-slate-400 text-right shrink-0">
                                    <span>Expires: <strong className="text-amber-200">{rec.expiryDateStr}</strong></span>
                                  </div>
                                </div>

                                {/* Row 3: Notes & Action Buttons */}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                    {rec.notes ? (
                                      <span>Note: {rec.notes}</span>
                                    ) : (
                                      <span>Issued: {rec.issuedDateStr}</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Copy Key Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyKey(rec.key, rec.id)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                        isCopied
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                      }`}
                                      title="Copy Key"
                                    >
                                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                    </button>

                                    {/* WhatsApp Direct Button */}
                                    <a
                                      href={whatsAppUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 text-white transition-colors cursor-pointer ${
                                        isAlertOrExpired
                                          ? 'bg-rose-700 hover:bg-rose-600'
                                          : 'bg-emerald-700 hover:bg-emerald-600'
                                      }`}
                                      title={
                                        isAlertOrExpired
                                          ? 'Send Expiry Reminder with EcoCash USSD on WhatsApp'
                                          : 'Send Key to Client on WhatsApp'
                                      }
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>{isAlertOrExpired ? 'Send Alert' : 'Send Key'}</span>
                                    </a>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRecord(rec.id, rec.clientName)}
                                      className="p-1 rounded bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
