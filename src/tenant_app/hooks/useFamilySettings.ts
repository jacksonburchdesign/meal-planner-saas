import { useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useTenantData } from '../../context/TenantDataContext';
import { useTheme } from '../../context/ThemeContext';

export type SupportedThemeColor = 'teal' | 'rose' | 'orange' | 'purple' | 'emerald' | 'blue';

export interface FamilySettings {
  familyName: string;
  themeColor: string;
  iconUrl?: string;
  iconName?: string;
  stripeCustomerId?: string;
  authorizedEmails?: string[];
  demographics: {
    adults: number;
    children: number;
  };
  mealPreferences: {
    healthyMealsPerWeek: number;
    indulgentMealsPerWeek: number;
  };
}

const DEFAULT_SETTINGS: FamilySettings = {
  familyName: 'Our Family',
  themeColor: '#0097b2', // Using hex so the color-picker does not warn during initial loading frame
  iconUrl: '/meal-planner-logo.svg',
  iconName: 'Home',
  demographics: { adults: 2, children: 0 },
  mealPreferences: { healthyMealsPerWeek: 5, indulgentMealsPerWeek: 2 }
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

export function applyThemeVariables(themeOrHex: string) {
  const root = document.documentElement;

  if (THEME_MAP[themeOrHex as SupportedThemeColor]) {
    const palette = THEME_MAP[themeOrHex as SupportedThemeColor];
    // Legacy support: set the base variable based on the '500' weight
    root.style.setProperty('--tenant-color-primary', palette['500']);
    return;
  }

  // Set the core CSS variable. Tailwind v4's index.css will automatically calculate `--color-primary-50` through `700`.
  root.style.setProperty('--tenant-color-primary', themeOrHex);
}



export function useFamilySettings() {
  const { familySettings, familySettingsLoading } = useTenantData();
  const { familyId } = useTheme();

  const settings: FamilySettings = useMemo(() => {
    if (!familySettings) {
      const defaultColorHex = THEME_MAP[DEFAULT_SETTINGS.themeColor as SupportedThemeColor]?.['500'] || DEFAULT_SETTINGS.themeColor;
      return { ...DEFAULT_SETTINGS, themeColor: defaultColorHex };
    }

    let mappedColor = familySettings.theme?.primaryColor || familySettings.primaryColor || familySettings.themeColor || DEFAULT_SETTINGS.themeColor;
    if (THEME_MAP[mappedColor as SupportedThemeColor]) {
       mappedColor = THEME_MAP[mappedColor as SupportedThemeColor]['500'];
    }

    return {
      familyName: familySettings.familyName || familySettings.name || DEFAULT_SETTINGS.familyName,
      themeColor: mappedColor,
      iconUrl: familySettings.theme?.iconUrl || familySettings.iconUrl || DEFAULT_SETTINGS.iconUrl,
      iconName: familySettings.theme?.iconName || familySettings.iconName || DEFAULT_SETTINGS.iconName,
      stripeCustomerId: familySettings.stripeCustomerId || undefined,
      demographics: familySettings.demographics ? {
         adults: familySettings.demographics.adults !== undefined ? Number(familySettings.demographics.adults) : DEFAULT_SETTINGS.demographics.adults,
         children: familySettings.demographics.children !== undefined ? Number(familySettings.demographics.children) : DEFAULT_SETTINGS.demographics.children,
      } : DEFAULT_SETTINGS.demographics,
      mealPreferences: familySettings.mealPreferences ? {
         healthyMealsPerWeek: familySettings.mealPreferences.healthyMealsPerWeek !== undefined ? Number(familySettings.mealPreferences.healthyMealsPerWeek) : DEFAULT_SETTINGS.mealPreferences.healthyMealsPerWeek,
         indulgentMealsPerWeek: familySettings.mealPreferences.indulgentMealsPerWeek !== undefined ? Number(familySettings.mealPreferences.indulgentMealsPerWeek) : DEFAULT_SETTINGS.mealPreferences.indulgentMealsPerWeek,
      } : DEFAULT_SETTINGS.mealPreferences
    };
  }, [familySettings]);

  useEffect(() => {
    applyThemeVariables(settings.themeColor);
  }, [settings.themeColor]);

  const updateSettings = async (updates: Partial<FamilySettings>) => {
    if (updates.themeColor) {
      applyThemeVariables(updates.themeColor); // Optimistic UI
    }
    
    if (familyId) {
      // Map back to families schema for persistence
      const dbUpdates: any = {};
      if (updates.familyName !== undefined) dbUpdates.familyName = updates.familyName;
      if (updates.themeColor !== undefined) dbUpdates['theme.primaryColor'] = updates.themeColor;
      if (updates.iconUrl !== undefined) dbUpdates['theme.iconUrl'] = updates.iconUrl;
      if (updates.iconName !== undefined) dbUpdates['theme.iconName'] = updates.iconName;
      if (updates.demographics !== undefined) dbUpdates.demographics = updates.demographics;
      if (updates.mealPreferences !== undefined) dbUpdates.mealPreferences = updates.mealPreferences;
      
      await updateDoc(doc(db, 'families', familyId), dbUpdates);
    }
  };

  return { settings, loading: familySettingsLoading, updateSettings };
}
