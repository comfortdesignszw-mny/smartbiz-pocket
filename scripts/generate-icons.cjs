const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPNG(width, height, isMaskable = false) {
  // Create RGBA buffer
  const stride = width * 4 + 1;
  const rawData = Buffer.alloc(stride * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.44;
  const cornerR = width * (isMaskable ? 0 : 0.22);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: emerald gradient
      // Top: #047857 (4, 120, 87), Bottom: #064e3b (6, 78, 59)
      const gradT = y / height;
      let rCol = Math.round(4 * (1 - gradT) + 6 * gradT);
      let gCol = Math.round(120 * (1 - gradT) + 78 * gradT);
      let bCol = Math.round(87 * (1 - gradT) + 59 * gradT);
      let aCol = 255;

      // Rounded rectangle clipping if not maskable
      if (!isMaskable) {
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const distCorner = Math.sqrt(qx * qx + qy * qy);
        if (distCorner > cornerR) {
          aCol = 0;
        }
      }

      // Inside bag / icon motif
      // Center gold coin at (cx, cy + height*0.1) radius = width * 0.12
      const coinDy = y - (cy + height * 0.08);
      const coinDist = Math.sqrt(dx * dx + coinDy * coinDy);
      if (coinDist <= width * 0.12) {
        // Gold #f59e0b
        rCol = 245;
        gCol = 158;
        bCol = 11;
        // Dollar sign vertical bar
        if (Math.abs(dx) <= width * 0.015 && Math.abs(coinDy) <= width * 0.08) {
          rCol = 120;
          gCol = 53;
          bCol = 15;
        }
      } else if (
        // Bag handle arc
        Math.abs(dist - width * 0.22) <= width * 0.025 &&
        y < cy &&
        Math.abs(dx) <= width * 0.2
      ) {
        // Light emerald #34d399
        rCol = 52;
        gCol = 211;
        bCol = 153;
      } else if (
        // Bag trapezoid body
        y >= cy - height * 0.12 &&
        y <= cy + height * 0.28 &&
        Math.abs(dx) <= width * (0.24 - 0.04 * ((y - cy) / (height * 0.4)))
      ) {
        // Darker emerald pocket #065f46
        rCol = 6;
        gCol = 95;
        bCol = 70;
      }

      rawData[pxOffset] = rCol;
      rawData[pxOffset + 1] = gCol;
      rawData[pxOffset + 2] = bCol;
      rawData[pxOffset + 3] = aCol;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(process.cwd(), 'public');

const p192 = createPNG(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), p192);

const p512 = createPNG(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), p512);

const pMask = createPNG(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pMask);

const pApple = createPNG(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pApple);

// Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, false));

console.log('Successfully generated all PWA PNG icons!');
