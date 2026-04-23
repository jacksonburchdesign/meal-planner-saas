import { createRoot } from 'react-dom/client';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase/config';
import type { ReactElement } from 'react';

/**
 * Generates a PNG representation of a custom Iconoir icon layered over the standard App template.
 * Uploads the result to Firebase Storage under the family's specific identifier, to overwrite their app logo.
 */
export async function generatePngLogoUrl(familyId: string, iconElement: ReactElement, themeColor: string = '#5793d9'): Promise<string> {
  return new Promise((resolve, reject) => {
    const hiddenDiv = document.createElement('div');
    const root = createRoot(hiddenDiv);
    root.render(iconElement);
    
    // Give React time to render the SVG onto the DOM node
    setTimeout(async () => {
      const iconSvgStr = hiddenDiv.innerHTML;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context found'));
      try {
        // 1. Fetch raw template text to dynamically inject precise hex colors
        const templateRes = await fetch('/tenet-logo-template.svg');
        let templateSvgText = await templateRes.text();
        
        // Match exact background colors and override!
        templateSvgText = templateSvgText.replace(/#143d29/ig, themeColor); // Main base color
        
        // 2. Load the modified vector as an image
        const bgImg = new window.Image();
        bgImg.crossOrigin = "anonymous";
        const bgBlob = new Blob([templateSvgText], { type: 'image/svg+xml;charset=utf-8' });
        const bgUrl = URL.createObjectURL(bgBlob);
        
        bgImg.onload = () => {
          // Draw the dynamically colored Template SVG onto our Canvas
          ctx.drawImage(bgImg, 0, 0, 512, 512);
          URL.revokeObjectURL(bgUrl);
          
          const iconImg = new window.Image();
          const svgBlob = new Blob([iconSvgStr], { type: 'image/svg+xml;charset=utf-8' });
        const domUrl = URL.createObjectURL(svgBlob);
        
        iconImg.onload = async () => {
          try {
            // Center the Icon (size 256x256 inside a 512x512 Canvas, so offset by 128)
            ctx.drawImage(iconImg, 128, 128, 256, 256);
            URL.revokeObjectURL(domUrl);
            
            const dataUrl = canvas.toDataURL('image/png');
            const logoRef = ref(storage, `app-logos/${familyId}.png`);
            
            await uploadString(logoRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(logoRef);
            
            resolve(downloadUrl);
          } catch(e) {
            reject(e);
          }
        };
        iconImg.onerror = (e) => reject(new Error('Failed to load inner SVG overlay: ' + e));
        iconImg.src = domUrl;
      };
      bgImg.onerror = (e) => reject(new Error('Failed to load template background SVG: ' + e));
      bgImg.src = bgUrl;
      
      } catch (err) {
        reject(err);
      }
    }, 150);
  });
}
