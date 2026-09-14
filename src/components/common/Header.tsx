import React, { useState, useEffect } from 'react';
import { Lock, Smartphone, Monitor, Crown, MapPin, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Business, AppSettings } from '../../types';
import { getSubscriptionStatus } from '../../utils/licenseKey';

interface HeaderProps {
  business: Business;
  settings: AppSettings;
  onToggleLock: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onOpenSettings: () => void;
  onOpenFlutterHub?: () => void;
  onTogglePremium: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  settings,
  onToggleLock,
  isPhoneFrame,
  onTogglePhoneFrame,
  onOpenSettings,
  onTogglePremium,
}) => {
  // Synchronized realtime device clock
  const [deviceTime, setDeviceTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDeviceTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = deviceTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = deviceTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const userLocation = business.location?.trim() || 'Harare CBD';
  const subStatus = getSubscriptionStatus(settings);
  const isAlert2d = subStatus.isPro && subStatus.daysRemaining <= 2 && !subStatus.isExpired;
  const isAlert5d = subStatus.isPro && subStatus.daysRemaining <= 5 && subStatus.daysRemaining > 2 && !subStatus.isExpired;

  return (
    <header className="bg-emerald-800 text-white px-3 py-2 shadow-md flex items-center justify-between select-none z-30 flex-wrap gap-2">
      {/* Left: Business Name & Recorded City/Town Location from Profile */}
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-base text-white shrink-0 shadow-inner">
          {business.name ? business.name.charAt(0).toUpperCase() : 'S'}
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="font-bold text-sm sm:text-base leading-tight truncate text-white">
              {business.name || 'SmartBiz Pocket'}
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-500/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              Offline
            </span>
          </div>

          {/* City / Town recorded in profile in settings */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 truncate mt-0.5">
            <button
              onClick={onOpenSettings}
              title="City/Town from profile in Settings (Tap to edit)"
              className="hover:text-white flex items-center gap-1 truncate transition-colors text-left"
            >
              <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
              <span className="truncate font-semibold text-emerald-100 underline decoration-dotted underline-offset-2">
                {userLocation}
              </span>
            </button>
            <span>•</span>
            <span className="truncate">
              {settings.currency} ({settings.currencySymbol})
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right: Synchronized Realtime Datestamp & Clock */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <div
          title="Synchronized with device time & date"
          className="bg-emerald-900/70 border border-emerald-600/50 rounded-lg px-2 sm:px-2.5 py-1 text-center font-mono shadow-xs flex items-center gap-1.5 sm:gap-2"
        >
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-200">
            <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-medium whitespace-nowrap">{formattedDate}</span>
          </div>
          <span className="text-emerald-500 text-xs hidden sm:inline">•</span>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white tracking-wider">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
            <span className="whitespace-nowrap">{formattedTime}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* RevenueCat Premium Toggle with 5-Day and 2-Day Expiry Alerts */}
          <button
            onClick={onTogglePremium}
            title={
              isAlert2d
                ? `🚨 CRITICAL: Pro Expires in ${subStatus.daysRemaining} days (${subStatus.expiryDateStr})`
                : isAlert5d
                ? `⚠️ NOTICE: Pro Expires in ${subStatus.daysRemaining} days (${subStatus.expiryDateStr})`
                : settings.isPremium
                ? `Premium Active (${subStatus.daysRemaining}d left)`
                : 'Free Tier (Tap to activate Pro)'
            }
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
              isAlert2d
                ? 'bg-rose-500 text-white font-black shadow-md animate-pulse border border-rose-300'
                : isAlert5d
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm border border-amber-300'
                : settings.isPremium
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60'
            }`}
          >
            {isAlert2d ? (
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
            ) : (
              <Crown className={`w-3.5 h-3.5 ${settings.isPremium ? 'fill-current' : ''}`} />
            )}
            <span className="hidden sm:inline">
              {isAlert2d
                ? `PRO (${subStatus.daysRemaining}d left)`
                : isAlert5d
                ? `PRO (${subStatus.daysRemaining}d)`
                : settings.isPremium
                ? 'PRO'
                : 'Free'}
            </span>
            <span className="sm:hidden">
              {isAlert2d ? `${subStatus.daysRemaining}d!` : isAlert5d ? `${subStatus.daysRemaining}d` : settings.isPremium ? 'PRO' : 'Free'}
            </span>
          </button>

          {/* Phone Frame Toggle */}
          <button
            onClick={onTogglePhoneFrame}
            title={isPhoneFrame ? 'Switch to Full Width View' : 'Switch to Android Phone Frame'}
            className="p-1.5 rounded-md hover:bg-emerald-700/80 text-emerald-100 transition-colors"
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* PIN Lock Toggle */}
          {settings.pinLockEnabled && (
            <button
              onClick={onToggleLock}
              title="Lock Application"
              className="p-1.5 rounded-md hover:bg-emerald-700/80 text-emerald-100 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
