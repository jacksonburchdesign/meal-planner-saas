import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { AllRecipes } from './pages/AllRecipes';
import { History } from './pages/History';
import { Ingredients } from './pages/Ingredients';
import { RecipeDetails } from './pages/RecipeDetails';
import { Login } from './pages/Login';
import { PwaPrompt } from './components/pwa/PwaPrompt';
import { useFamilySettings } from './hooks';

function AppThemeWrapper({ children }: { children: ReactNode }) {
  useFamilySettings(); // Mounts the theme listener dynamically
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppThemeWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute><AllRecipes /></ProtectedRoute>} />
            <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetails /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
          </Routes>
          <PwaPrompt />
        </AppThemeWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
