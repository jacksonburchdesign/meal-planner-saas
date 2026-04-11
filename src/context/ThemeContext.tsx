import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

import { getFamilyBySubdomain } from '../services/firestore';

export function ThemeProvider({ subdomain, children }: { subdomain: string; children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeContextType>({
    primaryColor: '#3b82f6', // Default blue
    secondaryColor: '#10b981', // Default emerald
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const family = await getFamilyBySubdomain(subdomain);
        if (family && family.theme) {
          const newTheme = {
            primaryColor: family.theme.primaryColor || '#3b82f6',
            secondaryColor: family.theme.secondaryColor || '#10b981'
          };
          setTheme(newTheme);
          document.documentElement.style.setProperty('--tenant-color-primary', newTheme.primaryColor);
          document.documentElement.style.setProperty('--tenant-color-secondary', newTheme.secondaryColor);
        }
      } catch (err) {
        console.error("Failed to load theme", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadTheme();
  }, [subdomain]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading tenant...</div>;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
