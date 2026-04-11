import { useRecipe } from '../../hooks';
import { Card, CardContent, Badge, Button } from '../common';
import type { PlannedMeal } from '../../types';
import { Check, Xmark, Refresh, Hourglass, Plus } from 'iconoir-react';
import { useNavigate } from 'react-router-dom';

function MiniSideRecipeCard({ sideId }: { sideId: string }) {
  const { recipe, loading } = useRecipe(sideId);
  const navigate = useNavigate();

  if (loading) return <div className="h-[48px] bg-zinc-100 rounded-lg animate-pulse" />;
  if (!recipe) return null;

  return (
    <div 
       onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${recipe.id}`); }}
       className="flex items-center gap-3 bg-white border border-zinc-100 p-2 rounded-xl shadow-sm cursor-pointer hover:bg-zinc-50 hover:border-zinc-200 transition-all hover:-translate-y-0.5"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs">🥘</div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-[13px] font-bold text-zinc-900 truncate leading-tight">{recipe.title}</h4>
        <p className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold">Side Dish</p>
      </div>
    </div>
  );
}

interface MealCardProps {
  meal: PlannedMeal;
  dayNumber: number;
  onStatusChange: (mealId: string, newStatus: PlannedMeal['status']) => void;
  onAddSide?: (mealId: string) => void;
  onSwap?: (mealId: string) => void;
}

export function MealCard({ meal, dayNumber, onStatusChange, onAddSide, onSwap }: MealCardProps) {
  const { recipe, loading } = useRecipe(meal.recipeId);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-32 bg-zinc-100 flex items-center justify-center">
          <Hourglass className="animate-spin text-zinc-300 w-6 h-6" />
        </CardContent>
      </Card>
    );
  }

  if (!recipe) return null;

  return (
    <Card className="flex flex-col mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="flex items-start gap-4 p-4 cursor-pointer relative"
        onClick={() => navigate(`/recipes/${recipe.id}`)}
      >
        <div className="w-20 h-20 rounded-[18px] bg-primary-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-primary-900/5">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🍲</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <Badge variant={meal.status === 'Pending' ? 'primary' : meal.status === 'Made' ? 'success' : 'default'} className="mb-2 shadow-sm shadow-primary-500/10">
            Day {dayNumber} • {meal.status}
          </Badge>
          <div className="flex items-center gap-2 mb-1">
             {recipe.isHealthy ? (
                 <span className="text-[12px] bg-success-50 text-success-700 px-2 rounded font-bold border border-success-200/50">Healthy</span>
             ) : (
                 <span className="text-[12px] bg-danger-50 text-danger-700 px-2 rounded font-bold border border-danger-200/50">Indulgent</span>
             )}
             <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">{recipe.category}</span>
          </div>
          <h3 className="text-[17px] leading-tight font-bold text-zinc-900 tracking-tight pr-2">{recipe.title}</h3>
        </div>
      </div>
      
      {/* Side Dishes Sub-Grid */}
      <div className="px-4 pb-0 pt-1">
         <div className="p-3 bg-zinc-50/80 rounded-2xl border border-zinc-100/80 space-y-2">
           <div className="flex items-center justify-between pl-1">
              <p className="text-[11px] font-bold text-zinc-400 tracking-widest uppercase">Paired With</p>
              {meal.status === 'Pending' && onAddSide && (
                 <button onClick={(e) => { e.stopPropagation(); onAddSide(meal.id); }} className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center transition-colors">
                    <Plus className="w-3 h-3 mr-0.5 stroke-[3]" /> Add Side
                 </button>
              )}
           </div>
           
           {meal.sideIds && meal.sideIds.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               {meal.sideIds.map(sideId => <MiniSideRecipeCard key={sideId} sideId={sideId} />)}
             </div>
           ) : (
             <p className="text-[12px] text-zinc-400 italic pl-1">No sides paired yet.</p>
           )}
         </div>
      </div>
      
      {meal.status === 'Pending' && (
        <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-2">
          <Button variant="outline" className="px-1 text-xs! min-h-[40px] bg-zinc-50/50 hover:bg-zinc-100" onClick={(e) => { e.stopPropagation(); onStatusChange(meal.id, 'Skipped'); }}>
             <Xmark className="w-4 h-4 mr-1 hover:stroke-danger-500 stroke-[2.5]" />
             Skip
          </Button>
          <Button variant="outline" className="px-1 text-xs! min-h-[40px] bg-zinc-50/50 hover:bg-zinc-100" onClick={(e) => { e.stopPropagation(); onSwap?.(meal.id); }}>
             <Refresh className="w-4 h-4 mr-1 stroke-[2.5]" />
             Swap
          </Button>
          <Button variant="primary" className="px-1 text-xs! min-h-[40px] shadow-md shadow-primary-500/20" onClick={(e) => { e.stopPropagation(); onStatusChange(meal.id, 'Made'); }}>
             <Check className="w-4 h-4 mr-1 stroke-[3]" />
             Made it
          </Button>
        </div>
      )}
    </Card>
  );
}
