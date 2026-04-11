import { PageWrapper } from '../components/layout/PageWrapper';
import { useRecipes } from '../hooks';
import { SnapRecipeCamera } from '../components/recipe/SnapRecipeCamera';
import { ImportRecipeUrl } from '../components/recipe/ImportRecipeUrl';
import { ImportPinterestBoard } from '../components/recipe/ImportPinterestBoard';
import { ManualRecipeInput } from '../components/recipe/ManualRecipeInput';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

// Generates a beautiful deterministic dual-tone gradient based on the recipe title using COMPLEMENTARY colors
// Teal (#0097b2) Complement -> Coral/Red-Orange
// Lime Green (#7ed957) Complement -> Violet/Purple
const GRADIENTS = [
  'linear-gradient(135deg, var(--color-rose-400), var(--color-rose-600))',
  'linear-gradient(135deg, var(--color-orange-400), var(--color-orange-600))',
  'linear-gradient(135deg, var(--color-purple-400), var(--color-purple-600))',
  'linear-gradient(135deg, var(--color-rose-400), var(--color-orange-500))',
  'linear-gradient(135deg, var(--color-fuchsia-400), var(--color-rose-500))',
];

const getGradientProps = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return {
    background: GRADIENTS[index],
  };
};

// Generates a deterministic aspect ratio to enforce staggered masonry layout
const getAspectRatio = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Mix of tall, slightly tall, and square to emulate pinterest perfectly
  const ratios = ['3/4', '4/5', '1/1', '5/6', '7/9'];
  const index = Math.abs(hash) % ratios.length;
  return ratios[index];
};

