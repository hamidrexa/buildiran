/**
 * BuildIran — Asset Generator «Ink & Brass»
 * Renders the app icon, splash mark and Android adaptive icons
 * as pure-pixel PNGs (pngjs): a brass Persian pointed-arch mark (iwan).
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

// ─── Pointed-arch geometry (Persian iwan) ─────────────────────────────────────
// Equilateral two-centered pointed arch: opening spans [cx-w, cx+w] at the
// springing line ys, apex at ys - w*sqrt(3), solid legs down to yb.
// t = band thickness (0 = solid fill).

const SQRT3 = Math.sqrt(3);

function iwan(x, y, cx, w, ys, yb, t) {
  if (y < ys - w * SQRT3 || y > yb) return false;
  if (y >= ys) {
    if (t <= 0) return Math.abs(x - cx) <= w;
    const d = Math.abs(x - cx);
    return d <= w && d >= w - t;
  }
  const R = 2 * w;
  const inOuter = x <= cx
    ? Math.hypot(x - (cx + w), y - ys) <= R
    : Math.hypot(x - (cx - w), y - ys) <= R;
  if (!inOuter) return false;
  if (t <= 0) return true;
  const wi = w - t;
  const ri = 2 * wi;
  const inInner = x <= cx
    ? Math.hypot(x - (cx + wi), y - ys) <= ri
    : Math.hypot(x - (cx - wi), y - ys) <= ri;
  return !inInner;
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
function render({ size, ss = 3, bg = 'transparent', frame = false, markColor = 'brass', scale = 0.52 }) {
  const c = makeCanvas(size);
  const S = size * ss;

  // Mark geometry (supersampled units)
  const markH = S * scale;
  const legH = markH * 0.42;
  const archH = markH - legH;
  const w = archH / SQRT3;
  const t = w * 0.30;
  const cx = S / 2;
  const yb = S / 2 + markH / 2;
  const ys = yb - legH;
  const archTop = ys - archH;

  const colTop = markColor === 'white' ? WHITE : BRASS_TOP;
  const colBot = markColor === 'white' ? [214, 214, 214] : BRASS_BOTTOM;

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
          const y = py * ss + sy + 0.5;
          for (let sx = 0; sx < ss; sx++) {
            const x = px * ss + sx + 0.5;
            if (iwan(x, y, cx, w, ys, yb, t)) cov++;
          }
        }
        const covA = cov / (ss * ss);
        if (covA > 0) {
          const yCenter = py * ss + ss / 2;
          const yNorm = Math.min(Math.max((yCenter - archTop) / markH, 0), 1);
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
      for (let k = 0; k < thick; k++) {
        blend(c, inset + k, y, fc, 0.2);
        blend(c, size - inset - 1 - k, y, fc, 0.2);
      }
    }
    for (let x = inset; x < size - inset; x++) {
      for (let k = 0; k < thick; k++) {
        blend(c, x, inset + k, fc, 0.2);
        blend(c, x, size - inset - 1 - k, fc, 0.2);
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

console.log('Rendering BuildIran «Ink & Brass» assets…');

save('icon.png', render({ size: 1024, ss: 3, bg: 'ink', frame: true, scale: 0.5 }));
save('splash-icon.png', render({ size: 1024, ss: 3, bg: 'transparent', scale: 0.5 }));
save('android-icon-foreground.png', render({ size: 1024, ss: 3, bg: 'transparent', scale: 0.4 }));
save('android-icon-background.png', render({ size: 1024, ss: 1, bg: 'ink', scale: 0 }));
save('android-icon-monochrome.png', render({ size: 1024, ss: 3, bg: 'transparent', markColor: 'white', scale: 0.4 }));
save('favicon.png', render({ size: 64, ss: 4, bg: 'ink', scale: 0.56 }));

console.log('Done.');
