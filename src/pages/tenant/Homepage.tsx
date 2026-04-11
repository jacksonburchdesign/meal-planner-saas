import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function Homepage() {
  // Mock data for the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-[var(--color-primary)] text-white p-6 shadow-md rounded-b-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
        </div>
        <h1 className="text-2xl font-bold relative z-10">This Week's Meals</h1>
        <p className="text-white/80 mt-1 relative z-10">What's cooking, Family?</p>
      </header>
      
      <main className="p-6 mt-2 space-y-6">
        <div className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
          {weekDays.map((day, idx) => (
            <div key={day} className="snap-center shrink-0 w-[85vw] max-w-[320px] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="h-40 bg-slate-200 relative">
                {/* Placeholder Image */}
                <img src={`https://source.unsplash.com/random/400x300/?food,meal&sig=${idx}`} alt="Meal" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                  {day}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Spaghetti Bolognese</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">Classic Italian pasta dish with rich tomato and meat sauce.</p>
                
                <div className="mt-auto pt-6 flex justify-between gap-2">
                  <button className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                    <CheckCircle className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Made It</span>
                  </button>
                  <button className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                    <RefreshCw className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Alt Meal</span>
                  </button>
                  <button className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                    <XCircle className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Skipped</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
