import { useState, useEffect } from 'react';
import { collection, doc, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { Recipe } from '../types';
import { useTheme } from '../../context/ThemeContext';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { familyId } = useTheme();

  useEffect(() => {
    if (!familyId) return;

    const q = query(collection(db, 'recipes'), where('familyId', '==', familyId), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedRecipes = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Recipe[];
      
      setRecipes(parsedRecipes);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recipes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { recipes, loading };
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
