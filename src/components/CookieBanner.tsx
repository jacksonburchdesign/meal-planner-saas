import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't accepted previously
    const hasAccepted = localStorage.getItem('mealhouse-cookie-consent');
    if (!hasAccepted) {
      // Delay slightly for presentation
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('mealhouse-cookie-consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none"
        >
          <div className="bg-[hsl(var(--bg-frame))]/95 backdrop-blur-xl border border-[hsl(var(--accent-h)_30%_80%)] rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 w-full max-w-4xl mx-auto pointer-events-auto">
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-[hsl(var(--text-primary))] font-medium text-[14px] leading-snug tracking-tight m-0">
                We use cookies to ensure you get the best experience on our app, securely retain your login sessions, and maximize application stability.
              </p>
            </div>

            <div className="flex shrink-0 w-full md:w-auto mt-2 md:mt-0 gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-[hsl(var(--cta-bg))] hover:opacity-90 text-[hsl(var(--bg-app))] font-bold py-2.5 px-6 rounded-full transition-all tracking-wide shadow-sm cursor-pointer whitespace-nowrap"
              >
                Accept All
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
