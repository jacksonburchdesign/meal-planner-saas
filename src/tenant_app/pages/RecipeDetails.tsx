import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipe } from '../hooks';
import { db, storage, functions } from '../services/firebase/config';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, EditPencil, Check, Plus, Xmark, CloudUpload, RefreshDouble, Printer, Trash, Clock, ShareAndroid } from 'iconoir-react';
import { Badge, Input, Button } from '../components/common';
import type { Ingredient, RecipeCategory, FamilyConnection } from '../types';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import { httpsCallable } from 'firebase/functions';

function parseIngredientString(raw: string): Ingredient {
  const parts = raw.trim().split(' ');
  const firstNumeric = parseFloat(parts[0]);
  if (parts.length >= 3 && !isNaN(firstNumeric)) {
    return { amount: firstNumeric, unit: parts[1], name: parts.slice(2).join(' ') };
  }
  if (parts.length === 2 && !isNaN(firstNumeric)) {
    return { amount: firstNumeric, unit: 'whole', name: parts[1] };
  }
  return { amount: '', unit: '', name: raw.trim() };
}

export function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipe, loading } = useRecipe(id || '');

  // 1. Local State
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<RecipeCategory>('entrées');
  const [editIsHealthy, setEditIsHealthy] = useState(false);
  const [editCookTime, setEditCookTime] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [editIngredients, setEditIngredients] = useState<string[]>([]);

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editInstructions, setEditInstructions] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Sharing State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [sharingTo, setSharingTo] = useState<string | null>(null);
  const { familyId } = useTheme();

  useEffect(() => {
    if (!familyId || !isShareModalOpen) return;
    
    const qConn = query(
      collection(db, 'familyConnections'),
      where('fromFamilyId', '==', familyId),
      where('status', '==', 'active')
    );
    const unsub = onSnapshot(qConn, (snap) => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyConnection)));
    });
    return () => unsub();
  }, [familyId, isShareModalOpen]);

  const handleShare = async (targetFamilyId: string) => {
    if (!recipe || !id) return;
    setSharingTo(targetFamilyId);
    try {
      const shareFn = httpsCallable(functions, 'shareRecipe');
      await shareFn({ recipeId: id, targetFamilyId });
      alert('Recipe shared successfully!');
      setIsShareModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to share recipe.');
    } finally {
      setSharingTo(null);
    }
  };

  // 2. Prep Hooks
  const prepHero = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditCategory(recipe.category);
    setEditIsHealthy(recipe.isHealthy);
    setEditCookTime(recipe.cookTime || '');
    setEditImageUrl(recipe.imageUrl || '');
    setIsEditingHero(true);
  };

  const prepIngredients = () => {
    if (!recipe) return;
    setEditIngredients(recipe.ingredients.map((i: any) => `${i.amount} ${i.unit === 'whole' ? '' : i.unit} ${i.name}`.trim().replace(/\s+/g, ' ')));
    setIsEditingIngredients(true);
  };

  const prepInstructions = () => {
    if (!recipe) return;
    setEditInstructions([...recipe.instructions]);
    setIsEditingInstructions(true);
  };

  // 3. Save Handlers
  const saveHero = async () => {
    if (!recipe || !id) return;
    setSavingSection('hero');
    await updateDoc(doc(db, 'recipes', id), {
      title: editTitle.trim(),
      category: editCategory,
      isHealthy: editIsHealthy,
      cookTime: editCookTime.trim() || null,
      imageUrl: editImageUrl.trim() || null
    });
    setSavingSection(null);
    setIsEditingHero(false);
  };

  const saveIngredients = async () => {
    if (!recipe || !id) return;
    setSavingSection('ingredients');
    const parsedParams = editIngredients.filter(i => i.trim() !== '').map(parseIngredientString);
    await updateDoc(doc(db, 'recipes', id), { ingredients: parsedParams });
    setSavingSection(null);
    setIsEditingIngredients(false);
  };

  const saveInstructions = async () => {
    if (!recipe || !id) return;
    setSavingSection('instructions');
    const cleanParams = editInstructions.filter(i => i.trim() !== '');
    await updateDoc(doc(db, 'recipes', id), { instructions: cleanParams });
    setSavingSection(null);
    setIsEditingInstructions(false);
  };

  const handleDelete = async () => {
    if (!recipe || !id) return;
    if (window.confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
      setDeleting(true);
      try {
        await deleteDoc(doc(db, 'recipes', id));
        navigate('/recipes', { replace: true });
      } catch (error) {
        console.error("Failed to delete recipe:", error);
        alert("Failed to delete recipe.");
        setDeleting(false);
      }
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploadingImage(true);
    try {
      const img = new Image();
      const reader = new FileReader();

      const blob = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (event) => {
          img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_WIDTH = 1200;
             const scaleSize = MAX_WIDTH / img.width;
             canvas.width = MAX_WIDTH;
             canvas.height = img.height * scaleSize;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
             
             canvas.toBlob((b) => {
               if (b) resolve(b);
               else reject(new Error("Canvas failure"));
             }, 'image/jpeg', 0.8);
          }
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const storageRef = ref(storage, `recipes/${id}/${Date.now()}.jpg`);
      const snapshot = await uploadBytesResumable(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setEditImageUrl(downloadURL);
    } catch (error) {
      console.error(error);
      alert("Failed to upload image.");
    } finally {
      if (e.target) e.target.value = '';
      setUploadingImage(false);
    }
  };

  const ActionHeader = (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between mt-[env(safe-area-inset-top)] print:hidden">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center justify-center p-2.5 rounded-full bg-white/70 backdrop-blur-md text-zinc-900 shadow-sm border border-zinc-200/50 hover:bg-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
      </button>

      <div className="flex gap-2">
        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center justify-center p-2.5 rounded-full bg-white/70 backdrop-blur-md text-zinc-900 shadow-sm border border-zinc-200/50 hover:bg-white transition-colors"
        >
          <ShareAndroid className="w-5 h-5 stroke-[2.5]" />
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center p-2.5 rounded-full bg-white/70 backdrop-blur-md text-zinc-900 shadow-sm border border-zinc-200/50 hover:bg-white transition-colors"
        >
          <Printer className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  return (
    <PageWrapper title="" noPadding>
      {ActionHeader}
      {loading ? (
        <div className="flex justify-center p-12 text-zinc-500 font-medium">Loading details...</div>
      ) : !recipe ? (
        <div className="p-12 text-center text-zinc-500 font-medium">Recipe not found.</div>
      ) : (
        <div className="pb-8 animate-in fade-in duration-300">
          
          {/* ================= HERO SECTION ================= */}
          <div className="w-full relative shadow-sm border-b border-zinc-100 print:border-none print:shadow-none">
            {!isEditingHero ? (
              <div className="w-full h-[340px] print:h-auto bg-zinc-100 print:bg-transparent flex items-center justify-center relative overflow-hidden group">
                {recipe.imageUrl ? (
                   <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover print:relative print:h-[200px] print:object-contain print:rounded-2xl print:mb-4" />
                ) : (
                   <div className="w-full h-full bg-primary-50 flex items-center justify-center text-7xl filter grayscale opacity-80 print:hidden">🍲</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent print:hidden" />
                
                <button onClick={prepHero} className="absolute top-20 right-4 z-50 mt-[env(safe-area-inset-top)] p-2.5 bg-white/30 hover:bg-white/90 text-white hover:text-zinc-900 backdrop-blur-md rounded-full transition-all shadow-sm opacity-100 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 print:hidden">
                   <EditPencil className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div className="absolute bottom-6 left-6 pr-6 w-full print:static print:px-0">
                  <div className="flex items-center gap-2 mb-3 print:hidden">
                    <Badge variant="primary" className="!bg-primary-500 !border-primary-500 !text-white !font-bold tracking-wider">{recipe.category}</Badge>
                    {recipe.isHealthy ? 
                       <Badge variant="success" className="!bg-success-500 !border-success-500 !text-white !font-bold tracking-wider">🌿 Healthy</Badge> : 
                       <Badge variant="default" className="!bg-orange-500 !border-orange-500 !text-white !font-bold tracking-wider">🍔 Indulgent</Badge>
                    }
                    {recipe.cookTime && (
                       <Badge variant="default" className="!bg-zinc-800/80 !border-zinc-700 !text-white !font-bold tracking-wider backdrop-blur-md flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 stroke-[3]" /> {recipe.cookTime}
                       </Badge>
                    )}
                  </div>
                  <h1 className="text-[32px] font-bold text-white print:text-zinc-900 leading-[1.1] tracking-tight drop-shadow-lg print:drop-shadow-none pr-4">{recipe.title}</h1>
                </div>
              </div>
            ) : (
              <div className="w-full bg-white p-6 pt-20 animate-in slide-in-from-top-4 duration-200 shadow-inner">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Recipe Title</label>
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} disabled={savingSection === 'hero'} className="!text-lg font-bold !py-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Category</label>
                      <select 
                        value={editCategory} 
                        onChange={(e) => setEditCategory(e.target.value as RecipeCategory)}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 text-[15px] p-3 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      >
                         {['entrées', 'sides', 'sauces', 'snacks', 'desserts', 'smoothies', 'dips'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Health Target</label>
                      <div onClick={() => setEditIsHealthy(!editIsHealthy)} className={`w-full h-[50px] rounded-xl flex items-center justify-center font-bold text-[14px] cursor-pointer transition-all ${editIsHealthy ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                        {editIsHealthy ? '🌿 Healthy' : '🍔 Indulgent'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Cook Time</label>
                    <Input value={editCookTime} onChange={e => setEditCookTime(e.target.value)} disabled={savingSection === 'hero'} className="!text-[15px] !py-3" placeholder="e.g. 30 mins (Optional)" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Cover/Header Image</label>
                    <div className="flex gap-2">
                      <Input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} disabled={savingSection === 'hero' || uploadingImage} placeholder="https://" className="flex-1" />
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                          onChange={handleImageUpload}
                          disabled={savingSection === 'hero' || uploadingImage}
                        />
                        <Button variant="outline" disabled={savingSection === 'hero' || uploadingImage} className="px-4 h-[50px] flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100">
                          {uploadingImage ? <RefreshDouble className="w-5 h-5 animate-spin text-zinc-500" /> : <CloudUpload className="w-5 h-5 text-zinc-500 stroke-[2]" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center pt-6 gap-3">
                     <button 
                       onClick={handleDelete} 
                       disabled={deleting} 
                       className="flex items-center justify-center sm:justify-start gap-1.5 px-4 py-3 sm:py-2 text-danger-500 hover:bg-danger-50 bg-danger-50/50 sm:bg-transparent rounded-xl transition-colors font-bold text-[14px]"
                     >
                       <Trash className="w-4 h-4 stroke-[2.5]" /> {deleting ? 'Deleting...' : 'Delete Recipe'}
                     </button>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsEditingHero(false)} className="px-6 h-[48px] sm:h-auto">Cancel</Button>
                        <Button variant="primary" onClick={saveHero} disabled={savingSection === 'hero'} className="px-6 h-[48px] sm:h-auto flex items-center justify-center gap-1 bg-primary-500 hover:bg-primary-600 border-primary-500 shadow-primary-500/20 text-white">
                           <Check className="w-5 h-5 stroke-[3]" /> Save Settings
                        </Button>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 max-w-2xl mx-auto">
            {/* ================= INGREDIENTS SECTION ================= */}
             <div className="mt-8 group relative rounded-2xl transition-all print:mt-4">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-[20px] font-bold text-zinc-900 tracking-tight">Ingredients</h2>
                 {!isEditingIngredients ? (
                    <button onClick={prepIngredients} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors opacity-100 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 print:hidden">
                       <EditPencil className="w-4 h-4 stroke-[2.5]" />
                    </button>
                 ) : (
                    <button onClick={saveIngredients} disabled={savingSection === 'ingredients'} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                       <Check className="w-4 h-4 stroke-[3]" /> 
                       {savingSection === 'ingredients' ? 'Saving...' : 'Save'}
                    </button>
                 )}
              </div>

              {!isEditingIngredients ? (
                <ul className="space-y-1 mb-10">
                  {recipe.ingredients.map((ing: any, i: number) => (
                    <li key={i} className="flex items-center py-2.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 px-2 -mx-2 rounded-lg transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-300 mr-3 shadow-[0_0_8px_rgba(var(--color-primary-500),0.4)]"></div>
                      <div className="flex-1 text-[15.5px] text-zinc-800 font-medium">{ing.name}</div>
                      <div className="text-zinc-500 text-[14px] font-bold tracking-tight">{ing.amount} <span className="text-zinc-400 font-semibold">{ing.unit === 'whole' ? '' : ing.unit}</span></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3 mb-10 shadow-inner">
                  {editIngredients.map((ing, i) => (
                    <div key={`ing-${i}`} className="flex items-center gap-2">
                       <Input 
                         value={ing} 
                         onChange={(e) => {
                            const newArr = [...editIngredients];
                            newArr[i] = e.target.value;
                            setEditIngredients(newArr);
                         }}
                         className="!py-2.5 !text-[14px] bg-white"
                       />
                       <button onClick={() => setEditIngredients(editIngredients.filter((_, idx) => idx !== i))} className="p-2 text-zinc-400 hover:text-danger-500 hover:bg-white rounded-xl transition-all">
                          <Xmark className="w-5 h-5 stroke-[2.5]" />
                       </button>
                    </div>
                  ))}
                  <button onClick={() => setEditIngredients([...editIngredients, ''])} className="w-full py-2.5 bg-white border border-dashed border-zinc-300 hover:border-primary-400 text-zinc-500 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors">
                     <Plus className="w-4 h-4 stroke-[2.5]" /> Add Ingredient
                  </button>
                </div>
              )}
            </div>

            {/* ================= INSTRUCTIONS SECTION ================= */}
             <div className="group relative rounded-2xl transition-all print:mt-6">
              <div className="flex items-center justify-between mb-5">
                 <h2 className="text-[20px] font-bold text-zinc-900 tracking-tight">Instructions</h2>
                 {!isEditingInstructions ? (
                    <button onClick={prepInstructions} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors opacity-100 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 print:hidden">
                       <EditPencil className="w-4 h-4 stroke-[2.5]" />
                    </button>
                 ) : (
                    <button onClick={saveInstructions} disabled={savingSection === 'instructions'} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                       <Check className="w-4 h-4 stroke-[3]" /> 
                       {savingSection === 'instructions' ? 'Saving...' : 'Save'}
                    </button>
                 )}
              </div>

              {!isEditingInstructions ? (
                <div className="space-y-6">
                  {recipe.instructions.map((step: string, i: number) => (
                    <div key={i} className="flex gap-4 p-2 -mx-2 hover:bg-zinc-50/50 rounded-xl transition-colors">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-sans shadow-md">
                        {i + 1}
                      </div>
                      <p className="text-[15.5px] text-zinc-800 leading-relaxed font-medium pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-4 shadow-inner">
                  {editInstructions.map((inst, i) => (
                    <div key={`inst-${i}`} className="flex items-start gap-2 relative">
                      <div className="absolute left-3 top-3 w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10 shadow-sm">
                        {i + 1}
                      </div>
                      <textarea 
                         value={inst}
                         onChange={(e) => {
                            const newArr = [...editInstructions];
                            newArr[i] = e.target.value;
                            setEditInstructions(newArr);
                         }}
                         className="w-full bg-white border border-zinc-200 text-zinc-900 text-[14px] rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[90px] resize-y shadow-sm"
                      />
                      <button onClick={() => setEditInstructions(editInstructions.filter((_, idx) => idx !== i))} className="p-2 mt-2 text-zinc-400 hover:text-danger-500 hover:bg-white rounded-xl transition-all">
                         <Xmark className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setEditInstructions([...editInstructions, ''])} className="w-full py-3 bg-white border border-dashed border-zinc-300 hover:border-primary-400 text-zinc-500 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors">
                     <Plus className="w-4 h-4 stroke-[2.5]" /> Add Step
                  </button>
                </div>
              )}
            </div>

            {/* ================= SOURCE SECTION ================= */}
            <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center justify-center text-center pb-4 print:hidden">
               <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">Recipe Source</span>
               {recipe.sourceUrl ? (
                  <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-primary-600 hover:text-primary-700 underline underline-offset-4 decoration-primary-200 hover:decoration-primary-400 transition-colors">
                     {(() => {
                        try {
                           return new URL(recipe.sourceUrl).hostname.replace(/^www\./, '');
                        } catch {
                           return recipe.sourceUrl;
                        }
                     })()}
                  </a>
               ) : (
                  <span className="text-[14px] font-medium text-zinc-600 capitalize bg-zinc-100 px-3 py-1 rounded-full flex items-center justify-center gap-1.5 w-max">
                     {recipe.source === 'camera' ? <>📸 Camera Scan</> : <>✍️ Manual Entry</>}
                  </span>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Portal */}
      {isShareModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-0 items-center">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsShareModalOpen(false)} />

          <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-md max-h-[85vh] rounded-t-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-8 duration-200 shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between mb-4 flex-none pt-2">
              <h3 className="font-bold text-[19px] text-zinc-900 tracking-tight">Share Recipe</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                <Xmark className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-6 px-1">
              {connections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 font-medium">You don't have any connected families yet.</p>
                  <Button onClick={() => { setIsShareModalOpen(false); navigate('/connections'); }} variant="outline" className="mt-4">
                    Connect with a Family
                  </Button>
                </div>
              ) : (
                connections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-zinc-100">
                    <span className="font-bold text-zinc-900">{conn.toFamilyName}</span>
                    <Button 
                      onClick={() => handleShare(conn.toFamilyId)} 
                      disabled={sharingTo === conn.toFamilyId}
                      className="px-4 min-h-[36px] text-sm"
                    >
                      {sharingTo === conn.toFamilyId ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </PageWrapper>
  );
}
