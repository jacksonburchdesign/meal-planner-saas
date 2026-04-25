import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { WeeklyMealPlan } from '../types';
import { useTheme } from '../../context/ThemeContext';

export function useCurrentWeeklyMeals() {
  const [currentPlan, setCurrentPlan] = useState<WeeklyMealPlan | null>(null);
  const [nextPlan, setNextPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { familyId } = useTheme();

  useEffect(() => {
    if (!familyId) return;

    // Fetch up to 2 plans, ordered by start date descending (newest first)
    const q = query(
      collection(db, 'weeklyMeals'),
      where('familyId', '==', familyId),
      orderBy('startDate', 'desc'),
      limit(2) 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCurrentPlan(null);
        setNextPlan(null);
      } else {
        const plans = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WeeklyMealPlan));

        // Sort ascending by start date so the older one is current, newer one is next
        plans.sort((a, b) => a.startDate - b.startDate);

        if (plans.length === 1) {
          setCurrentPlan(plans[0]);
          setNextPlan(null);
        } else if (plans.length === 2) {
          setCurrentPlan(plans[0]);
          setNextPlan(plans[1]);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching weekly meals:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  return { currentPlan, nextPlan, loading };
}
