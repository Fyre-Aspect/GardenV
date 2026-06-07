/**
 * Tiny client-side image helpers. Photos are stored inline in the user's
 * Firestore garden doc, so they must be downscaled hard to stay well under the
 * 1 MB document limit even with several companions.
 */

/** Read a picked File into a data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale a data URL to at most `maxDim` on its longest edge and re-encode as
 * JPEG. A 400px / 0.78-quality thumbnail lands around 30–60 KB — small enough to
 * keep many of them inline in one Firestore doc.
 */
export function downscaleDataUrl(
  dataUrl: string,
  maxDim = 400,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = dataUrl;
  });
}
