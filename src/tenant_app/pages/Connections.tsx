import { useState, useEffect } from 'react';
import { collection, doc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PageWrapper } from '../components/layout/PageWrapper';
import { db, functions } from '../services/firebase/config';
import { Check, Xmark, Mail, UserPlus, Book, MoreHoriz } from 'iconoir-react';
import { useTenantData } from '../../context/TenantDataContext';
import { useTheme } from '../../context/ThemeContext';
import { useFamilySettings } from '../hooks';

function PendingRequestItem({ req, handleRespond }: { req: any, handleRespond: (id: string, accept: boolean) => void }) {
  const [currentName, setCurrentName] = useState<string | null>(null);
  const { primaryColor } = useTheme();
  
  useEffect(() => {
    if (!req.fromFamilyId) return;
    getDoc(doc(db, 'families', req.fromFamilyId)).then(d => {
      if (d.exists() && d.data().familyName) {
        setCurrentName(d.data().familyName);
      }
    }).catch(console.error);
  }, [req.fromFamilyId]);

  const displayName = currentName || req.fromFamilyName;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex items-center gap-4">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0"
        style={{ backgroundColor: (primaryColor || '#3b82f6') + '15', color: primaryColor || '#3b82f6' }}
      >
        {displayName.substring(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-[15px] text-zinc-900 truncate">{displayName}</h3>
        <p className="text-[12px] text-zinc-500 font-medium truncate">
          wants to connect
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => req.id && handleRespond(req.id, false)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          title="Decline"
        >
          <Xmark className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button 
          onClick={() => req.id && handleRespond(req.id, true)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors shadow-sm active:scale-95"
          style={{ backgroundColor: primaryColor || '#3b82f6' }}
          title="Accept"
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}

function ConnectionItem({ conn, familyId, onDisconnect }: { conn: any, familyId: string, onDisconnect: (id: string) => void }) {
  const [partnerFamily, setPartnerFamily] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const otherId = conn.toFamilyId === familyId ? conn.fromFamilyId : conn.toFamilyId;
  const initialName = conn.toFamilyId === familyId ? conn.fromFamilyName : conn.toFamilyName;

  useEffect(() => {
    if (!otherId) return;
    getDoc(doc(db, 'families', otherId)).then(d => {
      if (d.exists()) {
        setPartnerFamily(d.data());
      }
    }).catch(console.error);
  }, [otherId]);

  const displayName = partnerFamily?.familyName || initialName;
  const partnerColor = partnerFamily?.theme?.primaryColor || '#3b82f6';

  return (
    <div className="relative bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm ring-1 ring-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-stone-600 transition-colors z-10"
        title="Options"
      >
        <MoreHoriz className="w-5 h-5 stroke-[2]" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-10 right-2 z-30 bg-white shadow-lg ring-1 ring-black/5 rounded-xl min-w-[120px] overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => {
                setMenuOpen(false);
                onDisconnect(conn.id);
              }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      )}

      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl uppercase flex-shrink-0 mb-3"
        style={{ backgroundColor: partnerColor + '15', color: partnerColor }}
      >
        {partnerFamily?.logo ? (
          <img src={partnerFamily.logo} alt={displayName} className="w-full h-full object-cover rounded-full" />
        ) : (
          displayName.substring(0, 2)
        )}
      </div>

      <h3 className="font-semibold text-stone-800 text-sm w-full truncate">{displayName}</h3>
      <p className="text-emerald-600 text-xs font-medium mt-1">Connected</p>
    </div>
  );
}

export function Connections() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { connections, sharedRecipesInbox: sharedRecipes } = useTenantData();
  const { settings } = useFamilySettings();
  const { familyId, primaryColor } = useTheme();

  const activeConnections = Array.from(new Map(
    connections.filter(c => c.status === 'active').map(c => {
      const otherId = c.toFamilyId === familyId ? c.fromFamilyId : c.toFamilyId;
      return [otherId, c];
    })
  ).values());
  const pendingIncoming = connections.filter(c => c.status === 'pending' && c.toFamilyId === familyId);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const sendReq = httpsCallable(functions, 'sendConnectionRequest');
      await sendReq({ email });
      setEmail('');
      alert('Connection request sent!');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSharedRecipe = async (sharedItem: any) => {
    try {
      await addDoc(collection(db, 'recipes'), sharedItem.recipeData);
      await deleteDoc(doc(db, 'sharedRecipes', sharedItem.id));
      alert('Recipe added to your library!');
    } catch (error) {
      console.error(error);
      alert('Failed to save recipe');
    }
  };

  const handleDeclineSharedRecipe = async (sharedItemId: string) => {
    try {
      await deleteDoc(doc(db, 'sharedRecipes', sharedItemId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRespondConnection = async (connectionId: string, accept: boolean) => {
    try {
      const respondFn = httpsCallable(functions, 'respondToConnection');
      await respondFn({ connectionId, accept });
    } catch (error) {
      console.error(error);
      alert('Failed to respond to connection request');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!window.confirm('Are you sure you want to disconnect from this family? This will stop future recipe sharing.')) return;
    try {
      await deleteDoc(doc(db, 'familyConnections', connectionId));
    } catch (error) {
      console.error(error);
      alert('Failed to disconnect from family.');
    }
  };

  return (
    <PageWrapper title={`${settings?.familyName || 'Family'} Connections`}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Invite Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: (primaryColor || '#3b82f6') + '20', color: primaryColor || '#3b82f6' }}
            >
              <UserPlus className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Connect with a Family</h2>
              <p className="text-[13px] text-zinc-500 font-medium">Share recipes easily once connected.</p>
            </div>
          </div>
          
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-stone-400" />
              </div>
              <input
                type="email"
                placeholder="Family member's email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-none"
                style={{ '--tw-ring-color': primaryColor || '#3b82f6' } as React.CSSProperties}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !email}
              className="text-white font-medium px-6 py-3 rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor || '#3b82f6' }}
            >
              {loading ? 'Sending...' : 'Invite'}
            </button>
          </form>
        </div>

        {/* Shared Recipes Inbox */}
        {sharedRecipes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Shared with Me</h2>
            <div className="space-y-3">
              {sharedRecipes.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (primaryColor || '#3b82f6') + '15', color: primaryColor || '#3b82f6' }}
                  >
                    <Book className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-zinc-900 truncate">{item.recipeData.title}</h3>
                    <p className="text-[12px] text-zinc-500 font-medium truncate">
                      Shared by {item.fromFamilyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeclineSharedRecipe(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                      title="Decline"
                    >
                      <Xmark className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button 
                      onClick={() => handleApproveSharedRecipe(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors shadow-sm active:scale-95"
                      style={{ backgroundColor: primaryColor || '#3b82f6' }}
                      title="Save to Library"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Connection Requests */}
        {pendingIncoming.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Connection Requests</h2>
            <div className="space-y-3">
              {pendingIncoming.map(req => (
                <PendingRequestItem key={req.id} req={req} handleRespond={handleRespondConnection} />
              ))}
            </div>
          </div>
        )}

        {/* Active Connections */}
        <div>
          <h2 className="text-lg font-bold text-zinc-900 mt-8 mb-3 px-1">Connected Families</h2>
          {activeConnections.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
              <p className="text-[14px] text-stone-500 font-medium">You don't have any connections yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {activeConnections.map(conn => (
                <ConnectionItem key={conn.id} conn={conn} familyId={familyId || ''} onDisconnect={handleDisconnect} />
              ))}
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
