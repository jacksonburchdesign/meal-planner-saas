import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/common';
import { GoogleCircle } from 'iconoir-react';
import { motion } from 'framer-motion';

export function Login() {
  const { currentUser, signInWithGoogle, error } = useAuth();

  // If already logged in AND authorized, push them immediately to the Home page
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/50 via-zinc-50 to-primary-50/50 opacity-80" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-100 flex flex-col items-center text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-[28px] mb-6 overflow-hidden drop-shadow-xl">
          <img src="/icon.png" alt="Meal Vault" className="w-full h-full object-cover scale-[1.05]" />
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Family Meal Planner</h1>
        <p className="text-[15px] font-medium text-zinc-500 mb-8 max-w-[240px] leading-relaxed">
          Sign securely into the vault to plan recipes and view the grocery list.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 mb-6 bg-danger-50 border border-danger-100 text-danger-700 text-[14px] font-semibold rounded-2xl"
          >
            {error}
          </motion.div>
        )}

        <Button 
          variant="primary" 
          onClick={signInWithGoogle} 
          className="w-full h-[54px] text-[16px] !rounded-2xl shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
        >
          <GoogleCircle className="w-6 h-6 stroke-[2]" />
          Sign in with Google
        </Button>
        
        <p className="text-[12px] text-zinc-400 font-medium mt-6">
          Access heavily restricted to authorized family members.
        </p>
      </motion.div>
    </div>
  );
}
