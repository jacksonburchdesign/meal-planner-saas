import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMemo } from 'react';

// Storefront components
import LandingPage from './pages/storefront/LandingPage';
import Onboarding from './pages/storefront/Onboarding';

// Tenant components
import TenantLayout from './components/layout/TenantLayout';
import TenantHomepage from './pages/tenant/Homepage';
import RecipeDirectory from './pages/tenant/RecipeDirectory';
import MealHistory from './pages/tenant/MealHistory';
import GroceryList from './pages/tenant/GroceryList';

// Providers
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const getSubdomain = () => {
    const host = window.location.hostname;
    // Handle localhost testing: family.localhost / localhost
    if (host.includes('localhost')) {
      const parts = host.split('.');
      return parts.length > 1 ? parts[0] : null; // matches 'family' from 'family.localhost'
    }
    
    // Production domain: mealhouse.app
    const domain = 'mealhouse.app';
    if (host === domain || host === `www.${domain}`) {
      return null;
    }
    
    // Fallback logic for IPs or unknown domains, consider it storefront
    if (host.split('.').length < 3) return null;

    const subdomain = host.replace(`.${domain}`, '');
    return subdomain;
  };

  const subdomain = useMemo(() => getSubdomain(), []);

  if (!subdomain) {
    // Render Marketing & Onboarding Storefront
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Render Tenant PWA
  return (
    <ThemeProvider subdomain={subdomain}>
      <BrowserRouter>
        <Routes>
          <Route element={<TenantLayout />}>
            <Route path="/" element={<TenantHomepage />} />
            <Route path="/recipes" element={<RecipeDirectory />} />
            <Route path="/history" element={<MealHistory />} />
            <Route path="/grocery" element={<GroceryList />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
