import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Xmark } from 'iconoir-react';
import { useFamilySettings } from '../../hooks';
import type { SupportedThemeColor } from '../../hooks';

import { Button, Input } from '../common';

export function FamilyProfileModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useFamilySettings();
  const [localName, setLocalName] = useState(settings.familyName);
  const [saving, setSaving] = useState(false);

  // Sync when data loads
  useEffect(() => {
    setLocalName(settings.familyName);
  }, [settings.familyName]);

  const handleSaveName = async () => {
    if (localName.trim() === '' || localName === settings.familyName) return;
    setSaving(true);
    await updateSettings({ familyName: localName.trim() });
    setSaving(false);
  };

  const THEMES: { id: SupportedThemeColor; label: string; hex: string }[] = [
    { id: 'teal', label: 'Teal', hex: '#0097b2' },
    { id: 'rose', label: 'Rose', hex: '#f43f5e' },
    { id: 'orange', label: 'Sunset', hex: '#f97316' },
    { id: 'purple', label: 'Amethyst', hex: '#8b5cf6' },
    { id: 'emerald', label: 'Emerald', hex: '#10b981' },
    { id: 'blue', label: 'Ocean', hex: '#3b82f6' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end p-0">
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      <div className="bg-white w-full h-[90vh] rounded-t-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-8 duration-200 shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)] overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-none pt-2">
          <h3 className="font-bold text-[22px] text-zinc-900 tracking-tight">Family Settings</h3>
          <button onClick={onClose} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
            <Xmark className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-8 pr-2">
          
          {/* Section: Family Name */}
          <div className="space-y-3">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">Family Name</label>
             <div className="flex gap-2">
               <Input 
                 value={localName} 
                 onChange={e => setLocalName(e.target.value)} 
                 className="flex-1 !font-bold !text-[16px]" 
                 placeholder="e.g. The Smiths" 
               />
               {localName !== settings.familyName && (
                 <Button onClick={handleSaveName} disabled={saving} className="px-5">
                   {saving ? '...' : 'Save'}
                 </Button>
               )}
             </div>
          </div>

          {/* Section: Theme Colors */}
          <div className="space-y-3 pt-2">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">App Theme Color</label>
             <p className="text-[13px] text-zinc-500 font-medium mb-3 leading-relaxed">Customize the buttons, accents, and links across every screen. This synchronizes automatically across everyone's devices.</p>
             <div className="grid grid-cols-3 gap-3">
               {THEMES.map(theme => {
                 const isActive = settings.themeColor === theme.id;
                 return (
                   <button
                     key={theme.id}
                     onClick={() => updateSettings({ themeColor: theme.id })}
                     className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${isActive ? 'bg-primary-50/50 border-primary-200 shadow-sm' : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'}`}
                   >
                     <div 
                       className="w-10 h-10 rounded-full shadow-inner border border-black/5" 
                       style={{ backgroundColor: theme.hex }}
                     />
                     <span className={`text-[12px] font-bold tracking-tight ${isActive ? 'text-primary-700' : 'text-zinc-500'}`}>
                       {theme.label}
                     </span>
                   </button>
                 );
               })}
             </div>
          </div>



        </div>
      </div>
    </div>,
    document.body
  );
}
