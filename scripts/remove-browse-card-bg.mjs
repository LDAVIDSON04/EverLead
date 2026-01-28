/**
 * Makes near-white and light-grey pixels in browse-card-image.png transparent
 * so the cartoon blends into the page without checkerboard/background.
 * Run: node scripts/remove-browse-card-bg.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const inputPath = join(root, 'public', 'browse-card-image.png');
const outputPath = inputPath;

// Lightness threshold: pixels with R,G,B all above this become transparent.
// 200 = remove white AND light grey checkerboard; keep cartoon colors.
const LIGHT_THRESHOLD = 200;
// Also remove pixels that are already very transparent (alpha < 20).
const ALPHA_THRESHOLD = 20;

async function main() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Make pixel transparent if it's background: very light and low saturation
    const isLight = r >= LIGHT_THRESHOLD && g >= LIGHT_THRESHOLD && b >= LIGHT_THRESHOLD;
    const isLowSaturation = Math.max(r, g, b) - Math.min(r, g, b) < 35;
    const isAlreadyFaded = a < ALPHA_THRESHOLD;

    if ((isLight && isLowSaturation) || isAlreadyFaded) {
      out[i + 3] = 0;
    }
  }

  await sharp(out, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(outputPath);

  console.log('Done. browse-card-image.png background stripped.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
