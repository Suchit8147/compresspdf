const fs = require('fs');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
const pako = require('pako');

// PNG unfilter implementation for Predictor >= 10
function unfilterPng(inflatedData, width, height, bytesPerPixel) {
  const rowSize = 1 + width * bytesPerPixel;
  if (inflatedData.length < rowSize * height) {
    throw new Error(`Data length ${inflatedData.length} is less than rowSize * height (${rowSize * height})`);
  }

  const rawPixels = new Uint8Array(width * height * bytesPerPixel);
  const prevRow = new Uint8Array(width * bytesPerPixel);
  const currRow = new Uint8Array(width * bytesPerPixel);

  let srcOffset = 0;
  let dstOffset = 0;

  for (let y = 0; y < height; y++) {
    const filterType = inflatedData[srcOffset++];
    for (let i = 0; i < currRow.length; i++) {
      currRow[i] = inflatedData[srcOffset++];
    }

    switch (filterType) {
      case 0: break;
      case 1: // Sub
        for (let x = bytesPerPixel; x < currRow.length; x++) {
          currRow[x] = (currRow[x] + currRow[x - bytesPerPixel]) & 0xff;
        }
        break;
      case 2: // Up
        for (let x = 0; x < currRow.length; x++) {
          currRow[x] = (currRow[x] + prevRow[x]) & 0xff;
        }
        break;
      case 3: // Average
        for (let x = 0; x < currRow.length; x++) {
          const left = x >= bytesPerPixel ? currRow[x - bytesPerPixel] : 0;
          const up = prevRow[x];
          currRow[x] = (currRow[x] + Math.floor((left + up) / 2)) & 0xff;
        }
        break;
      case 4: // Paeth
        for (let x = 0; x < currRow.length; x++) {
          const a = x >= bytesPerPixel ? currRow[x - bytesPerPixel] : 0;
          const b = prevRow[x];
          const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          let pr;
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          else pr = c;
          currRow[x] = (currRow[x] + pr) & 0xff;
        }
        break;
    }

    rawPixels.set(currRow, dstOffset);
    dstOffset += currRow.length;
    prevRow.set(currRow);
  }

  return rawPixels;
}

async function testSampleImages() {
  const files = ['sample-scanned.pdf', 'sample-brochure.pdf', 'sample-presentation.pdf'];

  for (const f of files) {
    console.log(`\nTesting ${f}:`);
    const buf = fs.readFileSync(`public/samples/${f}`);
    const doc = await PDFDocument.load(buf);

    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj.dict && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image') {
        const dict = obj.dict;
        const width = parseInt(dict.get(PDFName.of('Width'))?.toString() || '0', 10);
        const height = parseInt(dict.get(PDFName.of('Height'))?.toString() || '0', 10);
        const filterStr = dict.get(PDFName.of('Filter'))?.toString() || '';
        const colorSpaceStr = dict.get(PDFName.of('ColorSpace'))?.toString() || '/DeviceRGB';
        const decodeParms = dict.get(PDFName.of('DecodeParms'));
        const originalBytes = obj.getContents();

        console.log(`  Image ${ref.toString()}: ${width}x${height}, filter: ${filterStr}, bytes: ${originalBytes.length}`);

        if (filterStr.includes('FlateDecode')) {
          const inflated = pako.inflate(originalBytes);
          const isGray = colorSpaceStr.toLowerCase().includes('gray');
          const isCmyk = colorSpaceStr.toLowerCase().includes('cmyk');
          const bpp = isGray ? 1 : isCmyk ? 4 : 3;

          let predictor = 1;
          if (decodeParms && typeof decodeParms.get === 'function') {
            predictor = parseInt(decodeParms.get(PDFName.of('Predictor'))?.toString() || '1', 10);
          }

          let rawPixels = null;
          if (predictor >= 10) {
            rawPixels = unfilterPng(inflated, width, height, bpp);
          } else if (inflated.length === width * height * bpp) {
            rawPixels = inflated;
          }

          console.log(`    -> Successfully decoded raw pixels: ${rawPixels ? rawPixels.length : 'failed'} bytes`);
        }
      }
    }
  }
}

testSampleImages().catch(console.error);
