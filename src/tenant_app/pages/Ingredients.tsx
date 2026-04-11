import { useMemo, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useCurrentWeeklyMeals, useRecipes } from '../hooks';
import { Check } from 'iconoir-react';
import type { PlannedMeal } from '../types';

export function Ingredients() {
  const { currentPlan, loading: loadingPlan } = useCurrentWeeklyMeals();
  const { recipes, loading: loadingRecipes } = useRecipes();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const shoppingList = useMemo(() => {
    if (!currentPlan || recipes.length === 0) return [];
    
    // Get all recipeIds and sideIds from active meals
    const activeMeals = currentPlan.meals.filter((m: PlannedMeal) => m.status === 'Pending' || m.status === 'Made');
    const allRecipeIds = activeMeals.flatMap((m: PlannedMeal) => [m.recipeId, ...(m.sideIds || [])]);
      
    const activeRecipes = recipes.filter(r => allRecipeIds.includes(r.id!));
    
    const aggregated: Record<string, { 
      name: string; 
      recipeIds: Set<string>; 
      amountsByUnit: Record<string, { amount: number, displayUnit: string }>; 
    }> = {};
    
    activeRecipes.forEach(recipe => {
      // Also grab sides if needed, but currentPlan.meals only lists entry recipeIds if they don't have a sideIds array?
      // Wait, in Home.tsx we see currentPlan.meals have recipeId AND sideIds.
      // activeRecipes currently only maps: m => m.recipeId.
      // Let's make sure we include side recipes too so the shopping list is accurate.
      // We will do that in the activeRecipes filter update below.
      recipe.ingredients?.forEach(ing => {
        const lowerName = (ing.name || 'Unnamed Ingredient').toLowerCase().trim();
        const displayUnit = (ing.unit || '').trim();
        const unitKey = displayUnit.toLowerCase();
        const amount = Number(ing.amount) || 1;
        
        if (!aggregated[lowerName]) {
          aggregated[lowerName] = { 
            name: ing.name || 'Unnamed Ingredient', 
            recipeIds: new Set(), 
            amountsByUnit: {} 
          };
        }
        
        aggregated[lowerName].recipeIds.add(recipe.id!);
        
        if (!aggregated[lowerName].amountsByUnit[unitKey]) {
          aggregated[lowerName].amountsByUnit[unitKey] = { amount: 0, displayUnit };
        }
        aggregated[lowerName].amountsByUnit[unitKey].amount += amount;
      });
    });

    return Object.values(aggregated).map((data) => {
      const amountsStr = Object.values(data.amountsByUnit).map(u => {
        return u.displayUnit ? `${u.amount} ${u.displayUnit}` : `${u.amount}`;
      }).join(' + ');

      return {
        key: data.name.toLowerCase(),
        name: data.name,
        amountDisplay: amountsStr,
        recipeCount: data.recipeIds.size
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentPlan, recipes]);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PageWrapper title="Shopping List">
      <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
        {loadingPlan || loadingRecipes ? (
           <p className="text-zinc-500 text-center font-medium py-8">Calculating list...</p>
        ) : shoppingList.length === 0 ? (
           <div className="text-center py-12">
             <p className="text-zinc-500 font-medium">Your shopping list is empty.</p>
           </div>
        ) : (
          <div className="bg-white rounded-3xl p-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-zinc-100">
            {shoppingList.map((item) => {
              const isChecked = !!checkedItems[item.key];
              return (
                <div 
                  key={item.key} 
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors active:scale-[0.98] ${isChecked ? 'opacity-50 grayscale' : 'hover:bg-zinc-50'}`}
                  onClick={() => toggleCheck(item.key)}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors flex-shrink-0 ${isChecked ? 'bg-primary-500 border-primary-500' : 'border-zinc-300 bg-white'}`}>
                    {isChecked && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15.5px] font-semibold tracking-tight transition-all ${isChecked ? 'text-zinc-400 line-through' : 'text-zinc-900'} capitalize`}>
                      {item.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end justify-center">
                    <span className={`text-[14px] font-bold ${isChecked ? 'text-zinc-400' : 'text-zinc-700'}`}>
                      {item.amountDisplay}
                    </span>
                    <span className={`text-[11px] font-semibold mt-0.5 ${isChecked ? 'text-zinc-300' : 'text-primary-500'}`}>
                      used in {item.recipeCount} recipe{item.recipeCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
