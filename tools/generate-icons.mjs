/* Generates APEX PWA icons (192 + 512) with zero dependencies.
   Dark brand background (#0B0B0F) + red accent "lane" stripe + dot,
   matching the in-app APEX. mark. Writes PNGs into ../icons/. */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'icons');
mkdirSync(outDir, { recursive: true });

const BG = [0x0b, 0x0b, 0x0f];   // background
const RED = [0xff, 0x2e, 0x5f];  // accent

function crc32(buf){
  let c = ~0;
  for(let i=0;i<buf.length;i++){
    c ^= buf[i];
    for(let k=0;k<8;k++) c = (c>>>1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const t = Buffer.from(type,'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);
  return Buffer.concat([len,t,data,crc]);
}
function png(size){
  const px = (x,y)=>{
    // diagonal red lane stripe through the lower third
    const t = x / size;                 // 0..1 across
    const band = size*0.62 + (x*0.18);  // stripe centre drifts down-right
    if (Math.abs(y - band) < size*0.06) return RED;
    // a small dot top-right (the "." in APEX.)
    const dx = x-size*0.80, dy = y-size*0.30, r = size*0.055;
    if (dx*dx+dy*dy < r*r) return RED;
    return BG;
  };
  const raw = Buffer.alloc(size*(size*3+1));
  let o=0;
  for(let y=0;y<size;y++){
    raw[o++]=0; // filter: none
    for(let x=0;x<size;x++){ const c=px(x,y); raw[o++]=c[0]; raw[o++]=c[1]; raw[o++]=c[2]; }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
for(const s of [192,512]){
  const file = join(outDir, `icon-${s}.png`);
  writeFileSync(file, png(s));
  console.log('wrote', file);
}
