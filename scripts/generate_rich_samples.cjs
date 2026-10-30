const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeRealisticImagePng(width, height, theme = 'tech') {
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter None
    const ny = y / height;
    
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const px = rowOffset + 1 + x * 3;
      
      if (theme === 'tech') {
        // High-density visual texture with gradients and geometric patterns
        const wave1 = Math.sin(nx * 12 + ny * 8) * 127 + 128;
        const wave2 = Math.cos(nx * 18 - ny * 14) * 127 + 128;
        const grid = ((x % 30 < 2) || (y % 30 < 2)) ? 220 : 60;
        
        rawData[px] = Math.min(255, Math.floor(wave1 * 0.4 + grid * 0.6));      // R
        rawData[px + 1] = Math.min(255, Math.floor(wave2 * 0.5 + 80));          // G
        rawData[px + 2] = Math.min(255, Math.floor(180 + wave1 * 0.3));         // B
      } else if (theme === 'scan') {
        // Realistic paper texture with scanned document artifacts
        const paperNoise = (Math.sin(x * 99 + y * 77) * 10000) % 15;
        const base = 242 + paperNoise;
        // Draw simulated lines of printed text
        const isTextLine = (y % 28 >= 8 && y % 28 <= 18) && (x > 80 && x < width - 80) && ((x % 14 > 3));
        const ink = isTextLine ? 35 : base;
        
        rawData[px] = Math.floor(ink);
        rawData[px + 1] = Math.floor(ink * 0.98);
        rawData[px + 2] = Math.floor(ink * 0.94);
      } else {
        // Presentation slide with vibrant gradient
        const r = Math.floor(79 + nx * 100);
        const g = Math.floor(70 + ny * 120);
        const b = Math.floor(229 - (nx + ny) * 40);
        rawData[px] = r;
        rawData[px + 1] = g;
        rawData[px + 2] = b;
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);
}

async function buildSamples() {
  const dir = path.join(__dirname, '../public/samples');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('Generating high-resolution sample PNGs...');
  const pngTech1 = makeRealisticImagePng(800, 1100, 'tech');
  const pngTech2 = makeRealisticImagePng(800, 1100, 'tech');
  const pngScan = makeRealisticImagePng(850, 1200, 'scan');
  const pngSlide1 = makeRealisticImagePng(1000, 600, 'slide');
  const pngSlide2 = makeRealisticImagePng(1000, 600, 'tech');

  // 1. Visual Brochure (~1.5 MB to 2.2 MB)
  console.log('Creating sample-brochure.pdf...');
  const doc1 = await PDFDocument.create();
  const font1 = await doc1.embedFont(StandardFonts.HelveticaBold);
  const img1 = await doc1.embedPng(pngTech1);
  const img2 = await doc1.embedPng(pngTech2);

  const p1 = doc1.addPage([595, 842]);
  p1.drawImage(img1, { x: 30, y: 150, width: 535, height: 640 });
  p1.drawText('COMPRESSPDF ENTERPRISE SUITE', { x: 40, y: 800, size: 20, font: font1, color: rgb(0.1, 0.1, 0.4) });
  p1.drawText('High-Resolution Marketing & Digital Architecture Specification', { x: 40, y: 775, size: 10, color: rgb(0.4, 0.4, 0.5) });

  const p2 = doc1.addPage([595, 842]);
  p2.drawImage(img2, { x: 30, y: 150, width: 535, height: 640 });
  p2.drawText('PRODUCT ARCHITECTURE & BENCHMARKS', { x: 40, y: 800, size: 20, font: font1, color: rgb(0.1, 0.1, 0.4) });
  
  doc1.setTitle('CompressPDF Enterprise Brochure (High Resolution)');
  doc1.setAuthor('Antigravity Design Studio');
  
  const bytes1 = await doc1.save();
  fs.writeFileSync(path.join(dir, 'sample-brochure.pdf'), bytes1);
  console.log(`Saved sample-brochure.pdf: ${(bytes1.length / 1024).toFixed(1)} KB`);

  // 2. Scanned Document (~800 KB - 1.2 MB)
  console.log('Creating sample-scanned-document.pdf...');
  const doc2 = await PDFDocument.create();
  const imgScan = await doc2.embedPng(pngScan);
  
  const pScan1 = doc2.addPage([595, 842]);
  pScan1.drawImage(imgScan, { x: 0, y: 0, width: 595, height: 842 });

  const pScan2 = doc2.addPage([595, 842]);
  pScan2.drawImage(imgScan, { x: 0, y: 0, width: 595, height: 842 });

  doc2.setTitle('Official Scanned Legal Contract & Records');
  const bytes2 = await doc2.save();
  fs.writeFileSync(path.join(dir, 'sample-scanned.pdf'), bytes2);
  console.log(`Saved sample-scanned.pdf: ${(bytes2.length / 1024).toFixed(1)} KB`);

  // 3. Presentation Slides (~900 KB)
  console.log('Creating sample-presentation.pdf...');
  const doc3 = await PDFDocument.create();
  const imgSlide1 = await doc3.embedPng(pngSlide1);
  const imgSlide2 = await doc3.embedPng(pngSlide2);

  const pSlide1 = doc3.addPage([842, 595]);
  pSlide1.drawImage(imgSlide1, { x: 0, y: 0, width: 842, height: 595 });

  const pSlide2 = doc3.addPage([842, 595]);
  pSlide2.drawImage(imgSlide2, { x: 0, y: 0, width: 842, height: 595 });

  doc3.setTitle('Quarterly Product Strategy Slide Deck');
  const bytes3 = await doc3.save();
  fs.writeFileSync(path.join(dir, 'sample-presentation.pdf'), bytes3);
  console.log(`Saved sample-presentation.pdf: ${(bytes3.length / 1024).toFixed(1)} KB`);
}

buildSamples().catch(console.error);
