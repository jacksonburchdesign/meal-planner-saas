import { useState, useEffect } from 'react';
import { Download, Xmark } from 'iconoir-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  const initialIosState = () => {
    if (typeof window === 'undefined') return false;
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone?: boolean }).standalone;
    return Boolean(isIos && !isStandalone && localStorage.getItem('pwa-dismissed') !== 'true');
  };

  const [showPrompt, setShowPrompt] = useState(initialIosState);
  const [isIosPrompt] = useState(initialIosState);

  useEffect(() => {
    // 1. Android/Chrome Native Interception
    const handleBeforeInstallPrompt = (e: Event) => {
      // STRICTLY limit to mobile browsers. Do not prompt on Desktop Chrome.
      const isMobile = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
      if (!isMobile) return;

      e.preventDefault(); // Prevent native mini-infobar
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Only show if they haven't explicitly dismissed it recently
      if (localStorage.getItem('pwa-dismissed') !== 'true') {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 sm:pb-6 animate-in slide-in-from-bottom-5 duration-500 ease-out">
      <div className="mx-auto max-w-sm bg-[hsl(var(--bg-frame))]/95 backdrop-blur-xl border border-[hsl(var(--accent-h)_30%_80%)] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative">
        <button 
           onClick={handleDismiss}
           className="absolute top-4 right-4 p-1.5 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
        >
          <Xmark className="w-4 h-4 stroke-[2.5]" />
        </button>
        
        <div className="flex items-center gap-4">
          <img src="/meal-planner-logo.svg" alt="App Icon" className="w-14 h-14 rounded-2xl shadow-lg border border-black/5 object-contain bg-white" />
          <div>
            <h3 className="text-[hsl(var(--text-primary))] font-bold text-[17px] tracking-tight">Install MealHouse</h3>
            <p className="text-[hsl(var(--text-secondary))] font-medium text-[13.5px] leading-snug mt-0.5 pr-6">
              {isIosPrompt 
                ? "Tap the Share button below and select 'Add to Home Screen' for the native app experience."
                : "Add the app directly to your home screen for fast, native offline access."}
            </p>
          </div>
        </div>

        {!isIosPrompt && (
           <button 
             onClick={handleInstallClick}
             className="w-full bg-[hsl(var(--cta-bg))] hover:bg-[hsl(var(--cta-bg))]/90 text-[hsl(var(--bg-app))] font-bold py-3 md:py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 mt-1 cursor-pointer tracking-wide"
           >
             <Download className="w-5 h-5 stroke-[2.5]" />
             Add to Home Screen
           </button>
        )}
      </div>
    </div>
  );
}
