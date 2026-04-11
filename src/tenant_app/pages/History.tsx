import { PageWrapper } from '../components/layout/PageWrapper';
import { Card, Badge } from '../components/common';
import { useRecipes } from '../hooks';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { MealHistoryLog } from '../types';
import { Clock } from 'iconoir-react';

export function History() {
  const [history, setHistory] = useState<MealHistoryLog[]>([]);
  const { recipes } = useRecipes();

  useEffect(() => {
    const q = query(
      collection(db, 'mealHistory'),
      orderBy('date', 'desc'),
      limit(30) // Roughly 1 month
    );
    
    return onSnapshot(q, snapshot => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealHistoryLog)));
    });
  }, []);

  return (
    <PageWrapper title="History">
      <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
        {history.length === 0 ? (
          <div className="text-center bg-white rounded-3xl border border-dashed border-zinc-200 p-8 flex flex-col items-center mt-4">
             <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-5 text-zinc-400">
                <Clock className="w-8 h-8 stroke-[1.5]" />
             </div>
             <p className="text-[15px] text-zinc-500 font-medium">No meal history yet.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
             {history.map(log => {
                const recipe = recipes.find(r => r.id === log.recipeId);
                const date = new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <Card key={log.id} className="flex flex-row items-center p-3 gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                       {recipe?.imageUrl ? (
                         <img src={recipe.imageUrl} alt={recipe?.title} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-lg grayscale filter opacity-70">🍲</span>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-[14.5px] leading-tight truncate text-zinc-900">{recipe?.title || 'Unknown Meal'}</h3>
                       <p className="text-[12.5px] text-zinc-500 font-medium mt-1">{date}</p>
                    </div>
                    <Badge variant={log.status === 'Made' ? 'success' : log.status === 'Skipped' ? 'danger' : 'warning'}>
                       {log.status === 'Made something else' ? 'Swapped' : log.status}
                    </Badge>
                  </Card>
                )
             })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
