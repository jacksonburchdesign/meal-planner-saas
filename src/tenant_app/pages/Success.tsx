import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Book, Cart, MagicWand } from 'iconoir-react';
import { useNavigate } from 'react-router-dom';

export function Success() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  // Briefly simulate a vault activation sequence (or eventually poll Firestore)
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/50 via-zinc-50 to-primary-50/50 opacity-80" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-100 flex flex-col relative z-10"
      >
        <div className="flex flex-col items-center text-center border-b border-zinc-100 pb-8 mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-10 h-10" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Payment Successful</h1>
          <p className="text-[16px] font-medium text-zinc-500 max-w-[280px] leading-relaxed">
            Your custom Family Meal Planner vault has been officially activated.
          </p>
        </div>

        <div className="flex flex-col gap-6 mb-10">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">What you can do now</h2>

          <div className="flex items-start gap-4 px-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <MagicWand className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-800 mb-1">AI-Assisted Scheduling</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Use the magic wand inside the calendar to let AI automatically pair main dishes with sides, or generate a full 7-day meal plan.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 px-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Book className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-800 mb-1">Import Any Recipe</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Paste the URL of any online recipe. The AI will instantly read the page, extract the ingredients, instructions, and save it to your private vault.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 px-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <Cart className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-800 mb-1">Automated Groceries</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Your shopping list dynamically generates itself based entirely on the recipes you've scheduled for the upcoming week.</p>
            </div>
          </div>
        </div>

        {ready ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-[56px] bg-zinc-900 text-white text-[16px] font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-xl shadow-zinc-900/10"
            >
              Enter your App
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </motion.div>
        ) : (
          <div className="w-full h-[56px] bg-zinc-100 rounded-2xl flex items-center justify-center">
            <span className="text-sm font-bold text-zinc-400 animate-pulse">Initializing vault...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
