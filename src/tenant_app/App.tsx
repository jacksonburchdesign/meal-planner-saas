import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
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
            <Route path="/success" element={<Success />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><TenantDataProvider><Home /></TenantDataProvider></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute><TenantDataProvider><AllRecipes /></TenantDataProvider></ProtectedRoute>} />
            <Route path="/recipes/:id" element={<ProtectedRoute><TenantDataProvider><RecipeDetails /></TenantDataProvider></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><TenantDataProvider><History /></TenantDataProvider></ProtectedRoute>} />
            <Route path="/ingredients" element={<ProtectedRoute><TenantDataProvider><Ingredients /></TenantDataProvider></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><TenantDataProvider><Connections /></TenantDataProvider></ProtectedRoute>} />
          </Routes>
          <PwaPrompt />
        </AppThemeWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
