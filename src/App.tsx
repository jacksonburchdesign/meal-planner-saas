import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMemo } from 'react';

// Storefront components
import LandingPage from './pages/storefront/LandingPage';
import Onboarding from './pages/storefront/Onboarding';
import AuthPage from './pages/storefront/AuthPage';
import PrivacyPolicy from './pages/storefront/PrivacyPolicy';
import TermsOfService from './pages/storefront/TermsOfService';
import StorefrontLayout from './layouts/StorefrontLayout';

// Tenant components
import TenantApp from './tenant_app/App';

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
    
    // Vercel deployment edge cases
    if (host.includes('vercel.app')) {
      // For Vercel previews, use localStorage to simulate subdomains
      return localStorage.getItem('previewTenant') || null;
    }
    
    // Production domain: mealhouse.app
    const domain = 'mealhouse.app';
    if (host === domain || host === `www.${domain}`) {
      return null;
    }
    
    // Fallback logic for IPs or unknown domains (e.g. 192.168.x.x)
    const isIpAddress = /^[0-9.]+$/.test(host);
    if (isIpAddress || host.split('.').length < 3) return null;

    // It's a subdomain!
    const subdomain = host.replace(`.${domain}`, '');
    return subdomain;
  };

  const subdomain = useMemo(() => getSubdomain(), []);

  if (!subdomain) {
    // Render Marketing & Onboarding Storefront
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Render Premium Tenant PWA
  return (
    <ThemeProvider subdomain={subdomain}>
      <TenantApp />
    </ThemeProvider>
  );
}

export default App;
