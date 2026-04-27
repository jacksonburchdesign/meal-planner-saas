import { useMemo, useState, useCallback } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useCurrentWeeklyMeals, useRecipes } from '../hooks';
import { Check, Plus } from 'iconoir-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import type { PlannedMeal, WeeklyMealPlan, Ingredient } from '../types';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase/config';

const getCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (n.match(/apple|banana|carrot|onion|garlic|tomato|potato|lettuce|spinach|berry|berries|lemon|lime|pepper|cilantro|parsley|basil|mushroom|broccoli|celery|avocado/)) return 'Produce';
  if (n.match(/chicken|beef|pork|fish|salmon|shrimp|bacon|sausage|meat|steak|turkey/)) return 'Meat & Seafood';
  if (n.match(/milk|cheese|butter|egg|yogurt|cream|parmesan|mozzarella|cheddar/)) return 'Dairy & Eggs';
  if (n.match(/oil|salt|pepper|sugar|flour|rice|pasta|noodle|soy sauce|vinegar|broth|stock|spice|cumin|paprika|cinnamon|vanilla|honey|maple|nut|bean|lentil|can|sauce/)) return 'Pantry';
  return 'Other';
};

export function Ingredients() {
  const { currentPlan, nextPlan, loading: loadingPlan } = useCurrentWeeklyMeals();
  const { recipes, loading: loadingRecipes } = useRecipes();
  const { primaryColor } = useTheme();
  const [quickAddText, setQuickAddText] = useState('');

  const buildShoppingList = useCallback((plan: WeeklyMealPlan | null) => {
    if (!plan || recipes.length === 0) return [];
    
    // Get all recipeIds and sideIds from active meals
    const activeMeals = plan.meals.filter((m: PlannedMeal) => m.status === 'Pending' || m.status === 'Made');
    const allRecipeIds = activeMeals.flatMap((m: PlannedMeal) => [m.recipeId, ...(m.sideIds || [])]);
      
    const activeRecipes = recipes.filter(r => allRecipeIds.includes(r.id!));
    
    const aggregated: Record<string, { 
      name: string; 
      recipeIds: Set<string>; 
      amountsByUnit: Record<string, { amount: number, displayUnit: string }>; 
    }> = {};
    
    activeRecipes.forEach(recipe => {
      recipe.ingredients?.forEach((ing: Ingredient) => {
        const lowerName = (ing.name || 'Unnamed Ingredient').toLowerCase().trim();
        const rawUnit = (ing.unit || '').trim().toLowerCase();
        const amount = Number(ing.amount) || 1;
        
        let unitKey = rawUnit;
        const nonPlurals = ['glass', 'mass', 'grass', 'lbs', 'oz', 'ozs', 'fluid ounces', 'fluid ounce', 'fl oz', 'fl ozs', 'tbsp', 'tsp', 'g', 'kg', 'mg', 'ml', 'l'];
        if (!nonPlurals.includes(unitKey)) {
          if (unitKey.endsWith('es') && (unitKey.endsWith('ches') || unitKey.endsWith('shes') || unitKey.endsWith('oes') || unitKey.endsWith('xes'))) {
            unitKey = unitKey.slice(0, -2);
          } else if (unitKey.endsWith('s')) {
            unitKey = unitKey.slice(0, -1);
          }
        }
        
        if (unitKey === 'tbsp') unitKey = 'tablespoon';
        if (unitKey === 'tsp') unitKey = 'teaspoon';
        
        if (!aggregated[lowerName]) {
          aggregated[lowerName] = { 
            name: ing.name || 'Unnamed Ingredient', 
            recipeIds: new Set(), 
            amountsByUnit: {} 
          };
        }
        
        aggregated[lowerName].recipeIds.add(recipe.id!);
        
        if (!aggregated[lowerName].amountsByUnit[unitKey]) {
          aggregated[lowerName].amountsByUnit[unitKey] = { amount: 0, displayUnit: unitKey };
        }
        aggregated[lowerName].amountsByUnit[unitKey].amount += amount;
      });
    });

    return Object.values(aggregated).map((data) => {
      const amountsStr = Object.values(data.amountsByUnit).map(u => {
        if (!u.displayUnit) return `${u.amount}`;
        let finalUnit = u.displayUnit;
        if (u.amount > 1) {
           if (finalUnit.endsWith('ch') || finalUnit.endsWith('sh') || finalUnit.endsWith('o') || finalUnit.endsWith('x')) {
             finalUnit += 'es';
           } else if (!finalUnit.endsWith('s') && !['oz', 'g', 'kg', 'mg', 'ml', 'l', 'lbs'].includes(finalUnit)) {
             finalUnit += 's';
           }
        }
        return `${u.amount} ${finalUnit}`;
      }).join(' + ');

      return {
        key: data.name.toLowerCase(),
        name: data.name,
        amountDisplay: amountsStr,
        recipeCount: data.recipeIds.size,
        category: getCategory(data.name)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes]);

  const shoppingListCurrent = useMemo(() => buildShoppingList(currentPlan), [currentPlan, buildShoppingList]);
  const shoppingListNext = useMemo(() => buildShoppingList(nextPlan), [nextPlan, buildShoppingList]);

  const [activeTab, setActiveTab] = useState<'current' | 'next'>('current');
  const activeShoppingList = activeTab === 'current' ? shoppingListCurrent : shoppingListNext;
  const activePlan = activeTab === 'current' ? currentPlan : nextPlan;

  const checkedKeys = activePlan?.shoppingList?.checkedKeys || [];
  const checkedItems = useMemo(() => {
    const map: Record<string, boolean> = {};
    checkedKeys.forEach(k => map[k] = true);
    return map;
  }, [checkedKeys]);

  const clearedKeys = useMemo(() => new Set(activePlan?.shoppingList?.clearedKeys || []), [activePlan?.shoppingList?.clearedKeys]);
  const customItems = activePlan?.shoppingList?.customItems || [];

  const mergedShoppingList = useMemo(() => {
    const combined = [...activeShoppingList, ...customItems];
    return combined.filter(item => !clearedKeys.has(item.key));
  }, [activeShoppingList, customItems, clearedKeys]);

  const groupedList = useMemo(() => {
    const grouped = mergedShoppingList.reduce((acc, item) => {
      const cat = item.category === 'Other' && item.recipeCount === 0 ? 'Household' : item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, typeof mergedShoppingList>);

    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => {
        const aChecked = checkedItems[a.key] ? 1 : 0;
        const bChecked = checkedItems[b.key] ? 1 : 0;
        if (aChecked !== bChecked) return aChecked - bChecked;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [mergedShoppingList, checkedItems]);

  const toggleCheck = async (key: string) => {
    if (!activePlan?.id) return;
    const isChecked = checkedItems[key];
    const docRef = doc(db, 'weeklyMeals', activePlan.id);
    
    await setDoc(docRef, {
      shoppingList: {
        checkedKeys: isChecked ? arrayRemove(key) : arrayUnion(key)
      }
    }, { merge: true });
  };

  const clearCompleted = async () => {
    if (!activePlan?.id) return;
    const keysToClear = mergedShoppingList.filter(item => checkedItems[item.key]).map(i => i.key);
    if (keysToClear.length === 0) return;
    
    const docRef = doc(db, 'weeklyMeals', activePlan.id);
    await setDoc(docRef, {
      shoppingList: {
        clearedKeys: arrayUnion(...keysToClear)
      }
    }, { merge: true });
    
    // We optionally remove them from checkedKeys as well, but it's not strictly necessary since they're filtered out.
    // However, for cleanliness, we can let them stay in checkedKeys or remove them. We'll leave them to save writes.
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim() || !activePlan?.id) return;
    const name = quickAddText.trim();
    const newItem = {
      key: `custom_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name,
      amountDisplay: '1',
      recipeCount: 0,
      category: getCategory(name)
    };
    
    const docRef = doc(db, 'weeklyMeals', activePlan.id);
    await setDoc(docRef, {
      shoppingList: {
        customItems: arrayUnion(newItem)
      }
    }, { merge: true });
    
    setQuickAddText('');
  };

  const totalItems = mergedShoppingList.length;
  const collectedItems = mergedShoppingList.filter(item => checkedItems[item.key]).length;
  const progressPercent = totalItems === 0 ? 0 : (collectedItems / totalItems) * 100;

  return (
    <PageWrapper title="Shopping List">
      <div className="space-y-6">
        {nextPlan && (
          <div className="flex bg-zinc-100 p-1 rounded-2xl mb-6">
            <button 
              className={`flex-1 py-2 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'current' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('current')}
            >
              This Week
            </button>
            <button 
              className={`flex-1 py-2 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'next' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('next')}
            >
              Next 7 Days
            </button>
          </div>
        )}

        {loadingPlan || loadingRecipes ? (
           <p className="text-zinc-500 text-center font-medium py-8">Calculating list...</p>
        ) : mergedShoppingList.length === 0 ? (
           <div className="text-center py-12">
             <p className="text-zinc-500 font-medium">Your shopping list for this period is empty.</p>
           </div>
        ) : (
          <>
            {/* The Invisible Masking Canopy (Visible only on scroll) */}
            <div 
              className="sticky z-20 w-[100vw] left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
                height: '48px',
                marginTop: '26px',
                marginBottom: '-74px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 30%, rgba(255,255,255,0))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            <div 
              className="sticky z-40 h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner ring-1 ring-stone-200/50 pointer-events-none"
              style={{ 
                top: 'calc(3.5rem + env(safe-area-inset-top, 0px) + 19px)',
                marginTop: '52px',
                marginBottom: '-62px',
                width: 'calc(100% - 40px)',
                marginLeft: '20px'
              }}
            >
              <div 
                className="h-full transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${progressPercent}%`, backgroundColor: primaryColor || '#3b82f6' }} 
              />
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-3xl px-5 h-[78px] flex flex-col justify-start pt-4 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-stone-900/5 relative z-30">
              <div className="flex items-center justify-between">
                <p className="text-[17px] font-bold text-stone-800">Shopping Progress</p>
                <p className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">{collectedItems} / {totalItems}</p>
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-stone-900/5 px-5 h-[78px] flex items-center gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Add household item..." 
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                className="flex-1 bg-transparent border-none text-stone-800 placeholder-stone-400 focus:ring-0 px-3 outline-none"
              />
              <button 
                type="submit" 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-100 text-stone-400"
                style={quickAddText.trim() ? { color: primaryColor || '#3b82f6' } : {}}
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

            <div className="space-y-6">
              {Object.entries(groupedList).map(([cat, items]) => (
                <div key={cat} className="bg-white rounded-3xl shadow-sm ring-1 ring-stone-900/5 flex flex-col relative">
                  <h2 
                    className="sticky z-20 bg-white/95 backdrop-blur-xl py-4 px-5 text-[17px] font-bold text-stone-800 rounded-t-3xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b border-stone-100 ring-1 ring-stone-900/5"
                    style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px) + 48px)' }}
                  >
                    {cat}
                    <div className="absolute left-0 right-0 top-full h-6 bg-gradient-to-b from-white to-transparent pointer-events-none opacity-95" />
                  </h2>
                  <div className="flex flex-col px-5 pb-5 pt-6">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const isChecked = !!checkedItems[item.key];
                        return (
                          <motion.div 
                            key={item.key} 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0 cursor-pointer group active:scale-[0.98] transition-transform overflow-hidden"
                            onClick={() => toggleCheck(item.key)}
                          >
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                          <motion.div 
                            initial={false}
                            animate={{
                              backgroundColor: isChecked ? [primaryColor || '#3b82f6', '#f3f4f6'] : 'transparent',
                              borderColor: isChecked ? 'transparent' : '#e7e5e4',
                              color: isChecked ? '#a8a29e' : 'transparent'
                            }}
                            transition={{ duration: 0.3 }}
                            className="w-[26px] h-[26px] rounded-[10px] flex items-center justify-center border-2 flex-shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </motion.div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`font-semibold capitalize transition-all duration-300 truncate ${isChecked ? 'text-stone-300 line-through' : 'text-stone-800'}`}>
                              {item.name}
                            </p>
                            <p className={`text-[12px] font-medium tracking-wide transition-all duration-300 mt-0.5 ${isChecked ? 'text-stone-200' : 'text-stone-400'}`}>
                              {item.recipeCount > 0 ? `Used in ${item.recipeCount} recipe${item.recipeCount === 1 ? '' : 's'}` : 'Added manually'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col justify-center max-w-[40%]">
                          <div className={`transition-all duration-300 flex-shrink-0 text-center font-bold text-sm px-3 py-1.5 rounded-lg ${isChecked ? 'bg-transparent text-stone-300 line-through opacity-50' : 'bg-stone-100 text-stone-700'}`}>
                            {item.amountDisplay}
                          </div>
                        </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
          </div>

            {collectedItems > 0 && (
              <button 
                onClick={clearCompleted}
                className="w-full py-6 text-center text-sm font-medium text-stone-500 hover:text-red-500 transition-colors"
              >
                Clear Completed Items
              </button>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
