import { useRecipe } from '../../hooks';
import { Card } from '../common';
import type { PlannedMeal } from '../../types';
import { Check, Hourglass, Plus, Clock } from 'iconoir-react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';

function MiniSideRecipeCard({ sideId }: { sideId: string }) {
  const { recipe, loading } = useRecipe(sideId);
  const navigate = useNavigate();

  if (loading) return <div className="h-[48px] bg-stone-100 rounded-lg animate-pulse" />;
  if (!recipe) return null;

  return (
    <div 
       onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${recipe.id}`); }}
       className="flex items-center gap-3 bg-white border border-stone-100 p-2 rounded-xl shadow-sm cursor-pointer hover:bg-stone-50 hover:border-stone-200 transition-all hover:-translate-y-0.5"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-50 flex-shrink-0">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs bg-stone-100">🥘</div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-[13px] font-bold text-stone-900 truncate leading-tight">{recipe.title}</h4>
        <p className="text-[11px] text-stone-400 uppercase tracking-widest font-bold flex items-center gap-2 mt-0.5">
           Side
           {recipe.cookTime && <span className="normal-case flex items-center gap-0.5 text-stone-500 tracking-normal"><Clock className="w-3 h-3 stroke-[2.5]" /> {recipe.cookTime}</span>}
        </p>
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
  tenantAccentColor?: string;
}

export function MealCard({ meal, dayNumber, onStatusChange, onAddSide, onSwap, tenantAccentColor = '#10b981' }: MealCardProps) {
  const { recipe, loading } = useRecipe(meal.recipeId);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  // Framer Motion Swipe Setup
  const x = useMotionValue(0);
  const skipOpacity = useTransform(x, [-80, -40, 0], [1, 1, 0]);
  const swapOpacity = useTransform(x, [0, 40, 80], [0, 1, 1]);

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    const offset = info.offset.x;
    
    if (offset < -60) {
      onStatusChange(meal.id, 'Skipped');
    } else if (offset > 60 && onSwap) {
      onSwap(meal.id);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse border-none shadow-none bg-transparent">
        <div className="h-32 bg-stone-100 rounded-3xl flex items-center justify-center">
          <Hourglass className="animate-spin text-stone-300 w-6 h-6" />
        </div>
      </Card>
    );
  }

  if (!recipe) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl mb-4 group bg-stone-100">
      {/* Background Action Layer */}
      <div className="absolute inset-0 flex justify-between items-center px-8 z-0 font-bold text-[15px] tracking-wide">
        {/* Left Side (Revealed on Right Swipe) -> Swap */}
        <motion.div style={{ opacity: swapOpacity }} className="text-amber-800 bg-amber-100 absolute inset-y-0 left-0 w-1/2 flex items-center pl-8 rounded-l-3xl">
          Swap
        </motion.div>
        
        {/* Right Side (Revealed on Left Swipe) -> Skip */}
        <motion.div style={{ opacity: skipOpacity }} className="text-stone-600 bg-stone-200 absolute inset-y-0 right-0 w-1/2 flex items-center justify-end pr-8 rounded-r-3xl">
          Skip
        </motion.div>
      </div>

      {/* Draggable Foreground Card */}
      <motion.div
        drag={meal.status === 'Pending' ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-white rounded-3xl shadow-sm border border-stone-100 cursor-grab active:cursor-grabbing flex flex-col min-h-[140px]"
      >
        <div 
          className="flex items-start gap-4 p-5 cursor-pointer relative"
          onClick={() => {
            if (!isDragging) {
              navigate(`/recipes/${recipe.id}`);
            }
          }}
        >
          {/* Top-Right "Made It" Toggle */}
          {meal.status === 'Pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(meal.id, 'Made');
              }}
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
              className="absolute top-5 right-5 rounded-full z-20 border-2 border-stone-200 hover:border-stone-300 bg-white transition-all hover:scale-105 flex items-center justify-center shadow-sm"
            >
            </button>
          )}

          {meal.status === 'Made' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(meal.id, 'Pending'); // Allow undo
              }}
              style={{ backgroundColor: tenantAccentColor, width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
              className="absolute top-5 right-5 rounded-full flex items-center justify-center shadow-md transition-all z-20 hover:scale-105"
            >
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </button>
          )}

          <div className="w-[88px] h-[88px] rounded-[22px] bg-stone-50 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)] border border-stone-900/5">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <span className="text-3xl">🍲</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5 pr-8"> {/* Padding right to avoid overlapping toggle */}
            
            {/* Pill Tags */}
            <div className="flex items-center flex-wrap gap-2 mb-2.5">
              <span className="text-[10px] font-medium text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Day {dayNumber} • {meal.status}
              </span>
              
              {recipe.isHealthy && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">Healthy</span>
              )}
              
              {!recipe.isHealthy && (
                <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium tracking-wide">Indulgent</span>
              )}
            </div>

            <h3 className="text-[18px] leading-[1.15] font-bold text-stone-900 tracking-tight pr-2">{recipe.title}</h3>
            
            {recipe.cookTime && (
               <span className="text-xs font-medium text-stone-500 flex items-center gap-1 mt-1.5">
                  <Clock className="w-3.5 h-3.5 stroke-[2] text-stone-400" /> {recipe.cookTime}
               </span>
            )}
          </div>
        </div>
        
        {/* Nested Depth: Paired With Section */}
        <div className="px-4 pb-4 pt-0">
           <div className="p-4 bg-stone-50 rounded-xl space-y-3">
             <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-stone-400 tracking-widest uppercase">Paired With</p>
                {meal.status === 'Pending' && onAddSide && (
                   <button 
                      onClick={(e) => { e.stopPropagation(); onAddSide(meal.id); }} 
                      style={{ color: tenantAccentColor }}
                      className="text-[12px] font-bold flex items-center hover:opacity-80 transition-opacity"
                   >
                      <Plus className="w-3.5 h-3.5 mr-0.5 stroke-[3]" /> Add Side
                   </button>
                )}
             </div>
             
             {meal.sideIds && meal.sideIds.length > 0 ? (
               <div className="grid grid-cols-1 gap-2">
                 {meal.sideIds.map(sideId => <MiniSideRecipeCard key={sideId} sideId={sideId} />)}
               </div>
             ) : (
               <p className="text-[14px] text-stone-500 font-medium">No sides paired yet.</p>
             )}
           </div>
        </div>
        
      </motion.div>
    </div>
  );
}
