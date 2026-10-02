/**
 * BuildIran — Asset Generator «Shahryar Crown» (v3 brand)
 * Renders the app icon, splash mark and Android adaptive icons
 * as pure-pixel PNGs (pngjs): a brass geometric crown — the Shahryar mark.
 *
 * Usage: node scripts/generate-assets.mjs
 */

import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'assets', 'images');

// ─── Palette ──────────────────────────────────────────────────────────────────

const INK_TOP = [0x15, 0x18, 0x21];
const INK_BOTTOM = [0x09, 0x0a, 0x0e];
const BRASS_TOP = [0xef, 0xd0, 0x8a];
const BRASS_BOTTOM = [0xc9, 0x9a, 0x33];
const WHITE = [255, 255, 255];

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];

// ─── Crown geometry (Shahryar mark) ───────────────────────────────────────────
// Minimal geometric crown in a 1000×1000 design space:
//   base band + three spikes (center tallest) + three tip pearls.
// `inside(x, y)` returns true inside the silhouette.

function crownInside(x, y) {
  // Design space: mark spans x 250–750, y 400–800
  // Base band: two rails with a gap (crown base)
  if (y >= 760 && y <= 800) {
    return x >= 250 && x <= 750;
  }
  if (y > 806 && y <= 838) {
    return x >= 278 && x <= 722;
  }
  if (y > 800 && y <= 806) return false; // hairline gap between band and rail

  // Crown body: main silhouette up to the spikes
  if (y < 400 || y > 760) return false;
  const bodyPoly = [
    [278, 760],
    [302, 500],
    [402, 640],
    [500, 448],
    [598, 640],
    [698, 500],
    [722, 760],
  ];
  if (!pointInPolygon(x, y, bodyPoly)) return false;

  // Cut an arch out of the base center (negative space, echoes the old iwan)
  if (y >= 640) {
    const dx = x - 500;
    const dy = 760 - y;
    // arch: circle centered below base, radius 120
    if (Math.abs(dx) <= 110 && Math.hypot(dx, dy - 40) <= 118) return false;
  }
  return true;
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pearlInside(x, y) {
  // Tip pearls above each spike (design space)
  const pearls = [
    [302, 468, 26],
    [500, 416, 28],
    [698, 468, 26],
  ];
  return pearls.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r);
}

function markInside(x, y) {
  return crownInside(x, y) || pearlInside(x, y);
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function makeCanvas(size) {
  return { size, data: new Uint8ClampedArray(size * size * 4) };
}

function toPng(canvas) {
  const png = new PNG({ width: canvas.size, height: canvas.size });
  png.data = Buffer.from(canvas.data.buffer);
  return PNG.sync.write(png);
}

function blend(c, x, y, rgb, a) {
  const i = (y * c.size + x) * 4;
  c.data[i] = Math.round(lerp(c.data[i], rgb[0], a));
  c.data[i + 1] = Math.round(lerp(c.data[i + 1], rgb[1], a));
  c.data[i + 2] = Math.round(lerp(c.data[i + 2], rgb[2], a));
}

/**
 * Render options:
 *  size, ss (supersample), bg 'ink'|'transparent', frame (hairline), scale (mark height fraction), markColor 'brass'|'white'
 */
function render({ size, ss = 3, bg = 'transparent', frame = false, markColor = 'brass', scale = 0.5 }) {
  const c = makeCanvas(size);
  const S = size * ss;

  // Map design space (1000) into supersampled canvas, centered
  const markSpan = S * scale * 2;       // design 1000 → markSpan px
  const k = markSpan / 1000;            // design → px scale
  const offX = S / 2 - 500 * k;
  const offY = S / 2 - 620 * k;         // design y-center of the crown (~620)

  const colTop = markColor === 'white' ? WHITE : BRASS_TOP;
  const colBot = markColor === 'white' ? [214, 214, 214] : BRASS_BOTTOM;
  const markTop = 400;
  const markBottom = 838;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Background
      let r, g, b, a;
      if (bg === 'ink') {
        const bgc = mix(INK_TOP, INK_BOTTOM, py / size);
        r = bgc[0]; g = bgc[1]; b = bgc[2]; a = 255;
      } else {
        r = 0; g = 0; b = 0; a = 0;
      }

      // Mark coverage (supersampled)
      if (scale > 0) {
        let cov = 0;
        for (let sy = 0; sy < ss; sy++) {
          const y = (py * ss + sy + 0.5 - offY) / k;
          for (let sx = 0; sx < ss; sx++) {
            const x = (px * ss + sx + 0.5 - offX) / k;
            if (x >= 0 && x <= 1000 && markInside(x, y)) cov++;
          }
        }
        const covA = cov / (ss * ss);
        if (covA > 0) {
          const yCenter = (py * ss + ss / 2 - offY) / k;
          const yNorm = Math.min(Math.max((yCenter - markTop) / (markBottom - markTop), 0), 1);
          const mc = mix(colTop, colBot, yNorm);
          r = Math.round(lerp(r, mc[0], covA));
          g = Math.round(lerp(g, mc[1], covA));
          b = Math.round(lerp(b, mc[2], covA));
          a = bg === 'ink' ? 255 : Math.round(covA * 255);
        }
      }
      const i = (py * size + px) * 4;
      c.data[i] = r; c.data[i + 1] = g; c.data[i + 2] = b; c.data[i + 3] = a;
    }
  }

  // Hairline blueprint frame
  if (frame && bg === 'ink') {
    const inset = Math.round(size * 0.045);
    const thick = Math.max(2, Math.round(size * 0.003));
    const fc = BRASS_TOP;
    for (let y = inset; y < size - inset; y++) {
      for (let k2 = 0; k2 < thick; k2++) {
        blend(c, inset + k2, y, fc, 0.2);
        blend(c, size - inset - 1 - k2, y, fc, 0.2);
      }
    }
    for (let x = inset; x < size - inset; x++) {
      for (let k2 = 0; k2 < thick; k2++) {
        blend(c, x, inset + k2, fc, 0.2);
        blend(c, x, size - inset - 1 - k2, fc, 0.2);
      }
    }
  }

  return c;
}

function save(name, canvas) {
  const p = join(OUT, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, toPng(canvas));
  console.log('✓', name, `${canvas.size}x${canvas.size}`);
}

// ─── Generate ─────────────────────────────────────────────────────────────────

console.log('Rendering Shahryar «Ink & Brass» brand assets…');

save('icon.png', render({ size: 1024, ss: 3, bg: 'ink', frame: true, scale: 0.42 }));
save('splash-icon.png', render({ size: 1024, ss: 3, bg: 'transparent', scale: 0.42 }));
save('android-icon-foreground.png', render({ size: 1024, ss: 3, bg: 'transparent', scale: 0.34 }));
save('android-icon-background.png', render({ size: 1024, ss: 1, bg: 'ink', scale: 0 }));
save('android-icon-monochrome.png', render({ size: 1024, ss: 3, bg: 'transparent', markColor: 'white', scale: 0.34 }));
save('favicon.png', render({ size: 64, ss: 4, bg: 'ink', scale: 0.46 }));

console.log('Done.');
