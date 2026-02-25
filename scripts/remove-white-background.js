/**
 * Make near-white/beige pixels transparent in card images so icons blend with the page.
 * Run: node scripts/remove-white-background.js
 */
const sharp = require('sharp');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const IMAGES = ['browse-card-image.png', 'review-image.png', 'booking-image.png'];

// Pixels with R,G,B all >= this will become transparent (removes white and light beige)
const WHITE_THRESHOLD = 238;

function processImage(filename) {
  const inputPath = path.join(publicDir, filename);
  return sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height, channels } = info;
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
          data[i + 3] = 0;
        }
      }
      return sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(inputPath);
    })
    .then(() => {
      console.log('Done:', filename);
    });
}

Promise.all(IMAGES.map(processImage)).catch((err) => {
  console.error(err);
  process.exit(1);
});
