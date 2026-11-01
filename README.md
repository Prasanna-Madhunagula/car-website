# NOCTIS — The City Is Asleep

A premium, minimal, single-page scrollytelling experience for **NOCTIS**, a fictional luxury electric vehicle brand engineered for total blackout conditions.

Built with pure vanilla HTML, CSS, and JavaScript. No libraries, no frameworks, no build tools.

---

## ⚡ Features

- **Scroll-Scrubbed Canvas Sequences**:
  - **Hero Sequence**: 600 continuous WebP frames scrubbing seamlessly on a sticky full-screen `<canvas>`.
  - **Mechanical Dismantle Sequence**: 200 frames visualizing the vehicle's internal engineering and disassembly.
  - Nearest-frame fallback rendering to maintain 60fps scrolling without flashes or decode gaps.
  - Cover-fit on landscape viewports; contain-fit vertically centered on portrait screens.
- **Lineup Interactive Accordion**:
  - Horizontal flex accordion showcasing 5 vehicle models (`GT-E`, `S`, `X`, `R`, `ONE`).
  - Shared floor line at 72% height with 6% drive-in entrance transition.
  - 80ms debounced hover selection, interactive finish swatches, and keyboard navigation (`ArrowLeft` / `ArrowRight`).
  - Stacks into clean 72px rows on mobile devices (< 768px).
- **Custom Headlight Cursor**:
  - Desktop-only 6px solid xenon dot inside a 28px ring following the pointer with 0.18 lerp.
  - Morphs into a 44×2px horizontal light bar with contextual mono tags (`VIEW`, `RESERVE`, `OPEN`, `CONFIGURE`).
  - 120ms brightening flash on click.
- **Procedural Film-Grain**:
  - Monochromatic noise tile generated onto an offscreen canvas and shifted ~8 times per second at 3.5% opacity.
- **Strict Minimalist Aesthetics**:
  - Flat solid tones (`--asphalt: #07080A`, `--bone: #EDEAE4`, `--xenon: #CFE3FF`, `--taillight: #E1251B`).
  - 1px hairlines only.
  - Zero gradients, zero glassmorphism / blurs, zero drop shadows.
- **Accessibility & Motion Preferences**:
  - Full `@media (prefers-reduced-motion: reduce)` support: disables sticky pinning and delivers static, lightweight chapter cards.

---

## 🚀 Getting Started

No build step or package installation required. Simply serve the directory with any local static HTTP server.

### Option 1: Built-in Node Server
```bash
node server.js
```
Then open `http://localhost:3000/` in your browser.

### Option 2: VS Code Live Server
Right-click `index.html` and choose **"Open with Live Server"**.

---

## 📁 Project Structure

```text
├── index.html        # Main semantic markup
├── styles.css        # Pure CSS design system & responsive layout
├── main.js          # Scrollytelling engine, lerp loops, accordion, cursor
├── config.js        # Tunable parameters: heights, ranges, specs, coordinates
├── server.js        # Zero-dependency local development server
├── assets/
│   ├── cars/        # Studio product images for the vehicle lineup
│   └── frames/      # High-performance desktop and mobile WebP sequences
│       ├── hero/
│       ├── hero-mobile/
│       ├── dismantle/
│       └── dismantle-mobile/
└── tools/           # Frame conversion and preparation utilities
```
