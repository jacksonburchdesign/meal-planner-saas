import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './services/firebase/config';
import { useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { AllRecipes } from './pages/AllRecipes';
import { History } from './pages/History';
import { Ingredients } from './pages/Ingredients';
import { RecipeDetails } from './pages/RecipeDetails';
import { Connections } from './pages/Connections';
import { Login } from './pages/Login';
import { Success } from './pages/Success';
import { PwaPrompt } from './components/pwa/PwaPrompt';
import { useFamilySettings } from './hooks';
import { TenantDataProvider } from '../context/TenantDataContext';

function AppThemeWrapper({ children }: { children: ReactNode }) {
  useFamilySettings(); // Mounts the theme listener dynamically
  return <>{children}</>;
}

function AppLoader({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-50 backdrop-blur-md">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="w-20 h-20 mb-8 drop-shadow-xl flex items-center justify-center"
      >
        <svg viewBox="0 0 1500 1500" fill="hsl(var(--cta-bg, 150 40% 45%))" className="w-full h-full drop-shadow-[0_0_15px_rgba(20,83,45,0.4)]">
           <path d="M 817.539062 73.03125 L 1266.914062 289.851562 C 1309.597656 310.449219 1340.582031 349.363281 1351.09375 395.574219 L 1461.101562 879.273438 C 1471.613281 925.492188 1460.515625 973.980469 1430.945312 1011.023438 L 1119.714844 1400.945312 C 1090.144531 1437.988281 1045.324219 1459.558594 997.929688 1459.558594 L 502.054688 1459.558594 C 454.65625 1459.558594 409.835938 1437.988281 380.269531 1400.945312 L 69.035156 1011.023438 C 39.46875 973.980469 28.371094 925.492188 38.882812 879.273438 L 148.890625 395.574219 C 159.402344 349.363281 190.386719 310.449219 233.070312 289.851562 L 682.445312 73.03125 C 725.121094 52.441406 774.863281 52.441406 817.539062 73.03125 Z" />
        </svg>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-[12px]"
      >
        {text}
      </motion.p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading, signOut } = useAuth();
  const location = useLocation();
  const { familyId } = useTheme();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (!currentUser || !familyId) {
        setVerifying(false);
        return;
      }
      
      const email = currentUser.email?.toLowerCase();
      if (!email) {
        await signOut();
        setVerifying(false);
        return;
      }

      // Fetch family settings once to check authorization
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const authEmails = familyDoc.data()?.authorizedEmails || [];
      
      if (!authEmails.includes(email)) {
         // Not authorized or revoked!
         await deleteDoc(doc(db, 'users', currentUser.uid)).catch(() => {});
         await signOut();
         setVerifying(false);
         return;
      }

      // They are authorized, ensure user doc exists
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || userDoc.data()?.familyId !== familyId) {
         await setDoc(userDocRef, {
            email: email,
            familyId: familyId,
            subscriptionTier: 'free'
         });
      }

      setVerifying(false);
    }
    
    if (!loading) {
      // Add artificial delay to make the loading transition smoother and prevent flashes
      const timeout = setTimeout(verifyUser, 800);
      return () => clearTimeout(timeout);
    }
  }, [currentUser, familyId, loading, signOut]);

  if (loading || verifying) return <AppLoader text="Verifying Access..." />;
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantDataProvider>
          <AppThemeWrapper>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/success" element={<Success />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><AllRecipes /></ProtectedRoute>} />
              <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetails /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            </Routes>
            <PwaPrompt />
          </AppThemeWrapper>
        </TenantDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
