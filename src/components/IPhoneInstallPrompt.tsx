import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IPhoneInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS Safari standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      // Show prompt if not already dismissed in this session
      const dismissed = sessionStorage.getItem('ios_install_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('ios_install_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-slate-900/95 text-white p-4 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md animate-slide-up max-w-md mx-auto">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 mt-0.5">
          🛒
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-sm text-white">Install App on iPhone</h4>
          <p className="text-slate-300">
            For native app experience with offline support:
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-1">
            <span>1. Tap Share</span>
            <Share className="w-3.5 h-3.5 inline" />
            <span>2. Tap "Add to Home Screen"</span>
            <PlusSquare className="w-3.5 h-3.5 inline" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPhoneInstallPrompt;
