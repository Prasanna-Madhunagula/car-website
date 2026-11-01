/**
 * NOCTIS Configuration
 * All section heights, frame counts, frame paths, chapter ranges,
 * and dismantle callout positions can be tuned here.
 */

const CONFIG = {
  // Frame sequences
  frames: {
    hero: {
      count: 600,
      desktopPath: 'assets/frames/hero/frame_',
      mobilePath: 'assets/frames/hero-mobile/frame_',
      extension: '.webp',
      digits: 4,
      initialPreloadCount: 40, // Frames 1-40 loaded before unlocking preloader
    },
    dismantle: {
      count: 200,
      desktopPath: 'assets/frames/dismantle/frame_',
      mobilePath: 'assets/frames/dismantle-mobile/frame_',
      extension: '.webp',
      digits: 4,
    }
  },

  // Heights for scroll wrappers
  heights: {
    hero: '600vh',
    statement: '100vh',
    dismantle: '350vh',
    lineup: '100vh',
    reserve: '100vh',
  },

  // Hero chapters (progress ranges 0.0 to 1.0)
  heroChapters: [
    {
      id: '01',
      range: [0.00, 0.12],
      title: 'NOCTIS',
      subtitle: 'The city is asleep.',
      hint: 'SCROLL TO WAKE IT',
      showHudTick: true,
    },
    {
      id: '02',
      range: [0.22, 0.40],
      title: "It doesn't need the city's light.",
      subtitle: null,
      hint: null,
      showHudTick: true,
    },
    {
      id: '03',
      range: [0.50, 0.68],
      title: 'It brings its own.',
      subtitle: null,
      hint: null,
      showHudTick: true,
    },
    {
      id: '04',
      range: [0.80, 1.00],
      title: 'GT-E',
      subtitle: null,
      specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
      linkText: 'Discover the GT-E',
      linkHref: '#lineup',
      showHudTick: true,
    }
  ],

  // Hero HUD max readings
  heroHud: {
    speedMax: 118,      // KM/H at progress 1.0
    distanceMax: 4.2,   // KM at progress 1.0
    fadeToBlackStart: 0.95 // Last 5% of scroll fades canvas to solid black
  },

  // Dismantle callouts (visible after 70% progress, positions in %)
  // x: horizontal % from left of stage, y: vertical % from top of stage
  dismantleCallouts: [
    {
      id: 'body',
      tag: 'BODY',
      title: 'Carbon composite monocoque',
      triggerProgress: 0.73,
      x: 32, // %
      y: 34, // %
      lineDirection: 'top-left', // direction indicator line draws
    },
    {
      id: 'light',
      tag: 'LIGHT',
      title: 'Single-line LED signature',
      triggerProgress: 0.79,
      x: 74, // %
      y: 42, // %
      lineDirection: 'top-right',
    },
    {
      id: 'battery',
      tag: 'BATTERY',
      title: '110 kWh structural pack',
      triggerProgress: 0.85,
      x: 48, // %
      y: 68, // %
      lineDirection: 'bottom-left',
    },
    {
      id: 'drive',
      tag: 'DRIVE',
      title: 'Dual axial-flux motors, 680 kW',
      triggerProgress: 0.91,
      x: 62, // %
      y: 62, // %
      lineDirection: 'bottom-right',
    }
  ],

  // Lineup vehicles
  lineup: [
    {
      id: 'gt-e',
      num: '01',
      name: 'GT-E',
      tagline: 'The grand tourer.',
      range: '640 km',
      acceleration: '3.1 s',
      power: '680 kW',
      image: 'assets/cars/gt-e.webp',
      alt: 'NOCTIS GT-E matte graphite grand tourer electric coupe side profile',
      defaultOpen: true,
      colors: [
        { name: 'Matte Graphite', hex: '#1D2024' },
        { name: 'Obsidian Black', hex: '#0B0C0E' },
        { name: 'Liquid Silver', hex: '#9AA0A6' },
        { name: 'Midnight Xenon', hex: '#1B2432' }
      ]
    },
    {
      id: 's',
      num: '02',
      name: 'S',
      tagline: 'Four doors, no compromise.',
      range: '600 km',
      acceleration: '3.6 s',
      power: '520 kW',
      image: 'assets/cars/s.webp',
      alt: 'NOCTIS S satin bone white electric sport sedan side profile',
      defaultOpen: false,
      colors: [
        { name: 'Satin Bone White', hex: '#EDEAE4' },
        { name: 'Matte Graphite', hex: '#1D2024' },
        { name: 'Basalt Grey', hex: '#2E3238' },
        { name: 'Deep Cobalt', hex: '#0F1A2C' }
      ]
    },
    {
      id: 'x',
      num: '03',
      name: 'X',
      tagline: 'Higher, never heavier.',
      range: '560 km',
      acceleration: '4.2 s',
      power: '480 kW',
      image: 'assets/cars/x.webp',
      alt: 'NOCTIS X midnight blue electric SUV coupe side profile',
      defaultOpen: false,
      colors: [
        { name: 'Midnight Blue', hex: '#101B2B' },
        { name: 'Matte Graphite', hex: '#1D2024' },
        { name: 'Nordic Silver', hex: '#7A808A' },
        { name: 'Pure Obsidian', hex: '#0B0C0E' }
      ]
    },
    {
      id: 'r',
      num: '04',
      name: 'R',
      tagline: 'Built for the track.',
      range: '420 km',
      acceleration: '2.4 s',
      power: '900 kW',
      image: 'assets/cars/r.webp',
      alt: 'NOCTIS R satin black electric track coupe with rear wing side profile',
      defaultOpen: false,
      colors: [
        { name: 'Satin Track Black', hex: '#0E0F12' },
        { name: 'Exposed Carbon', hex: '#18191D' },
        { name: 'Apex White', hex: '#E5E2DC' },
        { name: 'Taillight Accent', hex: '#E1251B' }
      ]
    },
    {
      id: 'one',
      num: '05',
      name: 'ONE',
      tagline: 'The future, early.',
      range: 'Concept',
      acceleration: 'Under 2.0 s',
      power: 'Quad Motor >1000 kW',
      image: 'assets/cars/one.webp',
      alt: 'NOCTIS ONE liquid silver electric concept hypercar side profile',
      defaultOpen: false,
      colors: [
        { name: 'Liquid Silver', hex: '#A8AFB8' },
        { name: 'Void Black', hex: '#07080A' },
        { name: 'Raw Monocoque', hex: '#202227' },
        { name: 'Xenon Glaze', hex: '#CFE3FF' }
      ]
    }
  ]
};

// Export for vanilla script usage
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
