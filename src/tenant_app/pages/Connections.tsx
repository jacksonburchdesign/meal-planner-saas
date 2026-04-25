import { useState } from 'react';
import { collection, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button, Input } from '../components/common';
import { db, functions } from '../services/firebase/config';
import { Check, Xmark, Mail, UserPlus, Book } from 'iconoir-react';
import { useTenantData } from '../../context/TenantDataContext';

export function Connections() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { connections, sharedRecipesInbox: sharedRecipes } = useTenantData();

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
      // 1. Add to my recipes
      await addDoc(collection(db, 'recipes'), sharedItem.recipeData);
      // 2. Remove from inbox (or mark as done)
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

  return (
    <PageWrapper title="Family Connections">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Invite Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
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
                <Mail className="w-5 h-5 text-zinc-400" />
              </div>
              <Input
                type="email"
                placeholder="Family member's email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading || !email}>
              {loading ? 'Sending...' : 'Invite'}
            </Button>
          </form>
        </div>

        {/* Shared Recipes Inbox */}
        {sharedRecipes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Shared with Me</h2>
            <div className="space-y-3">
              {sharedRecipes.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
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
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                      title="Decline"
                    >
                      <Xmark className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button 
                      onClick={() => handleApproveSharedRecipe(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm"
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

        {/* Active Connections */}
        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Connected Families</h2>
          {connections.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
              <p className="text-[14px] text-zinc-500 font-medium">You don't have any connections yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {connections.map(conn => (
                <div key={conn.id} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold uppercase">
                    {conn.toFamilyName.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[15px] text-zinc-900">{conn.toFamilyName}</h3>
                    <p className="text-[12px] text-primary-600 font-medium">Connected</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
