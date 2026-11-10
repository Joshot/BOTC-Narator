const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodeAscii85(str) {
  let clean = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '~' && str[i+1] === '>') break;
    if ((c >= '!' && c <= 'u') || c === 'z') {
      clean += c;
    }
  }
  const out = [];
  let count = 0;
  let tuple = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === 'z' && count === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    tuple = tuple * 85 + (c.charCodeAt(0) - 33);
    count++;
    if (count === 5) {
      out.push((tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255);
      tuple = 0;
      count = 0;
    }
  }
  if (count > 0) {
    for (let i = count; i < 5; i++) {
      tuple = tuple * 85 + 84;
    }
    for (let i = 0; i < count - 1; i++) {
      out.push((tuple >>> (24 - i * 8)) & 255);
    }
  }
  return Buffer.from(out);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function rgbToPng(rgbBuf, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rowLen = width * 3;
  const scanlines = Buffer.alloc(height * (rowLen + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (rowLen + 1)] = 0; // Filter None
    rgbBuf.copy(scanlines, y * (rowLen + 1) + 1, y * rowLen, (y + 1) * rowLen);
  }
  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const pdfPath = 'C:/Users/joshua.hotama/.gemini/antigravity/brain/ac9923df-d9dc-4516-b2af-f9805312d610/.user_uploaded/media_1794300211450_b39569e2.pdf';
const outDir = path.join(__dirname, '..', 'public', 'reminders');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const tokenFileNames = [
  'master.png',        // Page 1: Butler reminder
  'is_the_drunk.png',  // Page 2: Drunk reminder
  'decoy_ft.png',      // Page 3: Fortune Teller decoy
  'die_imp.png',       // Page 4: Imp die
  'decoy_inv.png',     // Page 5: Investigator decoy
  'minion_inv.png',    // Page 6: Investigator minion
  'decoy_lib.png',     // Page 7: Librarian decoy
  'outsider_lib.png',  // Page 8: Librarian outsider
  'protected.png',     // Page 9: Monk protected
  'poisoned.png',      // Page 10: Poisoner poisoned
  'is_demon_sw.png',   // Page 11: Scarlet Woman demon
  'used_slayer.png',   // Page 12: Slayer used
  'executed.png',      // Page 13: Undertaker executed
  'used_virgin.png',   // Page 14: Virgin used
  'townsfolk_ww.png',  // Page 15: Washerwoman townsfolk
  'decoy_ww.png',      // Page 16: Washerwoman decoy
];

const pdf = fs.readFileSync(pdfPath);
const str = pdf.toString('latin1');

let cur = 0;
for (let i = 0; i < 16; i++) {
  const p = str.indexOf('/Subtype /Image', cur);
  if (p === -1) {
    console.error('Image not found for index', i);
    break;
  }
  const dictStart = str.lastIndexOf('<<', p);
  const dictEnd = str.indexOf('>>', p);
  const dict = str.slice(dictStart, dictEnd);
  const lenMatch = dict.match(/\/Length\s+(\d+)/);
  const streamIdx = str.indexOf('stream', dictEnd);
  const streamStart = str.indexOf('\n', streamIdx) + 1;
  const streamLen = parseInt(lenMatch[1], 10);

  const streamData = str.slice(streamStart, streamStart + streamLen);
  const a85 = decodeAscii85(streamData);
  const rawRgb = zlib.inflateSync(a85);

  const png = rgbToPng(rawRgb, 900, 900);
  const targetPath = path.join(outDir, tokenFileNames[i]);
  fs.writeFileSync(targetPath, png);
  console.log(`Saved [${i + 1}/16] ${tokenFileNames[i]} (${png.length} bytes)`);

  cur = streamStart + streamLen;
}
console.log('Done extracting all 16 tokens!');
