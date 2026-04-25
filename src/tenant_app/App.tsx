import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
      verifyUser();
    }
  }, [currentUser, familyId, loading, signOut]);

  if (loading || verifying) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Verifying access...</div>;
  
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
