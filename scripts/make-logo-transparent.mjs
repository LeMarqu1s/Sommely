/**
 * Rend le fond blanc du logo transparent pour un affichage correct sur fonds sombres
 * Usage: node scripts/make-logo-transparent.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = join(__dirname, '../public/IMG_1639.png');

const image = sharp(input);
const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const threshold = 245; // Pixels avec R,G,B > 245 considérés comme "blanc"

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    data[i + 3] = 0; // Transparent
  }
}

const outputPath = join(__dirname, '../public/IMG_1639-transparent.png');
await sharp(Buffer.from(data), {
  raw: { width, height, channels: 4 }
})
  .png()
  .toFile(outputPath);

console.log('✓ Logo avec fond transparent créé: public/IMG_1639-transparent.png');
