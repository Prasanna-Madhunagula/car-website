const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processCars() {
  const artifactDir = 'C:/Users/PRASANNA/.gemini/antigravity/brain/17758b07-0de1-4733-8ad6-8c13cce79c63';
  const outDir = path.join('assets', 'cars');
  fs.mkdirSync(outDir, { recursive: true });

  const mapping = [
    {
      file: 'gt_e_scaled_1793535511765.jpg',
      dest: 'gt-e.webp',
      flip: false
    },
    {
      file: 'noctis_s_side_profile_1793535592193.jpg',
      dest: 's.webp',
      flip: false
    },
    {
      file: 'noctis_x_side_profile_1793535593679.jpg',
      dest: 'x.webp',
      flip: true // make it face right
    },
    {
      file: 'noctis_r_side_profile_1793535599192.jpg',
      dest: 'r.webp',
      flip: true // make it face right
    }
  ];

  for (const item of mapping) {
    const srcPath = path.join(artifactDir, item.file);
    const destPath = path.join(outDir, item.dest);
    if (fs.existsSync(srcPath)) {
      let pipeline = sharp(srcPath);
      if (item.flip) {
        pipeline = pipeline.flop();
      }
      await pipeline
        .resize(1600, 900, { fit: 'cover' })
        .webp({ quality: 82 })
        .toFile(destPath);
      console.log(`Generated: ${destPath}`);
    } else {
      console.warn(`File not found: ${srcPath}`);
    }
  }

  // ONE: concept hypercar uses first dismantle frame as placeholder per instructions
  const oneDest = path.join(outDir, 'one.webp');
  const dismantleFrame1 = path.join('assets', 'frames', 'dismantle', 'frame_0001.webp');
  if (fs.existsSync(dismantleFrame1)) {
    await sharp(dismantleFrame1)
      .resize(1600, 900, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(oneDest);
    console.log(`Generated placeholder for ONE: ${oneDest}`);
  }
}

processCars().catch(console.error);
