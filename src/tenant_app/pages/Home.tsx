import { PageWrapper } from '../components/layout/PageWrapper';
import { MealCard } from '../components/meal';
import { useCurrentWeeklyMeals, useRecipes } from '../hooks';
import { Button, NotificationBell } from '../components/common';
import { Calendar, Refresh, LogOut, Xmark, User, Plus } from 'iconoir-react';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db, functions } from '../services/firebase/config';
import { FamilyProfileModal } from '../components/profile';
import { useFamilySettings } from '../hooks';
import type { PlannedMeal } from '../types';
import { useTheme } from '../../context/ThemeContext';

export function Home() {
  const { currentPlan, nextPlan, loading } = useCurrentWeeklyMeals();
  const { recipes } = useRecipes();
  const [generating, setGenerating] = useState(false);
  const [addingSideTo, setAddingSideTo] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { signOut } = useAuth();
  const { settings } = useFamilySettings();
  const { familyId } = useTheme();

  const handleGeneratePlan = async (isNextWeek = false) => {
    setGenerating(true);
    try {
      const generatePlan = httpsCallable(functions, 'generateWeeklyPlan');
      await generatePlan({ isNextWeek });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (mealId: string, status: string) => {
    if (!currentPlan?.id) return;
    
    const meal = currentPlan.meals.find((m: PlannedMeal) => m.id === mealId);
    if (!meal) return;

    const updatedMeals = currentPlan.meals.map((m: PlannedMeal) => 
      m.id === mealId ? { ...m, status: status as any } : m
    );

    await updateDoc(doc(db, 'weeklyMeals', currentPlan.id), {
      meals: updatedMeals
    });

    if (['Made', 'Skipped', 'Made something else'].includes(status)) {
      await addDoc(collection(db, 'mealHistory'), {
        date: Date.now(),
        recipeId: meal.recipeId,
        status: status as any,
        familyId
      });
    }
  };

  const handleAddSide = async (recipeId: string) => {
    if (!currentPlan?.id || !addingSideTo) return;
    
    const meal = currentPlan.meals.find((m: PlannedMeal) => m.id === addingSideTo);
    if (!meal) return;

    const newSideIds = [...(meal.sideIds || []), recipeId];
    const updatedMeals = currentPlan.meals.map((m: PlannedMeal) => 
      m.id === addingSideTo ? { ...m, sideIds: newSideIds } : m
    );

    await updateDoc(doc(db, 'weeklyMeals', currentPlan.id), {
      meals: updatedMeals
    });
    setAddingSideTo(null);
  };

  if (loading) {
    return (
      <PageWrapper title="This Week">
        <div className="flex justify-center p-12">
           <Refresh className="animate-spin text-zinc-300 w-8 h-8" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper 
      title={settings.familyName || "This Week"}
      action={
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button onClick={() => setIsProfileOpen(true)} className="flex items-center text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100" title="Family Profile">
             <User className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button onClick={signOut} className="flex items-center text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100" title="Sign out">
             <LogOut className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
        {!currentPlan || currentPlan.meals.length === 0 ? (
          <div className="text-center bg-white rounded-3xl border border-dashed border-zinc-200 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-5 text-primary-600 shadow-sm shadow-primary-500/20">
              <Calendar className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">No Meal Plan</h2>
            <p className="text-[15px] font-medium text-zinc-500 mb-6 max-w-[240px] leading-relaxed">Let's build a delicious week for the family based on what's available.</p>
            <Button onClick={() => handleGeneratePlan(false)} disabled={generating} fullWidth>
              {generating ? "Planning..." : "Generate Weekly Plan"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-px bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
              {currentPlan.meals.map((meal: PlannedMeal, idx: number) => (
                <div key={meal.id} className={`${idx !== currentPlan.meals.length-1 ? 'mb-px' : ''}`}>
                   <MealCard meal={meal} dayNumber={idx + 1} onStatusChange={handleStatusChange} onAddSide={setAddingSideTo} />
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                const confirmed = window.confirm("Are you sure you want to regenerate this week's plan? The current plan will be erased.");
                if (!confirmed) return;
                
                try {
                  await deleteDoc(doc(db, 'weeklyMeals', currentPlan.id!));
                  await handleGeneratePlan(false);
                } catch (error: any) {
                  console.error("Failed to regenerate:", error);
                  alert(error.message || "Failed to regenerate plan.");
                }
              }} 
              disabled={generating} 
              fullWidth
              className="mt-6 border-danger-200 text-danger-600 hover:bg-danger-50 hover:border-danger-300 transition-colors"
            >
              {generating ? "Regenerating..." : "Regenerate Plan"}
            </Button>
          </div>
        )}

        {/* Next 7 Days Section */}
        {currentPlan && currentPlan.meals.length > 0 && (
          <div className="pt-8 border-t border-zinc-100">
            <h2 className="text-[20px] font-bold text-zinc-900 mb-4 tracking-tight">Next 7 Days</h2>
            
            {!nextPlan || nextPlan.meals.length === 0 ? (
              <div className="bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 p-6 flex flex-col items-center">
                <p className="text-[14px] font-medium text-zinc-500 mb-4 text-center">Plan ahead to buy ingredients early.</p>
                <Button onClick={() => handleGeneratePlan(true)} disabled={generating} variant="outline" className="bg-white">
                  {generating ? "Planning..." : "Generate Next 7 Days"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-px bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-100 shadow-sm opacity-80">
                  {nextPlan.meals.map((meal: PlannedMeal, idx: number) => (
                    <div key={meal.id} className={`${idx !== nextPlan.meals.length-1 ? 'mb-px' : ''}`}>
                       <MealCard meal={meal} dayNumber={idx + 1} onStatusChange={handleStatusChange} onAddSide={setAddingSideTo} />
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    const confirmed = window.confirm("Are you sure you want to regenerate next week's plan?");
                    if (!confirmed) return;
                    
                    try {
                      await deleteDoc(doc(db, 'weeklyMeals', nextPlan.id!));
                      await handleGeneratePlan(true);
                    } catch (error: any) {
                      console.error("Failed to regenerate:", error);
                      alert(error.message || "Failed to regenerate plan.");
                    }
                  }} 
                  disabled={generating} 
                  fullWidth
                  className="mt-6 border-danger-200 text-danger-600 hover:bg-danger-50 hover:border-danger-300 transition-colors"
                >
                  {generating ? "Regenerating..." : "Regenerate Next 7 Days"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {addingSideTo && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-0 items-center">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setAddingSideTo(null)} />

          <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-md max-h-[85vh] rounded-t-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-8 duration-200 shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between mb-4 flex-none pt-2">
              <h3 className="font-bold text-[19px] text-zinc-900 tracking-tight">Select a Side Dish</h3>
              <button onClick={() => setAddingSideTo(null)} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                <Xmark className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-2">
               {recipes.filter(r => r.category === 'sides').map(recipe => (
                 <div key={recipe.id} onClick={() => handleAddSide(recipe.id!)} className="flex items-center gap-3 p-2 bg-white border border-zinc-100 rounded-2xl hover:bg-white hover:border-zinc-200 hover:shadow-sm cursor-pointer transition-all active:scale-[0.98]">
                    <div className="w-14 h-14 bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                      {recipe.imageUrl ? <img src={recipe.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🥗</div>}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                       <h4 className="font-bold text-zinc-900 text-[14px] leading-tight truncate">{recipe.title}</h4>
                       <p className="text-[12px] text-zinc-400 font-medium truncate">{recipe.isHealthy ? '🌿 Healthy' : '🍔 Indulgent'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center mr-1">
                      <Plus className="w-4 h-4 text-zinc-400 stroke-[2.5]" />
                    </div>
                 </div>
               ))}
               {recipes.filter(r => r.category === 'sides').length === 0 && (
                 <p className="text-center text-zinc-400 py-8 font-medium">You don't have any side dishes saved yet.</p>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {isProfileOpen && <FamilyProfileModal onClose={() => setIsProfileOpen(false)} />}
    </PageWrapper>
  );
}
