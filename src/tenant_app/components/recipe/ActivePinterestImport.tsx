import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Pinterest, Xmark, Check } from 'iconoir-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../../../context/ThemeContext';

interface QueuedUrl {
  link: string;
  status: 'pending' | 'success' | 'error';
  recipeId?: string;
  errorMsg?: string;
}

interface PinterestImportData {
  id: string;
  boardUrl: string;
  status: 'pending' | 'extracting' | 'processing' | 'done' | 'archived' | 'cancelled';
  urls: QueuedUrl[];
}

export function ActivePinterestImport() {
  const [activeImport, setActiveImport] = useState<PinterestImportData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { familyId } = useTheme();

  useEffect(() => {
    if (!familyId) return;

    // Listen for any active import where status works, scoped to family
    const q = query(
      collection(db, 'pinterestImports'),
      where('familyId', '==', familyId),
      where('status', 'in', ['pending', 'extracting', 'processing', 'done'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Just take the first active one
        const doc = snapshot.docs[0];
        setActiveImport({ id: doc.id, ...doc.data() } as PinterestImportData);
      } else {
        setActiveImport(null);
        setIsOpen(false);
      }
    });

    return () => unsubscribe();
  }, [familyId]);

  if (!activeImport) return null;

  const total = activeImport.urls?.length || 0;
  const completed = activeImport.urls?.filter(u => u.status !== 'pending').length || 0;

  const handleDismiss = async () => {
    setIsOpen(false);
    try {
      await updateDoc(doc(db, 'pinterestImports', activeImport.id), { status: 'archived' });
    } catch(e) { console.error(e) }
  };

  const handleCancel = async () => {
    setIsOpen(false);
    try {
      await updateDoc(doc(db, 'pinterestImports', activeImport.id), { status: 'cancelled' });
    } catch(e) { console.error(e) }
  };

  const isDone = activeImport.status === 'done';

  return (
    <>
      {/* Floating Indicator pinned above typical Navbar elements or in corner */}
      <div className="fixed bottom-24 right-4 z-[45]">
        <button
          onClick={() => setIsOpen(true)}
          className={`bg-white rounded-full p-2.5 shadow-lg border flex items-center justify-center gap-2 transition-colors ${
            isDone ? 'text-success-600 border-success-200 hover:bg-success-50' : 'text-primary-600 border-primary-100 hover:bg-primary-50'
          }`}
        >
          <Pinterest className={`w-6 h-6 stroke-[2.5] ${!isDone && 'animate-pulse'}`} />
          {activeImport.status === 'processing' && total > 0 && (
             <span className="text-xs font-bold mr-1">{completed}/{total}</span>
          )}
        </button>
      </div>

      {/* Live Queue Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />

          <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-sm max-h-[80vh] flex flex-col rounded-[32px] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                 <Pinterest className={`w-5 h-5 stroke-[2] ${isDone ? 'text-success-600' : 'text-primary-600 animate-pulse'}`} />
                 <h3 className="font-bold text-[18px] text-zinc-900 tracking-tight">{isDone ? 'Import Complete' : 'Board Import Live'}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                <Xmark className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-zinc-50/50">
              {activeImport.status === 'pending' || activeImport.status === 'extracting' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                  <Pinterest className="w-10 h-10 animate-pulse text-zinc-300 mb-4" />
                  <p className="font-medium text-sm animate-pulse">Extracting recipe URLs from board...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activeImport.urls?.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded-xl shadow-sm border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border bg-zinc-50 border-zinc-200">
                          {item.status === 'success' && <Check className="w-3.5 h-3.5 text-success-600 stroke-[3]" />}
                          {item.status === 'error' && <Xmark className="w-3.5 h-3.5 text-danger-600 stroke-[3]" />}
                          {item.status === 'pending' && <span className="w-2 h-2 rounded-full bg-zinc-300 animate-ping" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-zinc-600 truncate">{item.link.replace(/^https?:\/\//, '')}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'error' ? 'text-danger-500' : 'text-zinc-400'}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.status === 'error' && item.errorMsg && (
                        <p className="text-[11px] text-danger-600 bg-danger-50 p-2 rounded-lg mt-1 break-words">
                          {item.errorMsg}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-zinc-100 flex-shrink-0">
               {isDone ? (
                  <button 
                    onClick={handleDismiss}
                    className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-2xl transition-colors"
                  >
                    Dismiss Queue
                  </button>
               ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[12px] font-medium text-zinc-400 text-center">You can safely close the app while this works.</p>
                    <button 
                      onClick={handleCancel}
                      className="w-full bg-danger-50 hover:bg-danger-100 text-danger-700 font-bold py-2.5 rounded-2xl transition-colors text-sm"
                    >
                      Cancel Import
                    </button>
                  </div>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
