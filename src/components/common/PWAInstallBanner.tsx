import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Check if dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('smartbiz_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('smartbiz_pwa_dismissed', 'true');
  };

  // If already running as an installed standalone PWA, suppress banner
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else {
      // Fallback modal for desktop browsers / browsers without immediate prompt
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Top Floating / Sticky Install Prompt */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-3 py-2.5 shadow-lg border-b border-emerald-500/30 flex items-center justify-between gap-2.5 z-30 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                Install SmartBiz App
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold shrink-0">
                Offline Native
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate">
              Instant launch from home screen • Zero internet needed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? 'Installing...' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            title="Dismiss"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide Modal for iOS Safari / Desktop Manual Install */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-200">
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
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
            >
              Got it, continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};
