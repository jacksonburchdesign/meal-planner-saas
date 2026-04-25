import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Xmark, 
  CreditCard,
  OpenNewWindow
} from 'iconoir-react';
import { useFamilySettings } from '../../hooks';
import { useTheme } from '../../../context/ThemeContext';
import { Button, Input } from '../common';
import { generatePngLogoUrl } from '../../utils/logoUtils';

import { SHARED_ICON_OPTIONS as ICONS_LIST } from '../../../utils/icons';

export function FamilyProfileModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useFamilySettings();
  const { familyId } = useTheme();
  
  const [localName, setLocalName] = useState(settings.familyName);
  const [localColor, setLocalColor] = useState(settings.themeColor);
  const [adults, setAdults] = useState(settings.demographics?.adults || 2);
  const [children, setChildren] = useState(settings.demographics?.children || 0);
  const [localEmails, setLocalEmails] = useState<string[]>(settings.authorizedEmails || []);
  const [emailInput, setEmailInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [demoSaving, setDemoSaving] = useState(false);
  const [emailsSaving, setEmailsSaving] = useState(false);
  const [iconGenerating, setIconGenerating] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Sync when data loads
  useEffect(() => {
    setLocalName(settings.familyName);
    setLocalColor(settings.themeColor);
    setAdults(settings.demographics?.adults || 2);
    setChildren(settings.demographics?.children || 0);
    setLocalEmails(settings.authorizedEmails || []);
  }, [settings]);

  const handleSaveName = async () => {
    if (localName.trim() === '' || localName === settings.familyName) return;
    setSaving(true);
    await updateSettings({ familyName: localName.trim() });
    setSaving(false);
  };

  const handleSaveDemographics = async () => {
    setDemoSaving(true);
    await updateSettings({ demographics: { adults, children } });
    setDemoSaving(false);
  };

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const raw = emailInput;
      setEmailInput('');
      const toAdd = raw.split(/[\s,]+/).map(p => p.trim().toLowerCase()).filter(p => p && p.includes('@'));
      if (toAdd.length > 0) {
        setLocalEmails(prev => {
          const distinct = new Set([...prev, ...toAdd]);
          return Array.from(distinct);
        });
      }
    }
  };

  const removeEmail = (email: string) => {
    setLocalEmails(localEmails.filter(e => e !== email));
  };

  const handleSaveEmails = async () => {
    setEmailsSaving(true);
    await updateSettings({ authorizedEmails: localEmails });
    setEmailsSaving(false);
  };

  const diffEmails = JSON.stringify(localEmails) !== JSON.stringify(settings.authorizedEmails || []);

  // Debounced Color Saving
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localColor !== settings.themeColor) {
         updateSettings({ themeColor: localColor }).catch(console.error);
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [localColor, settings.themeColor, updateSettings]);

  const handleSelectIcon = async (SelectedIcon: React.ElementType, iconName: string) => {
    if (!familyId) return;
    setIconGenerating(true);
    try {
       const dynamicColor = localColor || settings.themeColor || "#5793d9";
       const newIconUrl = await generatePngLogoUrl(familyId, <SelectedIcon width="100%" height="100%" color={dynamicColor} strokeWidth={1.5} />, dynamicColor);
       await updateSettings({ iconUrl: newIconUrl, iconName });
    } catch (err) {
       console.error("Failed to generate updated logo", err);
       alert("Failed to create the Family App Logo. Please try again.");
    } finally {
       setIconGenerating(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!familyId) return;
    setPortalLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_STRIPE_API_URL || 'https://api-yr7sfhb5va-uc.a.run.app';
      const returnUrl = window.location.href;
      
      const response = await fetch(`${BASE_URL}/create-customer-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, returnUrl })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to load subscription portal.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load subscription portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end p-0 items-center">
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200 w-full" 
        onClick={onClose} 
      />

      {/* Glassmorphism Settings Modal */}
      <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-md h-[90vh] rounded-t-[32px] p-6 relative z-10 animate-in slide-in-from-bottom-8 duration-200 shadow-2xl flex flex-col pb-[env(safe-area-inset-bottom)] overflow-hidden">
        
        {/* Loading Spinner Overlay for Icon Generation */}
        {iconGenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center opacity-100 transition-opacity">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="font-bold tracking-tight text-zinc-900">Updating App Icon...</p>
            <p className="text-zinc-400 text-sm font-medium mt-1">Stamping your logo in the database.</p>
          </div>
        )}

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
                 className="flex-1 !font-bold !text-[16px] bg-white/50 backdrop-blur-sm" 
                 placeholder="e.g. The Smiths" 
               />
               {(localName !== settings.familyName) && (
                 <Button onClick={handleSaveName} disabled={saving} className="px-5 shadow-sm">
                   {saving ? '...' : 'Save'}
                 </Button>
               )}
             </div>
          </div>

          {/* Section: Demographics */}
          <div className="space-y-3 pt-2">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">Demographics</label>
             <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">Adjust your family count so the AI meal planner scales recipes accurately.</p>
             <div className="flex gap-4 items-end">
                <div className="flex-1">
                   <label className="block text-[11px] font-bold text-zinc-500 mb-1">Adults</label>
                   <Input 
                     type="number" min={1} max={10} 
                     value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} 
                     className="w-full bg-white/50 backdrop-blur-sm text-center" 
                   />
                </div>
                <div className="flex-1">
                   <label className="block text-[11px] font-bold text-zinc-500 mb-1">Children</label>
                   <Input 
                     type="number" min={0} max={15} 
                     value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)} 
                     className="w-full bg-white/50 backdrop-blur-sm text-center" 
                   />
                </div>
                {(adults !== (settings.demographics?.adults || 2) || children !== (settings.demographics?.children || 0)) && (
                   <Button onClick={handleSaveDemographics} disabled={demoSaving} className="px-5 shadow-sm">
                     {demoSaving ? '...' : 'Save'}
                   </Button>
                )}
             </div>
          </div>

          {/* Section: Custom Theme Color */}
          <div className="space-y-3 pt-2">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">App Theme Color</label>
             <p className="text-[13px] text-zinc-500 font-medium mb-3 leading-relaxed">Select any color to customize buttons and accents. This syncs across everyone's devices.</p>
             <div className="flex items-center gap-4">
                <input 
                   type="color" 
                   value={localColor} 
                   onChange={(e) => setLocalColor(e.target.value)} 
                   className="w-[100%] h-14 rounded-2xl cursor-pointer bg-white/50 backdrop-blur-sm p-1 border border-zinc-200" 
                />
             </div>
          </div>

          {/* Section: Family Logo */}
          <div className="space-y-3 pt-2">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">App Logo Icon</label>
             <p className="text-[13px] text-zinc-500 font-medium mb-3 leading-relaxed">Choose an icon to represent your family vault.</p>
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 bg-white/40 p-4 rounded-3xl border border-white/60 max-h-[300px] overflow-y-auto">
               {ICONS_LIST.map(({ id, name, icon: IconComp }) => {
                 const isActive = settings.iconName === name;
                 return (
                  <button
                    key={id}
                    onClick={() => handleSelectIcon(IconComp, name)}
                    className={`flex items-center justify-center aspect-square rounded-2xl bg-white transition-all active:scale-95 shadow-sm border-[2px] ${isActive ? 'border-[var(--tenant-color-primary)] ring-2 ring-[var(--tenant-color-primary)]/20' : 'border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50'}`}
                  >
                    <IconComp className={`w-7 h-7 stroke-[1.5] ${isActive ? 'text-[var(--tenant-color-primary)]' : 'text-zinc-700'}`} />
                  </button>
                 );
               })}
             </div>
          </div>

           {/* Section: Authorized Emails */}
           <div className="space-y-3 pt-2">
              <label className="flex items-center gap-1.5 block text-[12px] font-bold tracking-widest text-zinc-400 uppercase">
                 Authorized Members
              </label>
              <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">Only these specific email addresses will be permitted to access your family's app vault.</p>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-zinc-200 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                     {localEmails.map(email => (
                       <div key={email} className="flex items-center gap-1.5 bg-white shadow-sm px-3 py-1.5 rounded-full text-[12px] font-semibold text-zinc-700 border border-zinc-100">
                         {email}
                         <Xmark width={12} height={12} strokeWidth={3} className="cursor-pointer text-zinc-400 hover:text-rose-500 transition-colors" onClick={() => removeEmail(email)} />
                       </div>
                     ))}
                     <input
                       value={emailInput}
                       onChange={e => setEmailInput(e.target.value)}
                       onKeyDown={handleAddEmail}
                       placeholder={localEmails.length === 0 ? "Enter emails separated by commas" : "Add another..."}
                       className="border-none bg-transparent outline-none text-[13px] font-medium text-zinc-700 flex-1 min-w-[150px] placeholder:text-zinc-400"
                     />
                  </div>
                  {diffEmails && (
                     <div className="flex justify-end pt-1">
                        <Button onClick={handleSaveEmails} disabled={emailsSaving} className="px-5 shadow-sm text-[13px] h-8 bg-zinc-800 hover:bg-zinc-900">
                          {emailsSaving ? 'Saving...' : 'Save Member List'}
                        </Button>
                     </div>
                  )}
              </div>
           </div>

           {/* Section: Subscription Management */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
             <label className="block text-[12px] font-bold tracking-widest text-zinc-400 uppercase drop-shadow-sm flex items-center justify-between">
                Billing & Subscription
                {settings.stripeCustomerId && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded border border-emerald-200/50">Active</span>}
             </label>
             <p className="text-[13px] text-zinc-500 font-medium leading-relaxed">Update your payment method, view invoices, or cancel your subscription.</p>
             <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading || !settings.stripeCustomerId}
                className="w-full flex items-center justify-center gap-2 bg-white/60 hover:bg-white"
             >
                <CreditCard className="w-5 h-5 stroke-[2]" />
                {portalLoading ? 'Loading Portal...' : 'Manage Subscription'}
                <OpenNewWindow className="w-4 h-4 ml-auto text-zinc-400 stroke-[2]" />
             </Button>
             {!settings.stripeCustomerId && (
                <p className="text-[11px] text-rose-500 text-center font-medium mt-2">No active billing account found.</p>
             )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
