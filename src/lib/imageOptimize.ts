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
    // Sécurité : si img.onload ne se déclenche jamais (bug mobile), on fallback après 10s
    const safetyTimer = setTimeout(() => resolve(base64), 10000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(safetyTimer);
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
      clearTimeout(safetyTimer);
      resolve(base64);
    };
    const mime = base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    img.src = `data:${mime};base64,${base64}`;
  });
}
