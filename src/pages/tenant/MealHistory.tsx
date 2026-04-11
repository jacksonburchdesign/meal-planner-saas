export default function MealHistory() {
  const history = [
    { date: 'Oct 15 - Oct 21', meals: 'Spaghetti, Tacos, Pizza, Salad, Fish, Curry, Burgers' },
    { date: 'Oct 8 - Oct 14', meals: 'Chicken, Rice, Steak, Pasta, Wraps, Soup, Roast' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Meal History</h1>
        <p className="text-slate-500 text-sm mt-1">Look back at past weeks.</p>
      </header>

      <main className="p-4 space-y-4 pt-6">
        {history.map((week, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2">{week.date}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{week.meals}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
