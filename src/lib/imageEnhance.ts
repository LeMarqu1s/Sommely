/**
 * Améliore une image base64 (pour import fichier). Retourne la nouvelle image base64.
 */
export async function enhanceBase64Image(base64: string): Promise<string> {
  return new Promise((resolve, _reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0);
      enhanceImageForRecognition(ctx, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.95).split(',')[1] ?? base64);
    };
    img.onerror = () => resolve(base64);
    const mime = base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    img.src = `data:${mime};base64,${base64}`;
  });
}

/**
 * Améliore les images de mauvaise qualité pour faciliter la reconnaissance par l'IA.
 * Gère : images sombres, faible contraste, sous-exposition.
 */
export function enhanceImageForRecognition(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let sumL = 0;
  const step = 16;
  let count = 0;
  for (let i = 0; i < data.length; i += step) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sumL += 0.299 * r + 0.587 * g + 0.114 * b;
    count++;
  }
  const avgLuminance = sumL / count;

  const isDark = avgLuminance < 90;
  const isLowContrast = avgLuminance >= 90 && avgLuminance < 140;

  if (!isDark && !isLowContrast) return;

  const brightness = isDark ? 50 : 20;
  const contrast = isDark ? 1.35 : 1.15;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = ((r / 255 - 0.5) * contrast + 0.5) * 255 + brightness;
    g = ((g / 255 - 0.5) * contrast + 0.5) * 255 + brightness;
    b = ((b / 255 - 0.5) * contrast + 0.5) * 255 + brightness;

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imageData, 0, 0);
}
