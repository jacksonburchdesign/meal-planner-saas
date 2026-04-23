import { useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { Xmark, EditPencil } from 'iconoir-react';
import { Button, Input } from '../common';
import { useNavigate } from 'react-router-dom';
import type { Ingredient, RecipeCategory } from '../../types';

import { useTheme } from '../../../context/ThemeContext';

function parseIngredientString(raw: string): Ingredient {
  const parts = raw.trim().split(' ');
  const firstNumeric = parseFloat(parts[0]);
  
  // If the string cleanly starts with a quantity like "2 cups flour"
  if (parts.length >= 3 && !isNaN(firstNumeric)) {
    return { 
      amount: firstNumeric, 
      unit: parts[1], 
      name: parts.slice(2).join(' ') 
    };
  }
  
  // If it starts with just quantity and name "2 eggs"
  if (parts.length === 2 && !isNaN(firstNumeric)) {
    return {
      amount: firstNumeric,
      unit: 'whole',
      name: parts[1]
    };
  }

  // Fallback for flat strings "Salt and pepper"
  return { amount: '', unit: '', name: raw.trim() };
}

export function ManualRecipeInput() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { familyId } = useTheme();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('entrées');
  const [isHealthy, setIsHealthy] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateArray = (type: 'ing' | 'inst', index: number, value: string) => {
    if (type === 'ing') {
      const newArr = [...ingredients];
      newArr[index] = value;
      setIngredients(newArr);
    } else {
      const newArr = [...instructions];
      newArr[index] = value;
      setInstructions(newArr);
    }
  };

  const handleAddField = (type: 'ing' | 'inst') => {
    if (type === 'ing') setIngredients([...ingredients, '']);
    else setInstructions([...instructions, '']);
  };

  const handleRemoveField = (type: 'ing' | 'inst', index: number) => {
    if (type === 'ing') {
      if (ingredients.length === 1) return; // leave at least one
      setIngredients(ingredients.filter((_, i) => i !== index));
    } else {
      if (instructions.length === 1) return;
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Recipe title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const parsedIngredients = ingredients
        .filter(i => i.trim() !== '')
        .map(parseIngredientString);

      const filteredInstructions = instructions.filter(i => i.trim() !== '');

      const recipeDoc = {
        title: title.trim(),
        category,
        isHealthy,
        imageUrl: imageUrl.trim() || null,
        ingredients: parsedIngredients,
        instructions: filteredInstructions,
        source: 'manual',
        familyId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'recipes'), recipeDoc);
      
      // Complete and navigate
      setIsOpen(false);
      
      // Cleanup state for future Opens
      setTitle('');
      setCategory('entrées');
      setIsHealthy(true);
      setImageUrl('');
      setIngredients(['']);
      setInstructions(['']);
      
      navigate(`/recipes/${docRef.id}`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors active:scale-95"
      >
        <EditPencil className="w-[22px] h-[22px] stroke-[2]" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !saving && setIsOpen(false)} />

          <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] flex flex-col relative z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 shadow-2xl max-h-[85vh]">
            
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
              <h3 className="font-bold text-[19px] text-zinc-900 tracking-tight">Draft Recipe</h3>
              <button disabled={saving} onClick={() => setIsOpen(false)} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                <Xmark className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 space-y-6">
              
              {error && (
                <div className="p-3 bg-danger-50 text-danger-700 text-[14px] font-semibold rounded-xl text-center border border-danger-100">
                  {error}
                </div>
              )}

              {/* Title & Cover */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase mb-2">Title</label>
                  <Input type="text" placeholder="Grandma's Chili..." value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase mb-2">Category</label>
                    <div className="relative">
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                        disabled={saving}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-[15px] p-3 rounded-xl placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
                      >
                        <option value="entrées">Entrées</option>
                        <option value="sides">Sides</option>
                        <option value="sauces">Sauces</option>
                        <option value="snacks">Snacks</option>
                        <option value="desserts">Desserts</option>
                        <option value="smoothies">Smoothies</option>
                        <option value="dips">Dips</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase mb-2">Health Status</label>
                    <div 
                      onClick={() => !saving && setIsHealthy(!isHealthy)}
                      className={`w-full h-[50px] rounded-xl flex items-center justify-center font-bold text-[14px] cursor-pointer transition-all ${isHealthy ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-danger-50 text-danger-700 border border-danger-200'}`}
                    >
                      {isHealthy ? '🌿 Healthy' : '🍔 Indulgent'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase mb-2">Image URL (Optional)</label>
                  <Input type="url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={saving} />
                </div>
              </div>

              {/* Ingredients Array */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase">Ingredients</label>
                  <button onClick={() => handleAddField('ing')} className="bg-white/90 backdrop-blur-3xl border-t border-white/40 border border-zinc-200 text-primary-600 text-[12px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                    + Add
                  </button>
                </div>
                {ingredients.map((ing, i) => (
                  <div key={`ing-${i}`} className="flex items-center gap-2">
                    <Input 
                       placeholder="e.g. 2 cups flour" 
                       value={ing} 
                       onChange={(e) => handleUpdateArray('ing', i, e.target.value)}
                       className="!py-2 !text-[14px]"
                    />
                    <button onClick={() => handleRemoveField('ing', i)} className="p-2 text-zinc-400 hover:text-danger-500 hover:bg-danger-50 rounded-xl transition-all shrink-0">
                       <Xmark className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Instructions Array */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <label className="block text-[13px] font-bold tracking-wide text-zinc-500 uppercase">Instructions</label>
                  <button onClick={() => handleAddField('inst')} className="bg-white/90 backdrop-blur-3xl border-t border-white/40 border border-zinc-200 text-primary-600 text-[12px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                    + Step
                  </button>
                </div>
                {instructions.map((inst, i) => (
                  <div key={`inst-${i}`} className="flex items-start gap-2 relative">
                    <div className="absolute left-3 top-3 w-5 h-5 bg-zinc-200 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {i + 1}
                    </div>
                    <textarea 
                       placeholder="Chop the onions..."
                       value={inst}
                       onChange={(e) => handleUpdateArray('inst', i, e.target.value)}
                       className="w-full bg-white border border-zinc-200 text-zinc-900 text-[14px] rounded-xl pl-10 pr-4 py-2.5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[80px] resize-y"
                    />
                    <button onClick={() => handleRemoveField('inst', i)} className="p-2 mt-2 text-zinc-400 hover:text-danger-500 hover:bg-danger-50 rounded-xl transition-all shrink-0">
                       <Xmark className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                ))}
              </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="p-6 border-t border-zinc-100 shrink-0 bg-white/80 backdrop-blur-md rounded-b-[32px]">
              <Button
                variant="primary"
                className="w-full h-[52px] text-[16px] !rounded-2xl shadow-lg shadow-primary-500/25"
                onClick={handleSave}
                disabled={saving || !title}
              >
                {saving ? 'Adding to Vault...' : 'Save Recipe'}
              </Button>
            </div>
            
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
