import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

export default function GroceryList() {
  const [items, setItems] = useState([
    { id: 1, name: 'Tomatoes', checked: false },
    { id: 2, name: 'Ground Beef', checked: false },
    { id: 3, name: 'Pasta', checked: true },
    { id: 4, name: 'Onions', checked: false },
    { id: 5, name: 'Garlic', checked: true },
  ]);

  const toggleItem = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  const uncompletedItems = items.filter(i => !i.checked);
  const completedItems = items.filter(i => i.checked);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white p-6 shadow-sm sticky top-0 z-20 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grocery List</h1>
          <p className="text-slate-500 text-sm mt-1">{uncompletedItems.length} items remaining</p>
        </div>
        <button 
          onClick={clearChecked}
          className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          title="Clear checked"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 space-y-6 pt-6">
        {/* Uncompleted */}
        <div className="space-y-2">
          {uncompletedItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-6 h-6 rounded border-2 border-slate-300 flex items-center justify-center"></div>
              <span className="text-slate-800 font-medium text-lg">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Completed */}
        {completedItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Checked Off</h3>
            {completedItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-4 p-3 rounded-xl opacity-60 cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-green-500 border-2 border-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-slate-500 font-medium text-lg line-through">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
