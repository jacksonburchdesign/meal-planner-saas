import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export type SupportedThemeColor = 'teal' | 'rose' | 'orange' | 'purple' | 'emerald' | 'blue';

export interface FamilySettings {
  familyName: string;
  themeColor: SupportedThemeColor;
}

const DEFAULT_SETTINGS: FamilySettings = {
  familyName: 'Our Family',
  themeColor: 'teal'
};

const THEME_MAP: Record<SupportedThemeColor, Record<string, string>> = {
  teal: {
    '50': '#e5f5f7', '100': '#cceaf0', '200': '#99d5df', '300': '#66c0ce', '400': '#33aabd', '500': '#0097b2', '600': '#0087a0', '700': '#00758e'
  },
  rose: {
    '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c'
  },
  orange: {
    '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c'
  },
  purple: {
    '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9'
  },
  emerald: {
    '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857'
  },
  blue: {
    '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8'
  }
};

export function applyThemeVariables(theme: SupportedThemeColor) {
  const palette = THEME_MAP[theme] || THEME_MAP.teal;
  const root = document.documentElement;
  Object.keys(palette).forEach(key => {
    root.style.setProperty(`--color-primary-${key}`, palette[key]);
  });
}

export function useFamilySettings() {
  const [settings, setSettings] = useState<FamilySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<FamilySettings>;
        const merged = { ...DEFAULT_SETTINGS, ...data };
        setSettings(merged);
        applyThemeVariables(merged.themeColor);
      } else {
        // Initialize if doesn't exist
        setSettings(DEFAULT_SETTINGS);
        applyThemeVariables(DEFAULT_SETTINGS.themeColor);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateSettings = async (updates: Partial<FamilySettings>) => {
    // Optimistic application of theme
    if (updates.themeColor) {
      applyThemeVariables(updates.themeColor);
    }
    await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });
  };

  return { settings, loading, updateSettings };
}
