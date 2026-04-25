import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../tenant_app/services/firebase/config';
import { useTheme } from './ThemeContext';
import { useAuth } from '../tenant_app/contexts/AuthContext';
import type { Recipe, WeeklyMealPlan, AppNotification, FamilyConnection } from '../tenant_app/types';

interface TenantDataState {
  recipes: Recipe[];
  recipesLoading: boolean;
  
  currentPlan: WeeklyMealPlan | null;
  nextPlan: WeeklyMealPlan | null;
  weeklyMealsLoading: boolean;
  
  notifications: AppNotification[];
  notificationsLoading: boolean;

  connections: FamilyConnection[];
  sharedRecipesInbox: any[];
  connectionsLoading: boolean;
  
  familySettings: any | null;
  familySettingsLoading: boolean;
}

const TenantDataContext = createContext<TenantDataState | undefined>(undefined);

export function TenantDataProvider({ children }: { children: ReactNode }) {
  const { familyId } = useTheme();
  const { currentUser } = useAuth();
  
  const [isProvisioned, setIsProvisioned] = useState(false);
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  const [currentPlan, setCurrentPlan] = useState<WeeklyMealPlan | null>(null);
  const [nextPlan, setNextPlan] = useState<WeeklyMealPlan | null>(null);
  const [weeklyMealsLoading, setWeeklyMealsLoading] = useState(true);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [sharedRecipesInbox, setSharedRecipesInbox] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  
  const [familySettings, setFamilySettings] = useState<any | null>(null);
  const [familySettingsLoading, setFamilySettingsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !familyId) {
      setIsProvisioned(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      setIsProvisioned(docSnap.exists() && docSnap.data()?.familyId === familyId);
    });
    return () => unsub();
  }, [currentUser, familyId]);

  useEffect(() => {
    if (!familyId) {
      setRecipesLoading(false);
      setWeeklyMealsLoading(false);
      setNotificationsLoading(false);
      setConnectionsLoading(false);
      setFamilySettingsLoading(false);
      return;
    }

    // 4. Family Settings (Publicly readable for subdomain checking)
    const settingsUnsub = onSnapshot(
      doc(db, 'families', familyId),
      (docSnap) => {
        if (docSnap.exists()) {
          setFamilySettings({ id: docSnap.id, ...docSnap.data() });
        }
        setFamilySettingsLoading(false);
      },
      (error) => { console.error("Error fetching family settings:", error); setFamilySettingsLoading(false); }
    );

    // Wait for the user to be fully provisioned before querying private collections
    if (!isProvisioned) {
      return () => settingsUnsub();
    }


    // 1. Recipes
    const recipesUnsub = onSnapshot(
      query(collection(db, 'recipes'), where('familyId', '==', familyId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setRecipes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
        setRecipesLoading(false);
      },
      (error) => { console.error("Error fetching recipes:", error); setRecipesLoading(false); }
    );

    // 2. Weekly Meals
    const mealsUnsub = onSnapshot(
      query(collection(db, 'weeklyMeals'), where('familyId', '==', familyId), orderBy('startDate', 'desc'), limit(2)),
      (snapshot) => {
        if (snapshot.empty) {
          setCurrentPlan(null);
          setNextPlan(null);
        } else {
          const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyMealPlan));
          plans.sort((a, b) => a.startDate - b.startDate);
          setCurrentPlan(plans[0]);
          setNextPlan(plans.length > 1 ? plans[1] : null);
        }
        setWeeklyMealsLoading(false);
      },
      (error) => { console.error("Error fetching weekly meals:", error); setWeeklyMealsLoading(false); }
    );

    // 3. Notifications
    const notificationsUnsub = onSnapshot(
      query(collection(db, 'notifications'), where('familyId', '==', familyId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
        setNotificationsLoading(false);
      },
      (error) => { console.error("Error fetching notifications:", error); setNotificationsLoading(false); }
    );


    // 5. Connections
    const connectionsUnsub = onSnapshot(
      query(collection(db, 'familyConnections'), where('fromFamilyId', '==', familyId), where('status', '==', 'active')),
      (snapshot) => {
        setConnections(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FamilyConnection)));
        setConnectionsLoading(false);
      },
      (error) => { console.error("Error fetching connections:", error); setConnectionsLoading(false); }
    );

    // 6. Shared Recipes Inbox
    const sharedInboxUnsub = onSnapshot(
      query(collection(db, 'sharedRecipes'), where('targetFamilyId', '==', familyId), where('status', '==', 'pending')),
      (snapshot) => {
        setSharedRecipesInbox(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => { console.error("Error fetching shared inbox:", error); }
    );

    return () => {
      recipesUnsub();
      mealsUnsub();
      notificationsUnsub();
      settingsUnsub();
      connectionsUnsub();
      sharedInboxUnsub();
    };
  }, [familyId, isProvisioned]);

  return (
    <TenantDataContext.Provider value={{
      recipes, recipesLoading,
      currentPlan, nextPlan, weeklyMealsLoading,
      notifications, notificationsLoading,
      connections, sharedRecipesInbox, connectionsLoading,
      familySettings, familySettingsLoading
    }}>
      {children}
    </TenantDataContext.Provider>
  );
}

export function useTenantData() {
  const context = useContext(TenantDataContext);
  if (context === undefined) {
    throw new Error('useTenantData must be used within a TenantDataProvider');
  }
  return context;
}
