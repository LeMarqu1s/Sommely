/**
 * Optimise une image base64 avant envoi à l'API OpenAI.
 * Réduit la taille = moins de tokens = réponse plus rapide.
 * 1024px + 0.75 : bon compromis vitesse/qualité pour étiquettes.
 */
export async function optimizeImageForAI(
  base64: string,
  maxSize = 1024,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // Fallback de sécurité : si img.onload ne se déclenche jamais (HEIC, WebP non supporté, etc.)
    // on résout avec l'image originale après 5 secondes pour ne jamais bloquer indéfiniment.
    const safetyTimeout = setTimeout(() => resolve(base64), 5000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(safetyTimeout);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const optimized = canvas.toDataURL('image/jpeg', quality).split(',')[1];
      resolve(optimized ?? base64);
    };
    img.onerror = () => {
      clearTimeout(safetyTimeout);
      resolve(base64);
    };
    // Détection MIME plus robuste : JPEG (/9j/), PNG (iVBOR), fallback jpeg
    let mime = 'image/jpeg';
    if (base64.startsWith('iVBOR')) mime = 'image/png';
    img.src = `data:${mime};base64,${base64}`;
  });
}
