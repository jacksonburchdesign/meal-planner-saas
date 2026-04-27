import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RefreshDouble, Plus, Check, Trash, Xmark } from 'iconoir-react';
import { Button } from '../common';
import { getFunctions, httpsCallable } from 'firebase/functions';

export function SnapRecipeCamera() {
  const [parsing, setParsing] = useState(false);
  const [pendingImages, setPendingImages] = useState<{base64: string, mimeType: string, dataUrl: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file list to array and cap at 5 files maximum (total combined)
    const targetFiles = Array.from(files).slice(0, 5 - pendingImages.length);

    try {
      const parsedImages = await Promise.all(
        targetFiles.map(file => {
          return new Promise<{ base64: string, mimeType: string, dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const base64String = dataUrl.split(',')[1];
                resolve({ base64: base64String, mimeType: 'image/jpeg', dataUrl });
              };
              img.onerror = reject;
              img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      setPendingImages(prev => [...prev, ...parsedImages]);
    } catch (error) {
      console.error(error);
      alert("Failed to process image preview.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImages = async () => {
    if (pendingImages.length === 0) return;
    setParsing(true);
    try {
      const functions = getFunctions();
      const parseScannedRecipe = httpsCallable(functions, 'parseScannedRecipe');
      
      const payload = pendingImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
      await parseScannedRecipe({ images: payload });
      setPendingImages([]); // Clear on success
    } catch (error) {
      console.error(error);
      alert("Failed to parse recipe segments.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <>
      <div className="relative">
        <input 
          type="file" 
          accept="image/*" 
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handleCapture}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          title="Upload or Snap Recipe Photos"
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors active:scale-95"
        >
          <Camera className="w-[22px] h-[22px] stroke-[2]" />
        </button>
      </div>

      {pendingImages.length > 0 && createPortal(
        <div className="fixed inset-0 z-[9999] bg-zinc-900/95 backdrop-blur-xl flex justify-center animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md h-full flex flex-col px-6 pt-6 relative shadow-2xl bg-black/20"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
          <div className="flex justify-between items-center mb-6 mt-[env(safe-area-inset-top)] flex-none">
             <h2 className="text-white text-xl font-bold">Scanned Pages ({pendingImages.length}/2)</h2>
             <button onClick={() => setPendingImages([])} className="p-2 text-zinc-400 hover:text-white transition-colors">
               <Xmark className="w-6 h-6 stroke-[2.5]" />
             </button>
          </div>

          <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
             {pendingImages.map((img, idx) => (
                <div key={idx} className="relative w-[280px] h-full flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                   <img src={img.dataUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg border border-white/10">
                      Page {idx + 1}
                   </div>
                   <button 
                     onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                     className="absolute top-2 right-2 p-2 bg-danger-500/80 hover:bg-danger-500 backdrop-blur-md rounded-full text-white shadow-lg transition-colors border border-white/10"
                   >
                      <Trash className="w-4 h-4 stroke-[2.5]" />
                   </button>
                </div>
             ))}
             {pendingImages.length < 5 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[280px] h-full flex-shrink-0 snap-center rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 flex flex-col items-center justify-center text-white/50 cursor-pointer transition-all"
                >
                   <Plus className="w-10 h-10 mb-2 stroke-[2]" />
                   <span className="font-bold">Add Another Page</span>
                </div>
             )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex gap-3 mb-6 flex-none">
             {pendingImages.length < 2 && (
               <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 py-4 rounded-2xl">
                 Take Another
               </Button>
             )}
             <Button onClick={processImages} disabled={parsing} variant="primary" className="flex-1 bg-primary-500 hover:bg-primary-600 border-primary-500 shadow-primary-500/20 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                 {parsing ? (
                   <>
                     <RefreshDouble className="w-5 h-5 animate-spin" /> Analyzing...
                   </>
                 ) : (
                   <>
                     <Check className="w-5 h-5 stroke-[2.5]" /> Process Recipe
                   </>
                 )}
             </Button>
          </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
