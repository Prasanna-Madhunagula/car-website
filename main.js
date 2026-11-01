/**
 * NOCTIS — Main Scrollytelling Engine
 * Pure Vanilla JavaScript (No libraries, no frameworks)
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const body = document.body;
  const siteNav = document.getElementById('site-nav');
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderCounter = document.getElementById('preloader-counter');

  // Canvases
  const grainCanvas = document.getElementById('grain-canvas');
  const heroCanvas = document.getElementById('hero-canvas');
  const dismantleCanvas = document.getElementById('dismantle-canvas');
  const heroFadeBlack = document.getElementById('hero-fade-black');

  // Progress bars
  const heroProgressBar = document.getElementById('hero-progress-bar');
  const dismantleProgressBar = document.getElementById('dismantle-progress-bar');

  // Wrappers
  const heroWrapper = document.getElementById('hero');
  const dismantleWrapper = document.getElementById('dismantle');
  const statementSection = document.getElementById('statement');
  const statementQuote = document.getElementById('statement-quote');

  // Hero HUD
  const hudChapterText = document.getElementById('hud-chapter-text');
  const hudSpeed = document.getElementById('hud-speed');
  const hudDistance = document.getElementById('hud-distance');

  // Cursor
  const cursorEl = document.getElementById('cursor');
  const cursorLabel = document.getElementById('cursor-label');

  // Containers
  const dismantleCalloutsContainer = document.getElementById('dismantle-callouts');
  const lineupAccordion = document.getElementById('lineup-accordion');

  // Frame sequence storage
  const heroImages = new Map();
  const dismantleImages = new Map();
  let heroTotalFrames = CONFIG.frames.hero.count;
  let dismantleTotalFrames = CONFIG.frames.dismantle.count;

  // Track responsive mode
  let isMobile = window.innerWidth < 768;

  // Smoothing states for requestAnimationFrame
  let targetHeroProgress = 0;
  let currentHeroProgress = 0;
  let targetHeroFrame = 0;
  let currentHeroFrame = 0;
  let lastDrawnHeroFrame = -1;

  let targetDismantleProgress = 0;
  let currentDismantleProgress = 0;
  let targetDismantleFrame = 0;
  let currentDismantleFrame = 0;
  let lastDrawnDismantleFrame = -1;

  // Cursor lerp states
  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  // Scroll direction detection for nav
  let lastScrollY = window.scrollY;
  let scrollDelta = 0;

  /* ==========================================================================
     1. PROCEDURAL FILM-GRAIN OVERLAY (Offscreen tile, shifted 8x/s)
     ========================================================================== */
  function initFilmGrain() {
    if (!grainCanvas || prefersReducedMotion) return;

    const ctx = grainCanvas.getContext('2d');
    const tileSize = 256;
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buf = imgData.data;

    // Fill with fine monochromatic noise
    for (let i = 0; i < buf.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      buf[i] = v;     // R
      buf[i + 1] = v; // G
      buf[i + 2] = v; // B
      buf[i + 3] = 255; // A (overall opacity controlled via CSS)
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth + 200;
      grainCanvas.height = window.innerHeight + 200;
      const pattern = ctx.createPattern(offscreen, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, grainCanvas.width, grainCanvas.height);
    }

    resizeGrain();
    window.addEventListener('resize', resizeGrain, { passive: true });

    // Jitter grain canvas position ~8 times per second (125ms interval)
    let lastJitterTime = 0;
    function jitterGrain(now) {
      if (now - lastJitterTime > 125) {
        lastJitterTime = now;
        const ox = (Math.random() * 60 - 30) | 0;
        const oy = (Math.random() * 60 - 30) | 0;
        grainCanvas.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
      }
      requestAnimationFrame(jitterGrain);
    }
    requestAnimationFrame(jitterGrain);
  }

  /* ==========================================================================
     2. CUSTOM CURSOR ("The Headlight", fine pointer only)
     ========================================================================== */
  function initCustomCursor() {
    if (!cursorEl || prefersReducedMotion) return;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Cursor click flash: brighter for 120ms
    window.addEventListener('mousedown', () => {
      cursorEl.classList.add('is-active');
      setTimeout(() => cursorEl.classList.remove('is-active'), 120);
    });

    // Delegated hover detection for cursor morphing and labels
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (!target) {
        cursorEl.classList.remove('is-hovering');
        cursorLabel.textContent = '';
        return;
      }

      cursorEl.classList.add('is-hovering');

      // Specific cursor labels
      if (target.classList.contains('lineup-slide')) {
        const isOpen = target.getAttribute('aria-expanded') === 'true';
        cursorLabel.textContent = isOpen ? 'CONFIGURE' : 'OPEN';
      } else if (target.hasAttribute('data-cursor')) {
        cursorLabel.textContent = target.getAttribute('data-cursor');
      } else if (target.tagName.toLowerCase() === 'a') {
        cursorLabel.textContent = 'VIEW';
      } else if (target.tagName.toLowerCase() === 'button') {
        cursorLabel.textContent = 'SELECT';
      } else {
        cursorLabel.textContent = 'VIEW';
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, .lineup-slide');
      if (target && !e.relatedTarget?.closest('[data-cursor], a, button, .lineup-slide')) {
        cursorEl.classList.remove('is-hovering');
        cursorLabel.textContent = '';
      }
    });

    // Render loop with lerp 0.18
    function renderCursor() {
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;
      cursorEl.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  /* ==========================================================================
     3. FRAME PRELOADER & ASYNC LOADER
     ========================================================================== */
  function getFramePath(sequenceName, index, mobile) {
    const seq = CONFIG.frames[sequenceName];
    const basePath = mobile ? seq.mobilePath : seq.desktopPath;
    const num = String(index).padStart(seq.digits, '0');
    return `${basePath}${num}${seq.extension}`;
  }

  async function preloadFrame(sequenceName, index, mobile, storageMap) {
    if (storageMap.has(index)) return storageMap.get(index);

    const url = getFramePath(sequenceName, index, mobile);
    const img = new Image();
    img.src = url;

    // Decode before use to eliminate decode stutter on paint
    try {
      await img.decode();
    } catch (_) {
      // If decode is not available or fails, fallback to onload
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }

    storageMap.set(index, img);
    return img;
  }

  // Preloader logic
  async function runPreloader() {
    const initialCount = CONFIG.frames.hero.initialPreloadCount;
    let loadedCount = 0;

    // Initial sequential/chunked preload for hero 1-40
    for (let i = 1; i <= initialCount; i++) {
      await preloadFrame('hero', i, isMobile, heroImages);
      loadedCount++;
      const pct = Math.min(100, Math.round((loadedCount / initialCount) * 100));
      if (preloaderBar) preloaderBar.style.transform = `translateX(-50%) scaleX(${pct / 100})`;
      if (preloaderCounter) preloaderCounter.textContent = `${String(pct).padStart(3, '0')}%`;
    }

    // First frame ready: draw initial frames to hero and dismantle
    drawNearestFrame('hero', 1);
    drawNearestFrame('dismantle', 1);

    // Flash preloader line brighter for 120ms before exit
    if (preloader) {
      preloader.classList.add('flash-exit');
      setTimeout(() => {
        preloader.classList.add('is-exiting');
        body.classList.remove('is-loading');
      }, 120);
    }

    // Continue background loading for the remaining hero frames, then dismantle frames
    backgroundLoadRemainingFrames();
  }

  async function backgroundLoadRemainingFrames() {
    // 1. Remaining hero frames 41 to 600 in chunks
    const heroTotal = heroTotalFrames;
    const CHUNK = 8;
    for (let i = CONFIG.frames.hero.initialPreloadCount + 1; i <= heroTotal; i += CHUNK) {
      const batch = [];
      for (let j = i; j < i + CHUNK && j <= heroTotal; j++) {
        batch.push(preloadFrame('hero', j, isMobile, heroImages));
      }
      await Promise.all(batch);
      // Yield thread briefly
      await new Promise((r) => setTimeout(r, 10));
    }

    // 2. Dismantle frames 1 to 200 in chunks
    const dismantleTotal = dismantleTotalFrames;
    for (let i = 1; i <= dismantleTotal; i += CHUNK) {
      const batch = [];
      for (let j = i; j < i + CHUNK && j <= dismantleTotal; j++) {
        batch.push(preloadFrame('dismantle', j, isMobile, dismantleImages));
      }
      await Promise.all(batch);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  /* ==========================================================================
     4. NEAREST-FRAME CANVAS RENDERER (Cover on Landscape, Contain on Portrait)
     ========================================================================== */
  function getNearestLoadedImage(storageMap, targetIdx, maxCount) {
    if (storageMap.has(targetIdx)) {
      return storageMap.get(targetIdx);
    }
    // Search outward (+1, -1, +2, -2...)
    for (let delta = 1; delta < maxCount; delta++) {
      if (targetIdx - delta >= 1 && storageMap.has(targetIdx - delta)) {
        return storageMap.get(targetIdx - delta);
      }
      if (targetIdx + delta <= maxCount && storageMap.has(targetIdx + delta)) {
        return storageMap.get(targetIdx + delta);
      }
    }
    return null;
  }

  function resizeCanvas(canvas) {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function drawNearestFrame(sequenceName, targetIdx) {
    const isHero = sequenceName === 'hero';
    const canvas = isHero ? heroCanvas : dismantleCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const storageMap = isHero ? heroImages : dismantleImages;
    const maxCount = isHero ? heroTotalFrames : dismantleTotalFrames;
    const img = getNearestLoadedImage(storageMap, targetIdx, maxCount);

    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    if (!iw || !ih) return;

    ctx.clearRect(0, 0, cw, ch);

    // Landscape screens (viewport width >= viewport height): Cover-fit
    // Portrait screens (viewport width < viewport height): Contain-fit vertically centered on --asphalt
    const isLandscape = cw >= ch;
    let drawW, drawH, drawX, drawY;

    if (isLandscape) {
      // Cover fit
      const scale = Math.max(cw / iw, ch / ih);
      drawW = iw * scale;
      drawH = ih * scale;
      drawX = (cw - drawW) / 2;
      drawY = (ch - drawH) / 2;
    } else {
      // Contain fit
      const scale = Math.min(cw / iw, ch / ih);
      drawW = iw * scale;
      drawH = ih * scale;
      drawX = (cw - drawW) / 2;
      drawY = (ch - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  /* ==========================================================================
     5. SECTION 2: STATEMENT WORD-BY-WORD SCRUBBING
     ========================================================================== */
  function initStatementScrub() {
    if (!statementQuote) return;

    const text = statementQuote.textContent.trim();
    const words = text.split(/\s+/);
    statementQuote.innerHTML = words
      .map((w) => `<span class="statement-word">${w}</span>`)
      .join(' ');
  }

  function updateStatementScrub() {
    if (!statementSection || prefersReducedMotion) return;

    const rect = statementSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Progress through the statement section (0.0 when entering viewport to 1.0 when leaving)
    const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (windowH + rect.height * 0.7)));

    const wordEls = statementQuote.querySelectorAll('.statement-word');
    const totalWords = wordEls.length;

    wordEls.forEach((el, idx) => {
      // Calculate active window for each word
      const wordStart = idx / totalWords;
      const wordEnd = (idx + 1) / totalWords;

      let wordOpacity = 0.15;
      if (progress >= wordEnd) {
        wordOpacity = 1.0;
      } else if (progress > wordStart) {
        const factor = (progress - wordStart) / (wordEnd - wordStart);
        wordOpacity = 0.15 + factor * 0.85;
      }
      el.style.opacity = wordOpacity.toFixed(2);
    });
  }

  /* ==========================================================================
     6. SECTION 3: DISMANTLE CALLOUTS
     ========================================================================== */
  function initDismantleCallouts() {
    if (!dismantleCalloutsContainer) return;

    dismantleCalloutsContainer.innerHTML = '';
    CONFIG.dismantleCallouts.forEach((item) => {
      const callout = document.createElement('div');
      callout.className = `dismantle-callout dir-${item.lineDirection}`;
      callout.id = `callout-${item.id}`;
      callout.style.left = `${item.x}%`;
      callout.style.top = `${item.y}%`;

      callout.innerHTML = `
        <div class="callout-dot"></div>
        <div class="callout-hairline"></div>
        <div class="callout-content">
          <span class="hud-mono callout-tag">${item.tag}</span>
          <span class="callout-text">${item.title}</span>
        </div>
      `;
      dismantleCalloutsContainer.appendChild(callout);
    });
  }

  function updateDismantleCallouts(progress) {
    if (prefersReducedMotion) return;

    CONFIG.dismantleCallouts.forEach((item) => {
      const el = document.getElementById(`callout-${item.id}`);
      if (!el) return;
      if (progress >= item.triggerProgress) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });
  }

  /* ==========================================================================
     7. SECTION 4: LINEUP ACCORDION (Hover & Touch & Keyboard Accessible)
     ========================================================================== */
  let hoverTimeout = null;

  function initLineupAccordion() {
    if (!lineupAccordion) return;

    lineupAccordion.innerHTML = '';

    CONFIG.lineup.forEach((car, index) => {
      const isDefault = car.defaultOpen;
      const slide = document.createElement('button');
      slide.type = 'button';
      slide.className = 'lineup-slide enter-state';
      slide.id = `lineup-slide-${car.id}`;
      slide.setAttribute('role', 'tab');
      slide.setAttribute('aria-expanded', isDefault ? 'true' : 'false');
      slide.setAttribute('aria-controls', `panel-${car.id}`);
      slide.dataset.index = index;

      slide.innerHTML = `
        <!-- Closed Slide View -->
        <div class="slide-closed-view">
          <span class="hud-mono closed-num">${car.num}</span>
          <span class="closed-rotated-name">${car.name}</span>
          <span class="hud-mono closed-num">${car.range}</span>
        </div>

        <!-- Vehicle Image -->
        <div class="slide-image-wrapper">
          <img class="slide-car-image" src="${car.image}" alt="${car.alt}" loading="lazy" />
        </div>

        <!-- Open Slide View -->
        <div class="slide-open-view" id="panel-${car.id}">
          <div class="open-top">
            <span class="hud-mono hud-dim">${car.num} — SPECIFICATION</span>
            <h3 class="open-model-name">${car.name}</h3>
            <p class="open-tagline">${car.tagline}</p>
          </div>

          <div class="open-bottom">
            <div class="open-specs-grid">
              <div class="spec-cell">
                <span class="spec-lbl">RANGE</span>
                <span class="spec-val">${car.range}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-lbl">0–100 KM/H</span>
                <span class="spec-val">${car.acceleration}</span>
              </div>
              <div class="spec-cell">
                <span class="spec-lbl">POWER</span>
                <span class="spec-val">${car.power}</span>
              </div>
            </div>

            <div class="open-action-row">
              <div class="swatch-group" aria-label="Available Finishes">
                ${car.colors
                  .map(
                    (col, ci) => `
                  <button type="button" class="color-swatch ${ci === 0 ? 'is-active' : ''}" 
                          style="--swatch-color: ${col.hex}" 
                          title="${col.name}" 
                          aria-label="${col.name}" 
                          data-cursor="VIEW">
                  </button>
                `
                  )
                  .join('')}
              </div>
              <a href="#reserve" class="slide-configure-link" data-cursor="CONFIGURE">Configure →</a>
            </div>
          </div>
        </div>
      `;

      lineupAccordion.appendChild(slide);

      // Swatch click handlers
      const swatches = slide.querySelectorAll('.color-swatch');
      swatches.forEach((swatch) => {
        swatch.addEventListener('click', (ev) => {
          ev.stopPropagation();
          swatches.forEach((s) => s.classList.remove('is-active'));
          swatch.classList.add('is-active');
        });
      });

      // Desktop: 80ms Debounced Hover Opening
      slide.addEventListener('mouseenter', () => {
        if (window.innerWidth < 768) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          openLineupSlide(index);
        }, 80);
      });

      // Click / Touch selection
      slide.addEventListener('click', () => {
        openLineupSlide(index);
      });

      // Keyboard navigation (Arrow keys)
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % CONFIG.lineup.length;
          openLineupSlide(nextIndex);
          focusSlide(nextIndex);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + CONFIG.lineup.length) % CONFIG.lineup.length;
          openLineupSlide(prevIndex);
          focusSlide(prevIndex);
        }
      });
    });

    // Staggered reveal when Lineup enters viewport
    const lineupSection = document.getElementById('lineup');
    if (lineupSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const slides = lineupAccordion.querySelectorAll('.lineup-slide');
              slides.forEach((sl, idx) => {
                setTimeout(() => {
                  sl.classList.remove('enter-state');
                  sl.classList.add('enter-active');
                }, idx * 80); // 0.08s stagger
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(lineupSection);
    }
  }

  function openLineupSlide(targetIndex) {
    const slides = lineupAccordion.querySelectorAll('.lineup-slide');
    slides.forEach((s, idx) => {
      const isOpen = idx === targetIndex;
      s.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Update cursor label if currently hovering the opened slide
    if (cursorEl && cursorEl.classList.contains('is-hovering')) {
      cursorLabel.textContent = 'CONFIGURE';
    }
  }

  function focusSlide(index) {
    const slides = lineupAccordion.querySelectorAll('.lineup-slide');
    if (slides[index]) slides[index].focus();
  }

  /* ==========================================================================
     8. MAIN SCROLL LOOP & PINNED SCROLLYTELLING
     ========================================================================== */
  function updateScrollProgress() {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;

    // --- Header Navigation auto-hide on scroll down, show on scroll up ---
    scrollDelta = scrollY - lastScrollY;
    if (scrollY > 120 && scrollDelta > 8) {
      siteNav.classList.add('nav-hidden');
    } else if (scrollDelta < -8) {
      siteNav.classList.remove('nav-hidden');
    }
    lastScrollY = scrollY;

    // --- Hero pinned section progress ---
    if (heroWrapper) {
      const heroRect = heroWrapper.getBoundingClientRect();
      const heroScrollDistance = heroWrapper.offsetHeight - windowH;
      if (heroScrollDistance > 0) {
        targetHeroProgress = Math.max(0, Math.min(1, -heroRect.top / heroScrollDistance));
        targetHeroFrame = Math.round(targetHeroProgress * (heroTotalFrames - 1)) + 1;
      }
    }

    // --- Dismantle pinned section progress ---
    if (dismantleWrapper) {
      const dismantleRect = dismantleWrapper.getBoundingClientRect();
      const dismantleScrollDistance = dismantleWrapper.offsetHeight - windowH;
      if (dismantleScrollDistance > 0) {
        targetDismantleProgress = Math.max(0, Math.min(1, -dismantleRect.top / dismantleScrollDistance));
        targetDismantleFrame = Math.round(targetDismantleProgress * (dismantleTotalFrames - 1)) + 1;
      }
    }
  }

  // Animation frame loop
  function tick() {
    if (!prefersReducedMotion) {
      // 1. Hero Lerp: current += (target - current) * 0.15
      currentHeroProgress += (targetHeroProgress - currentHeroProgress) * 0.15;
      currentHeroFrame += (targetHeroFrame - currentHeroFrame) * 0.15;
      const roundedHeroFrame = Math.max(1, Math.min(heroTotalFrames, Math.round(currentHeroFrame)));

      if (roundedHeroFrame !== lastDrawnHeroFrame) {
        drawNearestFrame('hero', roundedHeroFrame);
        lastDrawnHeroFrame = roundedHeroFrame;
      }

      // Update hero progress bar
      if (heroProgressBar) {
        heroProgressBar.style.transform = `scaleX(${currentHeroProgress.toFixed(4)})`;
      }

      // Over the last 5% of scroll (0.95 to 1.0), canvas fades to solid black
      if (heroFadeBlack) {
        const fadeStart = CONFIG.heroHud.fadeToBlackStart;
        if (currentHeroProgress >= fadeStart) {
          const fadeProgress = (currentHeroProgress - fadeStart) / (1 - fadeStart);
          heroFadeBlack.style.opacity = Math.min(1, fadeProgress).toFixed(3);
        } else {
          heroFadeBlack.style.opacity = '0';
        }
      }

      // Update hero HUD & text chapters
      updateHeroChaptersAndHUD(currentHeroProgress);

      // 2. Dismantle Lerp
      currentDismantleProgress += (targetDismantleProgress - currentDismantleProgress) * 0.15;
      currentDismantleFrame += (targetDismantleFrame - currentDismantleFrame) * 0.15;
      const roundedDismantleFrame = Math.max(1, Math.min(dismantleTotalFrames, Math.round(currentDismantleFrame)));

      if (roundedDismantleFrame !== lastDrawnDismantleFrame) {
        drawNearestFrame('dismantle', roundedDismantleFrame);
        lastDrawnDismantleFrame = roundedDismantleFrame;
      }

      // Update dismantle progress bar
      if (dismantleProgressBar) {
        dismantleProgressBar.style.transform = `scaleX(${currentDismantleProgress.toFixed(4)})`;
      }

      // Update dismantle callouts after 70% progress
      updateDismantleCallouts(currentDismantleProgress);

      // 3. Statement word scrubbing
      updateStatementScrub();
    }

    requestAnimationFrame(tick);
  }

  function updateHeroChaptersAndHUD(progress) {
    // Left-edge HUD telemetry
    const speed = Math.round(progress * CONFIG.heroHud.speedMax);
    const distance = (progress * CONFIG.heroHud.distanceMax).toFixed(1);

    if (hudSpeed) hudSpeed.textContent = `${String(speed).padStart(3, '0')} KM/H`;
    if (hudDistance) hudDistance.textContent = `${distance} KM`;

    // Active Chapter detection
    let activeChapterId = '01';
    CONFIG.heroChapters.forEach((chap, idx) => {
      const [start, end] = chap.range;
      const isActive = progress >= start && progress <= end;
      const chapterEl = document.getElementById(`hero-chap-${idx + 1}`);

      if (chapterEl) {
        if (isActive) {
          chapterEl.classList.add('is-active');
          const masks = chapterEl.querySelectorAll('.reveal-mask');
          masks.forEach((m, mi) => {
            setTimeout(() => m.classList.add('is-active'), mi * 80);
          });
          activeChapterId = chap.id;
        } else {
          chapterEl.classList.remove('is-active');
          const masks = chapterEl.querySelectorAll('.reveal-mask');
          masks.forEach((m) => m.classList.remove('is-active'));
        }
      }
    });

    if (hudChapterText) {
      hudChapterText.textContent = `${activeChapterId}/04`;
    }
  }

  /* ==========================================================================
     9. EVENT LISTENERS & RESIZING
     ========================================================================== */
  function onResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;

    // Refresh canvas resolutions
    resizeCanvas(heroCanvas);
    resizeCanvas(dismantleCanvas);

    // If breakpoint crossed, reload appropriate resolution frames
    if (wasMobile !== isMobile) {
      drawNearestFrame('hero', lastDrawnHeroFrame > 0 ? lastDrawnHeroFrame : 1);
      drawNearestFrame('dismantle', lastDrawnDismantleFrame > 0 ? lastDrawnDismantleFrame : 1);
    } else {
      drawNearestFrame('hero', lastDrawnHeroFrame > 0 ? lastDrawnHeroFrame : 1);
      drawNearestFrame('dismantle', lastDrawnDismantleFrame > 0 ? lastDrawnDismantleFrame : 1);
    }

    updateScrollProgress();
  }

  // Set wrappers heights from config
  function applyConfigHeights() {
    if (heroWrapper && CONFIG.heights.hero) {
      heroWrapper.style.height = CONFIG.heights.hero;
    }
    if (statementSection && CONFIG.heights.statement) {
      statementSection.style.minHeight = CONFIG.heights.statement;
    }
    if (dismantleWrapper && CONFIG.heights.dismantle) {
      dismantleWrapper.style.height = CONFIG.heights.dismantle;
    }
  }

  /* ==========================================================================
     INITIALIZATION ENTRY POINT
     ========================================================================== */
  function init() {
    applyConfigHeights();
    initFilmGrain();
    initCustomCursor();
    initStatementScrub();
    initDismantleCallouts();
    initLineupAccordion();

    resizeCanvas(heroCanvas);
    resizeCanvas(dismantleCanvas);

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Initial update
    updateScrollProgress();

    // Start render loop
    requestAnimationFrame(tick);

    // Run Preloader & frame preloading
    runPreloader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
