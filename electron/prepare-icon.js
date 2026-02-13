/**
 * Builds the app icon: black logo on white, rounded corners, proper safe zone.
 * macOS expects content inset from edges so the Dock shows icons at uniform size.
 * Run from electron folder: npm run prepare-icon
 */
const path = require('path');
const fs = require('fs');

const dir = __dirname;
const sourcePath = path.join(dir, 'icon-source.png');
const outPath = path.join(dir, 'icon.png');

const SIZE = 512;
// Safe zone: leave margin so Dock displays this icon same size as others (doesn't cover the dot)
const OUTER_INSET = 38;
const INNER_SIZE = SIZE - OUTER_INSET * 2;
const RADIUS = 100;
const STROKE = 3;
const STROKE_COLOR = '#B0B0B0';
const PADDING = 36;
const logoSize = INNER_SIZE - PADDING * 2;
const BG = '#FFFFFF';

async function main() {
  const sharp = require('sharp');

  if (!fs.existsSync(sourcePath)) {
    console.error('icon-source.png not found. Copy public/Soradin.png to electron/icon-source.png');
    process.exit(1);
  }

  // Rounded rect with stroke, drawn at OUTER_INSET so there's margin on the 512 canvas
  const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${OUTER_INSET + STROKE / 2}" y="${OUTER_INSET + STROKE / 2}" 
        width="${INNER_SIZE - STROKE}" height="${INNER_SIZE - STROKE}" 
        rx="${RADIUS}" ry="${RADIUS}" 
        fill="${BG}" stroke="${STROKE_COLOR}" stroke-width="${STROKE}" />
</svg>`;

  const roundedBg = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  const logo = await sharp(sourcePath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const logoTop = OUTER_INSET + PADDING;
  const logoLeft = OUTER_INSET + PADDING;

  await sharp(roundedBg)
    .composite([{ input: logo, top: logoTop, left: logoLeft }])
    .png({ density: 72 })
    .toFile(outPath);

  console.log('Created icon.png (with safe zone for Dock) at', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
