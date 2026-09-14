import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installing, setInstalling] = useState(false);

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
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-inner border-b border-emerald-600/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>Install SmartBiz Pocket</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 font-semibold">
                Offline
              </span>
            </div>
            <p className="text-[10px] text-emerald-100/90 truncate">
              Add to your phone for instant, data-free access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="px-2.5 py-1 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3 h-3 stroke-[2.5]" />
            <span>{installing ? 'Installing...' : 'Install'}</span>
          </button>
          <button
            onClick={handleDismiss}
            title="Dismiss"
            className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
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
