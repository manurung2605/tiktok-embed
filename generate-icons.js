import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderAppIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: dark slate #0b0f17 to #111827
  let r = 11 + Math.floor(6 * (y / h));
  let g = 15 + Math.floor(9 * (y / h));
  let b = 23 + Math.floor(16 * (y / h));
  let a = 255;

  // Outer border or corner clipping if not maskable
  if (!isMaskable) {
    // Rounded squircle (approx x^4 + y^4)
    const squircle = Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dy), 4);
    if (squircle > 0.95) {
      return [0, 0, 0, 0];
    }
  }

  // Cyan & Pink glow accents
  const cyanDist = Math.sqrt(Math.pow(dx + 0.3, 2) + Math.pow(dy + 0.3, 2));
  const pinkDist = Math.sqrt(Math.pow(dx - 0.3, 2) + Math.pow(dy - 0.3, 2));
  if (cyanDist < 0.6) {
    const factor = (1 - cyanDist / 0.6) * 0.3;
    r = Math.min(255, Math.floor(r * (1 - factor) + 0 * factor));
    g = Math.min(255, Math.floor(g * (1 - factor) + 242 * factor));
    b = Math.min(255, Math.floor(b * (1 - factor) + 254 * factor));
  }
  if (pinkDist < 0.6) {
    const factor = (1 - pinkDist / 0.6) * 0.35;
    r = Math.min(255, Math.floor(r * (1 - factor) + 255 * factor));
    g = Math.min(255, Math.floor(g * (1 - factor) + 0 * factor));
    b = Math.min(255, Math.floor(b * (1 - factor) + 80 * factor));
  }

  // Center logo representation (TikTok style note / link chain)
  if (dist < 0.38) {
    // Note stalk & flag
    const nx = (x - cx) / (w * 0.25);
    const ny = (y - cy) / (h * 0.25);
    // Draw note stem & flag
    const isStem = Math.abs(nx - 0.2) < 0.15 && ny > -0.7 && ny < 0.4;
    const isHead = Math.sqrt(Math.pow(nx + 0.2, 2) + Math.pow(ny - 0.4, 2)) < 0.38;
    const isFlag = nx > 0.2 && nx < 0.8 && ny > -0.7 && ny < -0.3;
    if (isStem || isHead || isFlag) {
      r = 255;
      g = 255;
      b = 255;
    }
  }

  return [r, g, b, a];
}

const pwa192 = createPNG(192, 192, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = createPNG(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const maskable512 = createPNG(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, true));
fs.writeFileSync('public/pwa-maskable-512x512.png', maskable512);

const appleIcon = createPNG(180, 180, (x, y, w, h) => renderAppIcon(x, y, w, h, true));
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

console.log('Successfully generated PWA and Android icons!');
