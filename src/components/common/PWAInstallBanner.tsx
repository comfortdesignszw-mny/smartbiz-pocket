import React, { useState, useEffect, useRef } from 'react';
import { Download, Smartphone, X, Check, Share, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60); // 1 minute auto-dismiss

  const promptRef = useRef<HTMLDivElement>(null);

  // Check if previously dismissed
  useEffect(() => {
    const sessionDismissed = sessionStorage.getItem('smartbiz_pwa_dismissed');
    const localDismissed = localStorage.getItem('smartbiz_pwa_prompt_dismissed');
    if (sessionDismissed === 'true' || localDismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('smartbiz_pwa_dismissed', 'true');
    localStorage.setItem('smartbiz_pwa_prompt_dismissed', 'true');
  };

  // 1-minute (60 seconds) countdown timer to close automatically
  useEffect(() => {
    if (isInstalled || isDismissed) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isInstalled, isDismissed]);

  // Touch or click outside listener to dismiss instantly
  useEffect(() => {
    if (isInstalled || isDismissed) return;

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (promptRef.current && !promptRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [isInstalled, isDismissed]);

  // Suppress banner if installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Outside Click / Touch Overlay Backdrop */}
      <div
        onClick={handleDismiss}
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[1px] flex items-start justify-center pt-3 sm:pt-4 px-3 pointer-events-auto animate-in fade-in duration-200"
      >
        {/* The Green Prompt Message Box (stops propagation so tapping inside does NOT dismiss) */}
        <div
          ref={promptRef}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-2xl shadow-2xl border-2 border-emerald-500/50 p-3.5 sm:p-4 relative overflow-hidden animate-in slide-in-from-top-4 duration-300"
        >
          {/* Subtle Top Ambient Glow & 60s Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-950/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsRemaining / 60) * 100}%` }}
            />
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1">
                    <span>Install SmartBiz Pocket</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold uppercase tracking-wider">
                    100% Offline App
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                  Launch instantly from your home screen with zero internet or data consumption.
                </p>
              </div>
            </div>

            {/* Instant Dismiss Button */}
            <button
              onClick={handleDismiss}
              title="Close prompt"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row & Timer Indicator */}
          <div className="mt-3 pt-2.5 border-t border-emerald-800/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                Closes in <strong className="text-amber-300 font-mono font-bold">{secondsRemaining}s</strong> • Tap outside to close
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[3]" />
                <span>{installing ? 'Opening...' : 'Install Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal for iOS Safari / Desktop Manual Install */}
      {showIOSModal && (
        <div
          onClick={() => setShowIOSModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  S
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isIOS ? 'Install on iPhone / iPad' : 'Add to Home Screen'}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {isIOS ? (
                <>
                  <p className="font-medium text-slate-600">
                    To install SmartBiz Pocket as a standalone app on iOS:
                  </p>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </div>
                      <p>
                        Tap the <strong>Share</strong> icon{' '}
                        <Share className="w-3.5 h-3.5 inline text-sky-600" /> in Safari's bottom
                        toolbar.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </div>
                      <p>
                        Scroll down and tap <strong>"Add to Home Screen"</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </div>
                      <p>
                        Tap <strong>Add</strong> in the top-right corner.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-slate-600">
                    Install on your browser or device for desktop & mobile:
                  </p>
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Look for the <strong>Install App</strong> icon in your browser's address bar
                        (right side) or tap the browser menu (⋮) and choose{' '}
                        <strong>Install SmartBiz Pocket</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Works 100% offline without using any of your mobile bundle.</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Got it, continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};
