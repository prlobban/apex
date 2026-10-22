/* Generates APEX icons with zero dependencies.
   Black tile, white peak (the "apex") over a barbell.
   4×4 supersampling per pixel, so edges are smooth, not stair-stepped.
   Writes icon-192, icon-512, maskable-512 and apple-touch-icon (180) into ../icons/.

   Run:  node tools/generate-icons.mjs
*/
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'icons');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

/* ---- shapes, in normalised 0..1 space ---- */
const roundRect = (x, y, x0, x1, y0, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
// is p left of the line a->b
const side = (px, py, ax, ay, bx, by) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
const inTri = (px, py, a, b, c) => {
  const d1 = side(px, py, ...a, ...b), d2 = side(px, py, ...b, ...c), d3 = side(px, py, ...c, ...a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

/* the peak: a mitred chevron, outer triangle minus the same triangle dropped by T */
const T = 0.085, BASE = 0.46;
const outer = [[0.5, 0.19], [0.30, BASE + 0.0], [0.70, BASE + 0.0]];
const slope = (BASE - 0.19) / 0.20;
const inner = [[0.5, 0.19 + T * Math.hypot(1, 1 / slope) * 1.0], [0.30 - 0.0, BASE + T * Math.hypot(1, 1 / slope)], [0.70, BASE + T * Math.hypot(1, 1 / slope)]];
function peak(x, y) {
  if (y > BASE) return false;
  return inTri(x, y, ...outer) && !inTri(x, y, ...inner);
}

function barbell(x, y) {
  if (roundRect(x, y, 0.13, 0.87, 0.64, 0.68, 0.02)) return true;            // bar
  if (roundRect(x, y, 0.285, 0.355, 0.53, 0.79, 0.018)) return true;         // inner plates
  if (roundRect(x, y, 0.645, 0.715, 0.53, 0.79, 0.018)) return true;
  if (roundRect(x, y, 0.21, 0.265, 0.585, 0.735, 0.015)) return true;        // outer plates
  if (roundRect(x, y, 0.735, 0.79, 0.585, 0.735, 0.015)) return true;
  return false;
}

/* k scales the mark about the centre (1 = full, 0.7 = maskable safe zone) */
function ink(nx, ny, k) {
  const x = 0.5 + (nx - 0.5) / k, y = 0.5 + (ny - 0.5) / k;
  return peak(x, y) || barbell(x, y);
}

function png(size, k) {
  const SS = 4;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let py = 0; py < size; py++) {
    raw[o++] = 0;
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        if (ink((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, k)) hits++;
      }
      const v = Math.round(255 * hits / (SS * SS));
      raw[o++] = v; raw[o++] = v; raw[o++] = v;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size, k] of [
  ['icon-192.png', 192, 0.92], ['icon-512.png', 512, 0.92],
  ['maskable-512.png', 512, 0.70], ['apple-touch-icon.png', 180, 0.86],
]) {
  writeFileSync(join(outDir, name), png(size, k));
  console.log('wrote', name);
}
