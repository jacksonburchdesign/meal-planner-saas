import { Search, Plus, Filter } from 'lucide-react';

export default function RecipeDirectory() {
  const recipes = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    title: `Delicious Recipe ${i + 1}`,
    category: ['Dinner', 'Breakfast', 'Lunch', 'Dessert'][i % 4]
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white p-6 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">All Recipes</h1>
          <button className="p-2 bg-[var(--color-primary)] text-white rounded-full bg-opacity-10 text-[var(--color-primary)] hover:bg-opacity-20 transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search recipes..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
            />
          </div>
          <button className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 grid grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-95 transition-transform cursor-pointer">
            <div className="h-28 bg-slate-200 relative">
              <img src={`https://source.unsplash.com/random/200x200/?food&sig=${recipe.id + 10}`} alt="Recipe" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold tracking-wider uppercase text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-full">
                {recipe.category}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{recipe.title}</h3>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
