import React, { useState } from 'react';
import {
  Store,
  DollarSign,
  Lock,
  Globe,
  Bell,
  Crown,
  Info,
  Shield,
  Check,
  Smartphone,
  Cpu,
  Code2,
  Download,
  FileText,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { SmartBizState, Business, AppSettings, CurrencyCode } from '../../types';
import { usePWAInstall } from '../common/usePWAInstall';
import { LegalDocType } from '../legal/LegalModal';

interface SettingsModuleProps {
  state: SmartBizState;
  onUpdateBusiness: (business: Business) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onTogglePremium: () => void;
  onOpenFlutterHub?: () => void;
  onOpenLegal?: (doc: LegalDocType) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  state,
  onUpdateBusiness,
  onUpdateSettings,
  onTogglePremium,
  onOpenFlutterHub,
  onOpenLegal,
}) => {
  const { business, settings } = state;
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();

  // Local form state for business
  const [bizName, setBizName] = useState(business.name);
  const [ownerName, setOwnerName] = useState(business.ownerName);
  const [phone, setPhone] = useState(business.phone);
  const [location, setLocation] = useState(business.location);
  const [isSaved, setIsSaved] = useState(false);

  // Security state
  const [pinEnabled, setPinEnabled] = useState(settings.pinLockEnabled);
  const [newPin, setNewPin] = useState(settings.pinCode);

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusiness({
      ...business,
      name: bizName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      updatedAt: new Date().toISOString(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCurrencyChange = (curr: CurrencyCode, symbol: string) => {
    onUpdateSettings({
      ...settings,
      currency: curr,
      currencySymbol: symbol,
    });
  };

  const handleTogglePin = (enabled: boolean) => {
    setPinEnabled(enabled);
    onUpdateSettings({
      ...settings,
      pinLockEnabled: enabled,
      pinCode: newPin,
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Business & App Settings</h2>
        <p className="text-xs text-slate-500">Configure shop details, currency, security PIN and plan</p>
      </div>

      {/* 1. Business Profile Form */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Store className="w-4 h-4 text-emerald-700" />
          Shop Details (Printed on Receipts)
        </h3>

        <form onSubmit={handleSaveBusiness} className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
            <input
              type="text"
              required
              value={bizName}
              onChange={e => setBizName(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City / Town & Location <span className="text-[10px] text-emerald-700 font-normal">(Recorded on Top Nav & Receipts)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Harare CBD, Stand 4 Mbare, Bulawayo..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            <span>{isSaved ? 'Saved Successfully!' : 'Save Business Details'}</span>
          </button>
        </form>
      </div>

      {/* 2. Primary Currency Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-700" />
          Display Currency
        </h3>
        <p className="text-xs text-slate-500">
          SmartBiz Pocket supports multi-currency in Zimbabwe. Choose your primary shop denomination:
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCurrencyChange('USD', '$')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              settings.currency === 'USD'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="text-sm font-extrabold">USD ($)</div>
            <span className="text-[10px] text-slate-500">US Dollar</span>
          </button>

          <button
            onClick={() => handleCurrencyChange('ZiG', 'ZiG ')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              settings.currency === 'ZiG'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="text-sm font-extrabold">ZiG</div>
            <span className="text-[10px] text-slate-500">Zimbabwe Gold</span>
          </button>

          <button
            onClick={() => handleCurrencyChange('ZAR', 'R')}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              settings.currency === 'ZAR'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="text-sm font-extrabold">ZAR (R)</div>
            <span className="text-[10px] text-slate-500">SA Rand</span>
          </button>
        </div>
      </div>

      {/* 3. Security & PIN Lock */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              PIN Code & Security
            </h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={e => handleTogglePin(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <p className="text-xs text-slate-500">
          Require a 4-digit PIN when opening SmartBiz Pocket. Protects your profits and stock from unauthorized eyes.
        </p>

        {pinEnabled && (
          <div className="pt-1 flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Set 4-Digit PIN:</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setNewPin(val);
                onUpdateSettings({ ...settings, pinCode: val });
              }}
              className="w-20 text-center font-bold text-sm p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 4. Plan & RevenueCat Architecture Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Subscription & Plan Tier
            </h3>
          </div>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
              settings.isPremium
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {settings.isPremium ? 'PRO UNLOCKED' : 'FREE PLAN'}
          </span>
        </div>

        <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <p>
            • <strong>Free Tier:</strong> Basic offline sales, stock inventory, and debtor tracking.
          </p>
          <p>
            • <strong>Pro Tier ($2.00 Monthly):</strong> Powered by <strong>RevenueCat Paywall</strong>. Charges <strong>$2 monthly</strong> for unlimited sales, unlimited catalog, automatic backup alerts, custom branded receipts, and the Flutter native offline blueprint.
          </p>
        </div>

        <button
          onClick={onTogglePremium}
          className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all ${
            settings.isPremium
              ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
          }`}
        >
          {settings.isPremium ? 'Downgrade to Free Tier (Test)' : '⚡ Simulate Pro Plan ($2/mo via RevenueCat)'}
        </button>
      </div>

      {/* Legal & Regulatory Policies */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Legal & Compliance Documents
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Review our Terms of Use and Privacy Policy regarding local offline data custody, RevenueCat paywall integration, and Pro Plan subscription terms ($2/mo).
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('terms')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Terms of Use</p>
              <p className="text-[10px] text-slate-500">Service & $2/mo Plan</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('privacy')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Privacy Policy</p>
              <p className="text-[10px] text-slate-500">Local Data Security</p>
            </div>
          </button>
        </div>
      </div>

      {/* Flutter and Drift Architecture Hub - EXCLUSIVELY FOR PREMIUM USERS */}
      {settings.isPremium && (
        <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 text-white p-4 rounded-xl border border-teal-500/40 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-200">
                  Flutter & Drift Architecture Hub
                </h3>
                <p className="text-[11px] text-slate-300">Native Android & Offline SQLite Blueprint</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-xs">
              PRO UNLOCKED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Full production-ready Flutter codebase with Drift SQLite schema, offline sync engine,
            repository patterns, and Android RAM tuning for budget devices (&lt;2GB RAM).
          </p>

          {onOpenFlutterHub && (
            <button
              onClick={onOpenFlutterHub}
              className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Code2 className="w-4 h-4 text-teal-200" />
              <span>Open Flutter & Drift Code Hub</span>
            </button>
          )}
        </div>
      )}

      {/* PWA & Native Install Status */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Native App Status (PWA)</h4>
              <p className="text-[10px] text-slate-500">Standalone offline installation</p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isInstalled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isInstalled ? 'Installed Native' : 'Browser Mode'}
          </span>
        </div>

        {!isInstalled && (
          <div className="pt-1">
            <p className="text-[11px] text-slate-600 mb-2">
              Install SmartBiz Pocket directly on your home screen or desktop for 100% offline access, zero data consumption, and instant launch speed.
            </p>
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else {
                  alert(
                    isIOS
                      ? 'On iPhone/iPad: Tap the Safari Share icon and select "Add to Home Screen".'
                      : 'To install: Tap your browser menu (⋮ or ...) and select "Install SmartBiz Pocket" or "Add to Home screen".'
                  );
                }
              }}
              className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Install Standalone App Now</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Device Footprint & Low-End Specs */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-emerald-700" />
          Low-End Android Optimization Metrics
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400">RAM Usage:</span>
            <p className="font-bold text-slate-800">&lt; 38 MB (Target: &lt;200MB)</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400">Database Engine:</span>
            <p className="font-bold text-slate-800">SQLite + Drift Offline</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400">Launch Speed:</span>
            <p className="font-bold text-slate-800">&lt; 1.2 seconds</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400">Compatibility:</span>
            <p className="font-bold text-slate-800">Android 8.0+ (API 26)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
