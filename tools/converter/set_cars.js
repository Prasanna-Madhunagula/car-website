const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function setPlaceholders() {
  const base = path.join('assets', 'frames', 'dismantle', 'frame_0001.webp');
  const cars = ['s', 'x', 'r', 'one'];
  for (const car of cars) {
    const dest = path.join('assets', 'cars', car + '.webp');
    if (!fs.existsSync(dest)) {
      await sharp(base)
        .resize(1600, 900, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(dest);
      console.log('Set placeholder for', dest);
    }
  }
}

setPlaceholders().catch(console.error);
