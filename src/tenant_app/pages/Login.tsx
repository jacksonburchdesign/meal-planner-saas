import { useAuth } from '../contexts/AuthContext';
import { useFamilySettings } from '../hooks/useFamilySettings';
import { FloatingBackground } from '../../layouts/StorefrontLayout';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/common';
import { GoogleCircle } from 'iconoir-react';
import { motion } from 'framer-motion';

export function Login() {
  const { currentUser, signInWithGoogle, error } = useAuth();
  const { settings } = useFamilySettings();

  // If already logged in AND authorized, push them immediately to the Home page
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(var(--bg-app))]">
      <FloatingBackground />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-100 flex flex-col items-center text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-[28px] mb-6 overflow-hidden drop-shadow-xl flex items-center justify-center bg-white border border-zinc-100 p-2">
          <img src={settings.iconUrl || "/meal-planner-logo.svg"} alt="Meal Vault" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">{settings.familyName || 'Family Meal Planner'}</h1>
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
