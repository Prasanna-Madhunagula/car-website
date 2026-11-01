const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Natural sort helper
function naturalSort(arr) {
  return [...arr].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

// Find input directory helper
function findDir(preferred, fallback) {
  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(fallback)) return fallback;
  throw new Error(`Directory not found: neither "${preferred}" nor "${fallback}" exists.`);
}

async function areNearlyIdentical(fileA, fileB, threshold = 1.0) {
  try {
    const [bufA, bufB] = await Promise.all([
      sharp(fileA).resize(64, 36).raw().toBuffer(),
      sharp(fileB).resize(64, 36).raw().toBuffer()
    ]);
    let diff = 0;
    for (let i = 0; i < bufA.length; i++) {
      diff += Math.abs(bufA[i] - bufB[i]);
    }
    const avgDiff = diff / bufA.length;
    console.log(`Comparing ${path.basename(fileA)} vs ${path.basename(fileB)}: avgDiff = ${avgDiff.toFixed(2)}`);
    return avgDiff < threshold;
  } catch (err) {
    console.error('Comparison error:', err);
    return false;
  }
}

async function convertFrame(inputPath, desktopPath, mobilePath) {
  const image = sharp(inputPath);
  await Promise.all([
    image.clone()
      .resize({ width: 1600, withoutEnlargement: false })
      .webp({ quality: 78, effort: 4 })
      .toFile(desktopPath),
    image.clone()
      .resize({ width: 960, withoutEnlargement: false })
      .webp({ quality: 72, effort: 4 })
      .toFile(mobilePath)
  ]);
}

async function getDirSize(dir) {
  const files = fs.readdirSync(dir);
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += fs.statSync(path.join(dir, f)).size;
  }
  return { count: files.length, bytes: totalBytes, mb: (totalBytes / (1024 * 1024)).toFixed(2) };
}

async function main() {
  console.log('--- STARTING FRAME PREPARATION ---');

  const clip1Dir = findDir(path.join('frames', 'hero section', 'clip 1'), 'clip-1zip');
  const clip2Dir = findDir(path.join('frames', 'hero section', 'clip 2'), 'clip-2zip');
  const clip3Dir = findDir(path.join('frames', 'hero section', 'clip 3'), 'clip-3zip');
  const dismantleDir = findDir(path.join('frames', 'dismantle'), 'e-zip');

  console.log('Source folders:');
  console.log(' Clip 1:', clip1Dir);
  console.log(' Clip 2:', clip2Dir);
  console.log(' Clip 3:', clip3Dir);
  console.log(' Dismantle:', dismantleDir);

  const clip1Files = naturalSort(fs.readdirSync(clip1Dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f))).map(f => path.join(clip1Dir, f));
  const clip2Files = naturalSort(fs.readdirSync(clip2Dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f))).map(f => path.join(clip2Dir, f));
  const clip3Files = naturalSort(fs.readdirSync(clip3Dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f))).map(f => path.join(clip3Dir, f));
  const dismantleFiles = naturalSort(fs.readdirSync(dismantleDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f))).map(f => path.join(dismantleDir, f));

  console.log(`Found: Clip 1 = ${clip1Files.length}, Clip 2 = ${clip2Files.length}, Clip 3 = ${clip3Files.length}, Dismantle = ${dismantleFiles.length}`);

  // Build Hero sequence
  const heroSequence = [...clip1Files];

  // Check seam 1->2
  if (clip1Files.length > 0 && clip2Files.length > 0) {
    const isDup12 = await areNearlyIdentical(clip1Files[clip1Files.length - 1], clip2Files[0]);
    if (isDup12) {
      console.log('Skipping first frame of Clip 2 (near identical to last frame of Clip 1)');
      heroSequence.push(...clip2Files.slice(1));
    } else {
      console.log('Keeping first frame of Clip 2');
      heroSequence.push(...clip2Files);
    }
  }

  // Check seam 2->3
  if (heroSequence.length > 0 && clip3Files.length > 0) {
    const isDup23 = await areNearlyIdentical(heroSequence[heroSequence.length - 1], clip3Files[0]);
    if (isDup23) {
      console.log('Skipping first frame of Clip 3 (near identical to last frame of Clip 2)');
      heroSequence.push(...clip3Files.slice(1));
    } else {
      console.log('Keeping first frame of Clip 3');
      heroSequence.push(...clip3Files);
    }
  }

  console.log(`Total Hero sequence frames: ${heroSequence.length}`);
  console.log(`Total Dismantle sequence frames: ${dismantleFiles.length}`);

  // Destination folders
  const heroDesktopDir = path.join('assets', 'frames', 'hero');
  const heroMobileDir = path.join('assets', 'frames', 'hero-mobile');
  const dismantleDesktopDir = path.join('assets', 'frames', 'dismantle');
  const dismantleMobileDir = path.join('assets', 'frames', 'dismantle-mobile');

  [heroDesktopDir, heroMobileDir, dismantleDesktopDir, dismantleMobileDir].forEach(d => {
    fs.mkdirSync(d, { recursive: true });
  });

  // Convert Hero in parallel batches
  console.log('\n--- Converting Hero frames ---');
  const CONCURRENCY = 12;
  for (let i = 0; i < heroSequence.length; i += CONCURRENCY) {
    const batch = heroSequence.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((src, idx) => {
      const frameNum = String(i + idx + 1).padStart(4, '0');
      const desk = path.join(heroDesktopDir, `frame_${frameNum}.webp`);
      const mob = path.join(heroMobileDir, `frame_${frameNum}.webp`);
      return convertFrame(src, desk, mob);
    }));
    process.stdout.write(`Hero: ${Math.min(i + CONCURRENCY, heroSequence.length)} / ${heroSequence.length}\r`);
  }
  console.log(`\nHero conversion complete!`);

  // Convert Dismantle in parallel batches
  console.log('\n--- Converting Dismantle frames ---');
  for (let i = 0; i < dismantleFiles.length; i += CONCURRENCY) {
    const batch = dismantleFiles.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((src, idx) => {
      const frameNum = String(i + idx + 1).padStart(4, '0');
      const desk = path.join(dismantleDesktopDir, `frame_${frameNum}.webp`);
      const mob = path.join(dismantleMobileDir, `frame_${frameNum}.webp`);
      return convertFrame(src, desk, mob);
    }));
    process.stdout.write(`Dismantle: ${Math.min(i + CONCURRENCY, dismantleFiles.length)} / ${dismantleFiles.length}\r`);
  }
  console.log(`\nDismantle conversion complete!`);

  // Report sizes
  const stats = {
    heroDesktop: await getDirSize(heroDesktopDir),
    heroMobile: await getDirSize(heroMobileDir),
    dismantleDesktop: await getDirSize(dismantleDesktopDir),
    dismantleMobile: await getDirSize(dismantleMobileDir),
  };

  console.log('\n================ SUMMARY ================');
  console.log(`assets/frames/hero:           ${stats.heroDesktop.count} frames, ${stats.heroDesktop.mb} MB`);
  console.log(`assets/frames/hero-mobile:    ${stats.heroMobile.count} frames, ${stats.heroMobile.mb} MB`);
  console.log(`assets/frames/dismantle:        ${stats.dismantleDesktop.count} frames, ${stats.dismantleDesktop.mb} MB`);
  console.log(`assets/frames/dismantle-mobile: ${stats.dismantleMobile.count} frames, ${stats.dismantleMobile.mb} MB`);
  console.log('=========================================');

  // Save stats to json for config.js
  fs.writeFileSync('tools/converter/stats.json', JSON.stringify(stats, null, 2));
}

main().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
