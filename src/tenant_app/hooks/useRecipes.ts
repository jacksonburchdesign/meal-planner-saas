import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useTenantData } from '../../context/TenantDataContext';
import type { Recipe } from '../types';

export function useRecipes() {
  const { recipes, recipesLoading } = useTenantData();
  return { recipes, loading: recipesLoading };
}

export function useRecipe(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  
  useEffect(() => {
    if (!id) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'recipes', id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setRecipe({ id: docSnapshot.id, ...docSnapshot.data() } as Recipe);
      } else {
        setRecipe(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  return { recipe, loading };
}
