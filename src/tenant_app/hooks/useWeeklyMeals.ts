import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { WeeklyMealPlan } from '../types';
import { useTheme } from '../../context/ThemeContext';

export function useCurrentWeeklyMeals() {
  const [currentPlan, setCurrentPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { familyId } = useTheme();

  useEffect(() => {
    if (!familyId) return;

    // Sort by start date, trying to find the active week
    const q = query(
      collection(db, 'weeklyMeals'),
      where('familyId', '==', familyId),
      orderBy('startDate', 'desc'),
      limit(1) // Assuming the most recent one generated is the active one for MVP simplicity
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCurrentPlan(null);
      } else {
        const doc = snapshot.docs[0];
        setCurrentPlan({
          id: doc.id,
          ...doc.data()
        } as WeeklyMealPlan);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching weekly meals:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { currentPlan, loading };
}
