import { useState } from 'react';
import { createFamilyProfile } from '../../services/firestore';

export default function Onboarding() {
  const [familyName, setFamilyName] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('2');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleGenerateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName) return;

    setLoading(true);
    // Simple slug generator
    const slug = familyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const familyId = `fam_${slug}_${Math.floor(Math.random() * 1000)}`;

    try {
      await createFamilyProfile(familyId, {
        subdomain_slug: slug,
        name: familyName,
        demographics: {
          adults: parseInt(adults, 10),
          children: parseInt(children, 10),
        },
        theme: {
          primaryColor,
          secondaryColor: '#10b981' // Hardcoded secondary for now
        }
      });
      // Route the user to their new proprietary PWA subdomain
      const domain = 'mealhouse.app';
      const isLocalhost = window.location.hostname.includes('localhost');
      
      if (isLocalhost) {
        // e.g. smiths.localhost:5173
        const port = window.location.port ? `:${window.location.port}` : '';
        window.location.href = `http://${slug}.localhost${port}`;
      } else {
        window.location.href = `https://${slug}.${domain}`;
      }
    } catch (err) {
      console.error("Failed to generate app", err);
      alert("Failed to generate app. Please check Firebase config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center">Family Setup</h2>
        <p className="text-slate-500 text-center">Let's create your proprietary PWA.</p>
        
        <form className="space-y-4" onSubmit={handleGenerateApp}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Family Name</label>
            <input 
              type="text" 
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
              placeholder="e.g., The Smiths" 
            />
            {familyName && (
              <p className="text-xs text-blue-600 mt-1">App URL: {familyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.mealhouse.app</p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adults</label>
              <input 
                type="number" 
                min="1"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Children</label>
              <input 
                type="number" 
                min="0"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">App Primary Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 border-0 rounded cursor-pointer" 
              />
              <span className="text-sm font-medium text-slate-600">{primaryColor}</span>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:bg-slate-400"
          >
            {loading ? 'Generating Application...' : 'Generate App'}
          </button>
        </form>
      </div>
    </div>
  );
}