// Container variants for staggering children
const containerV: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemV: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function AllRecipes() {
  const { recipes, loading } = useRecipes();
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<string[]>(['All']);
  const [displayLimit, setDisplayLimit] = useState(20);

  // Reset limit when filters change
  useMemo(() => {
    setDisplayLimit(20);
  }, [activeFilters]);

  const toggleFilter = (tag: string) => {
    if (tag === 'All') {
      setActiveFilters(['All']);
      return;
    }

    setActiveFilters(prev => {
      const withoutAll = prev.filter(t => t !== 'All');
      if (withoutAll.includes(tag)) {
         const newFilters = withoutAll.filter(t => t !== tag);
         return newFilters.length === 0 ? ['All'] : newFilters;
      }
      return [...withoutAll, tag];
    });
  };

  const filteredRecipes = useMemo(() => {
    if (activeFilters.includes('All')) return recipes;

    return recipes.filter(r => {
      // Handle "Health" domain logic (OR within domain)
      const healthFilters = activeFilters.filter(f => f === 'Healthy' || f === 'Indulgent');
      let passesHealth = true;
      if (healthFilters.length > 0) {
         passesHealth = healthFilters.some(hf => 
            (hf === 'Healthy' && r.isHealthy) || 
            (hf === 'Indulgent' && !r.isHealthy)
         );
      }

      // Handle "Category" domain logic (OR within domain)
      const categoryFilters = activeFilters.filter(f => f !== 'Healthy' && f !== 'Indulgent');
      let passesCategory = true;
      if (categoryFilters.length > 0) {
         passesCategory = categoryFilters.some(cf => r.category.toLowerCase() === cf.toLowerCase());
      }

      // Recipe must pass BOTH domain checks (AND across domains)
      return passesHealth && passesCategory;
    });
  }, [recipes, activeFilters]);

  const displayedRecipes = useMemo(() => {
    return filteredRecipes.slice(0, displayLimit);
  }, [filteredRecipes, displayLimit]);

  return (
    <PageWrapper
      title="All Recipes"
      action={
        <div className="flex items-center gap-0.5">
          <ManualRecipeInput />
          <ImportPinterestBoard />
          <ImportRecipeUrl />
          <SnapRecipeCamera />
        </div>
      }
    >
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-zinc-50 to-zinc-50 opacity-60" />

      {/* Horizontal Tag Cloud */}
      <div className="relative z-10 mb-4 -mx-4 px-4 overflow-x-auto custom-scrollbar flex items-center gap-2 pb-2 pl-4 pr-4">
        {['All', 'Healthy', 'Indulgent', 'Entrées', 'Sides', 'Sauces', 'Snacks', 'Desserts', 'Smoothies', 'Dips'].map(tag => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            className={`flex-none px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide transition-all active:scale-95 ${activeFilters.includes(tag) ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 border border-primary-600' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-primary-300'}`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300">
        {loading ? (
           <p className="text-zinc-500 text-center py-8 font-medium">Loading collection...</p>
        ) : filteredRecipes.length === 0 ? (
           <div className="text-center py-16 bg-white/70 backdrop-blur-xl border border-dashed border-zinc-200/60 rounded-3xl mt-4 shadow-xl shadow-zinc-200/20">
             <p className="text-zinc-900 font-semibold mb-2 text-lg">No recipes yet.</p>
             <p className="text-[15px] font-medium text-zinc-500">Tap the camera icon to snap<br />a photo of a recipe card!</p>
           </div>
        ) : (
          <>
            {/* Desktop / Tablet CSS Layout */}
            <motion.div 
              variants={containerV} 
              initial="hidden" 
              animate="show" 
              className="hidden md:block md:columns-3 gap-3 pb-8"
            >
               {displayedRecipes.map(recipe => (
                  <motion.div 
                    variants={itemV}
                    key={recipe.id} 
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                    className="break-inside-avoid relative overflow-hidden rounded-[20px] bg-white border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-lg cursor-pointer group mb-3 w-full"
                    whileHover={{ y: -4, scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="w-full relative bg-zinc-50 overflow-hidden" style={{ aspectRatio: getAspectRatio(recipe.title) }}>
                       <span className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest shadow-sm border border-white/60 text-primary-600 mix-blend-luminosity group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors duration-300">
                          {recipe.category}
                       </span>
                       {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                       ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center transform group-hover:scale-105 transition-transform duration-700 ease-out" style={getGradientProps(recipe.title)}>
                             <h4 className="text-xl font-bold text-white/90 shadow-black/10 drop-shadow-md leading-tight mix-blend-overlay line-clamp-4">{recipe.title}</h4>
                          </div>
                       )}
                       <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="absolute bottom-0 z-20 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                       <h3 className="font-bold text-[14px] leading-tight text-white drop-shadow-lg line-clamp-2">{recipe.title}</h3>
                    </div>
                  </motion.div>
               ))}
            </motion.div>

            {/* Mobile Native Flex Split Layout */}
            <motion.div 
              variants={containerV} 
              initial="hidden" 
              animate="show" 
              className="flex md:hidden gap-3 pb-8 items-start"
            >
               <div className="flex-1 flex flex-col gap-3">
                  {displayedRecipes.filter((_, i) => i % 2 === 0).map(recipe => (
                    <motion.div 
                      variants={itemV}
                      key={recipe.id} 
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                      className="relative overflow-hidden rounded-[20px] bg-white border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-lg cursor-pointer group mb-0 w-full"
                      whileHover={{ y: -4, scale: 0.98 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="w-full relative bg-zinc-50 overflow-hidden" style={{ aspectRatio: getAspectRatio(recipe.title) }}>
                         <span className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest shadow-sm border border-white/60 text-primary-600 mix-blend-luminosity group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors duration-300">
                            {recipe.category}
                         </span>
                         {recipe.imageUrl ? (
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center transform group-hover:scale-105 transition-transform duration-700 ease-out" style={getGradientProps(recipe.title)}>
                               <h4 className="text-xl font-bold text-white/90 shadow-black/10 drop-shadow-md leading-tight mix-blend-overlay line-clamp-4">{recipe.title}</h4>
                            </div>
                         )}
                         <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="absolute bottom-0 z-20 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                         <h3 className="font-bold text-[14px] leading-tight text-white drop-shadow-lg line-clamp-2">{recipe.title}</h3>
                      </div>
                    </motion.div>
                  ))}
               </div>
               
               <div className="flex-1 flex flex-col gap-3">
                  {displayedRecipes.filter((_, i) => i % 2 !== 0).map(recipe => (
                    <motion.div 
                      variants={itemV}
                      key={recipe.id} 
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                      className="relative overflow-hidden rounded-[20px] bg-white border border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-lg cursor-pointer group mb-0 w-full"
                      whileHover={{ y: -4, scale: 0.98 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="w-full relative bg-zinc-50 overflow-hidden" style={{ aspectRatio: getAspectRatio(recipe.title) }}>
                         <span className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest shadow-sm border border-white/60 text-primary-600 mix-blend-luminosity group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors duration-300">
                            {recipe.category}
                         </span>
                         {recipe.imageUrl ? (
                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center transform group-hover:scale-105 transition-transform duration-700 ease-out" style={getGradientProps(recipe.title)}>
                               <h4 className="text-xl font-bold text-white/90 shadow-black/10 drop-shadow-md leading-tight mix-blend-overlay line-clamp-4">{recipe.title}</h4>
                            </div>
                         )}
                         <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="absolute bottom-0 z-20 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                         <h3 className="font-bold text-[14px] leading-tight text-white drop-shadow-lg line-clamp-2">{recipe.title}</h3>
                      </div>
                    </motion.div>
                  ))}
               </div>
             </motion.div>

             {displayLimit < filteredRecipes.length && (
               <div className="flex justify-center pb-12 pt-4">
                 <button 
                   onClick={() => setDisplayLimit(prev => prev + 20)} 
                   className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 font-bold text-[14px] rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
                 >
                   Load More Recipes
                 </button>
               </div>
             )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
