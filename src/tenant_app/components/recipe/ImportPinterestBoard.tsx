import { useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Pinterest, Xmark } from 'iconoir-react';
import { Button, Input } from '../common';
import { useTheme } from '../../../context/ThemeContext';

export function ImportPinterestBoard() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { familyId } = useTheme();

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'pinterestImports'), {
        boardUrl: url,
        status: 'pending',
        urls: [],
        familyId,
        createdAt: serverTimestamp()
      });
      setIsOpen(false);
      setUrl('');
      // Alert user seamlessly
      alert('Pinterest board connected! Watch progress using the Pinterest icon in the navigation bar.');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start Pinterest import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors active:scale-95"
      >
        <Pinterest className="w-[22px] h-[22px] stroke-[2]" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => !loading && setIsOpen(false)} />

          <div className="bg-white/90 backdrop-blur-3xl border-t border-white/40 w-full max-w-sm rounded-[32px] p-6 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[19px] text-zinc-900 tracking-tight">Import Pinterest Board</h3>
              <button onClick={() => !loading && setIsOpen(false)} className="text-zinc-400 p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
                <Xmark className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-[14.5px] text-zinc-500 font-medium leading-relaxed">
                Paste a public Pinterest board URL. Our AI will intelligently extract and import the recipes into your library.
              </p>
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                <p className="text-[13px] text-amber-800 font-medium leading-snug">
                  <strong className="font-bold">Note:</strong> To ensure fast processing, imports are limited to the first <strong className="font-bold">150 recipes</strong> per board. We recommend creating multiple smaller boards if you have hundreds of pins!
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger-50 text-danger-700 text-[14px] font-semibold rounded-xl mb-4 text-center border border-danger-100">
                {error}
              </div>
            )}

            <Input
              type="url"
              placeholder="https://www.pinterest.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="mb-5 !text-[15px]"
            />

            <Button
              variant="primary"
              className="w-full h-[52px] text-[16px] !rounded-2xl"
              onClick={handleImport}
              disabled={loading || !url}
            >
              Start Parsing Board
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
