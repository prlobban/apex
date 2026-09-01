/* Generates APEX PWA icons with zero dependencies.
   Pure black & white: black tile, white barbell.
   Writes icon-192.png, icon-512.png and maskable-512.png into ../icons/.

   Run:  node tools/generate-icons.mjs
*/
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'icons');
mkdirSync(outDir, { recursive: true });

const BLACK = [0x00, 0x00, 0x00];
const WHITE = [0xff, 0xff, 0xff];

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

/* A barbell, drawn in normalised 0..1 space and scaled by `k` about centre.
   k = 1.00 for the plain icon, 0.62 for the maskable safe zone. */
function barbell(nx, ny, k) {
  const x = 0.5 + (nx - 0.5) / k;
  const y = 0.5 + (ny - 0.5) / k;
  const box = (x0, x1, y0, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

  // the bar
  if (box(0.16, 0.84, 0.472, 0.528)) return true;
  // inner plates (tall)
  if (box(0.300, 0.368, 0.310, 0.690)) return true;
  if (box(0.632, 0.700, 0.310, 0.690)) return true;
  // outer plates (short)
  if (box(0.212, 0.262, 0.383, 0.617)) return true;
  if (box(0.738, 0.788, 0.383, 0.617)) return true;
  return false;
}

function png(size, k) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const c = barbell((x + 0.5) / size, (y + 0.5) / size, k) ? WHITE : BLACK;
      raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const jobs = [
  ['icon-192.png', 192, 1.0],
  ['icon-512.png', 512, 1.0],
  ['maskable-512.png', 512, 0.62],
];
for (const [name, size, k] of jobs) {
  const file = join(outDir, name);
  writeFileSync(file, png(size, k));
  console.log('wrote', file);
}
