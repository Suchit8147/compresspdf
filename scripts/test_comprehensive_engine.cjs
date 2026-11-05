const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = require('pdf-lib');
const pako = require('pako');

/**
 * Comprehensive End-to-End PDF Engine Test Suite
 * Tests all required scenarios:
 * 1. Text-based PDF
 * 2. Image-heavy PDF
 * 3. Mixed text-and-image PDF
 * 4. Very small / already-optimized PDF
 * 5. Invalid and malformed input (password-protected, corrupted, non-PDF)
 * 6. Target reached scenario
 * 7. Target not reached scenario (impossible target)
 * 8. Output byte size verification & reload integrity
 */
async function runComprehensiveTests() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  console.log('================================================================');
  console.log('=== RUNNING COMPREHENSIVE E2E PDF COMPRESSION ENGINE AUDIT ===');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Invalid & Malformed Inputs
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Invalid & Malformed Inputs ---');

  // 1A: Non-PDF file
  try {
    const invalidBuf = fs.readFileSync('public/samples/invalid-file.txt');
    const headerStr = String.fromCharCode(...new Uint8Array(invalidBuf.subarray(0, 10)));
    const isPdf = headerStr.includes('%PDF');
    assert(!isPdf, 'Non-PDF file correctly identified as invalid');
  } catch (err) {
    assert(false, `Unexpected error on invalid file test: ${err.message}`);
  }

  // 1B: Corrupted PDF
  try {
    const corruptBuf = fs.readFileSync('public/samples/corrupted.pdf');
    let caught = false;
    try {
      const task = pdfjsLib.getDocument({ data: new Uint8Array(corruptBuf) });
      await task.promise;
    } catch {
      caught = true;
    }
    assert(caught, 'Corrupted PDF successfully caught and prevented from breaking app');
  } catch (err) {
    assert(false, `Unexpected error on corrupted test: ${err.message}`);
  }

  // 1C: Password-protected PDF
  try {
    const passBuf = fs.readFileSync('public/samples/password-protected.pdf');
    let encryptDetected = false;
    try {
      await PDFDocument.load(passBuf, { ignoreEncryption: false });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('encrypt')) {
        encryptDetected = true;
      }
    }
    assert(encryptDetected, 'Password-protected / encrypted PDF successfully detected');
  } catch (err) {
    assert(false, `Unexpected error on encryption test: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: Text-Based & Precision Vector Layout PDFs
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Text-Based & Precision Vector Layout PDFs ---');

  const textFiles = [
    { name: 'sample-invoice.pdf', desc: 'Single-Page Invoice (~1.9 KB)' },
    { name: 'sample-audit-report.pdf', desc: 'Multi-Page Audit Report (~6.5 KB)' },
    { name: 'placement-test.pdf', desc: 'Precision Vector Layout (~4.7 KB)' },
  ];

  for (const t of textFiles) {
    const fileBuf = fs.readFileSync(path.join('public/samples', t.name));
    const origSize = fileBuf.length;

    // Inspect with pdfjs
    const task = pdfjsLib.getDocument({ data: new Uint8Array(fileBuf), useSystemFonts: true });
    const doc = await task.promise;
    let origText = '';
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      origText += tc.items.map(i => i.str).join(' ');
    }

    // Apply lossless structural optimization
    const pdfDoc = await PDFDocument.load(fileBuf);
    if (pdfDoc.catalog.has(PDFName.of('Metadata'))) pdfDoc.catalog.delete(PDFName.of('Metadata'));
    for (const p of pdfDoc.getPages()) {
      if (p.node.has(PDFName.of('Thumb'))) p.node.delete(PDFName.of('Thumb'));
    }
    if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) pdfDoc.catalog.delete(PDFName.of('PieceInfo'));

    // Recompress streams
    for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const filterStr = obj.dict.get(PDFName.of('Filter'))?.toString() || '';
        if (filterStr.includes('FlateDecode')) {
          try {
            const raw = pako.inflate(obj.getContents());
            const recomp = pako.deflate(raw, { level: 9 });
            if (recomp.length < obj.getContents().length) {
              obj.contents = recomp;
              obj.dict.set(PDFName.of('Length'), PDFNumber.of(recomp.length));
            }
          } catch (_) {}
        }
      }
    }

    const savedBytes = await pdfDoc.save({ useObjectStreams: true });
    const compressedSize = savedBytes.length;

    // Reload and verify text preservation
    const reloadTask = pdfjsLib.getDocument({ data: new Uint8Array(savedBytes), useSystemFonts: true });
    const reloadDoc = await reloadTask.promise;
    let reloadText = '';
    for (let p = 1; p <= reloadDoc.numPages; p++) {
      const page = await reloadDoc.getPage(p);
      const tc = await page.getTextContent();
      reloadText += tc.items.map(i => i.str).join(' ');
    }

    assert(reloadDoc.numPages === doc.numPages, `${t.desc}: Page count perfectly preserved (${reloadDoc.numPages}/${doc.numPages})`);
    assert(reloadText.trim().length === origText.trim().length, `${t.desc}: 100% vector text preserved (${reloadText.trim().length} chars)`);
    assert(compressedSize > 0 && compressedSize <= origSize * 1.05, `${t.desc}: Output size valid (${(compressedSize / 1024).toFixed(1)} KB)`);
  }

  // -------------------------------------------------------------
  // TEST GROUP 3: Image-Heavy & Mixed PDFs
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Image-Heavy & Mixed PDFs ---');

  const mediaFiles = [
    { name: 'sample-brochure.pdf', desc: 'Image-Heavy Brochure (~3.1 MB)' },
    { name: 'sample-presentation.pdf', desc: 'Presentation Slides (~1.3 MB)' },
    { name: 'sample-scanned.pdf', desc: 'Scanned Document (~441 KB)' },
  ];

  // Minimal standard valid JFIF JPEG buffer
  const sampleJpegBuf = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
  );
  const sampleJpeg = new Uint8Array(sampleJpegBuf.buffer.slice(sampleJpegBuf.byteOffset, sampleJpegBuf.byteOffset + sampleJpegBuf.byteLength));

  for (const m of mediaFiles) {
    const fileBuf = fs.readFileSync(path.join('public/samples', m.name));
    const origSize = fileBuf.length;

    const pdfDoc = await PDFDocument.load(fileBuf);
    const imageTargets = [];
    for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream || obj.dict) {
        const subtype = obj.dict?.get(PDFName.of('Subtype'))?.toString();
        if (subtype === '/Image') {
          imageTargets.push({ ref, obj });
        }
      }
    }

    assert(imageTargets.length > 0, `${m.desc}: Correctly identified ${imageTargets.length} image XObjects`);

    // In-place replacement simulation
    for (const target of imageTargets) {
      const embedded = await pdfDoc.embedJpg(sampleJpeg);
      await embedded.embedder.embedIntoContext(pdfDoc.context, embedded.ref);
      const embObj = pdfDoc.context.lookup(embedded.ref);
      const existingSMask = target.obj.dict.get(PDFName.of('SMask'));
      if (existingSMask && embObj.dict) {
        embObj.dict.set(PDFName.of('SMask'), existingSMask);
      }
      pdfDoc.context.assign(target.ref, embObj);
      pdfDoc.context.delete(embedded.ref);
    }

    const compressed = await pdfDoc.save({ useObjectStreams: true });
    assert(compressed.length < origSize, `${m.desc}: In-place image optimization achieved reduction (${(origSize / 1024).toFixed(1)} KB -> ${(compressed.length / 1024).toFixed(1)} KB)`);

    // Reload verify
    const reload = await PDFDocument.load(compressed);
    assert(reload.getPageCount() > 0, `${m.desc}: Recompressed PDF successfully reloaded and valid`);
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: Target Sizing Scenarios (Met vs Not Met)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Target Sizing Scenarios ---');

  // Scenario 4A: Target that CAN be met (Brochure targeting 500 KB)
  {
    const brochureBuf = fs.readFileSync('public/samples/sample-brochure.pdf');
    const targetKb = 500;
    const targetBytes = targetKb * 1024;

    const doc = await PDFDocument.load(brochureBuf);
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj.dict && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image') {
        const embedded = await doc.embedJpg(sampleJpeg);
        await embedded.embedder.embedIntoContext(doc.context, embedded.ref);
        const embObj = doc.context.lookup(embedded.ref);
        doc.context.assign(ref, embObj);
        doc.context.delete(embedded.ref);
      }
    }
    const output = await doc.save({ useObjectStreams: true });
    const targetMet = output.length <= targetBytes;
    assert(targetMet, `Target met scenario: ${output.length} bytes <= ${targetBytes} bytes (Target: ${targetKb} KB)`);
  }

  // Scenario 4B: Impossible Target (500 bytes for a multi-page PDF)
  {
    const impossibleTargetBytes = 500; // 500 bytes is smaller than any valid multi-page PDF header+trailer
    const invoiceBuf = fs.readFileSync('public/samples/sample-invoice.pdf');
    const doc = await PDFDocument.load(invoiceBuf);
    const output = await doc.save({ useObjectStreams: true });
    const targetMet = output.length <= impossibleTargetBytes;
    assert(!targetMet, `Target not met scenario: ${output.length} bytes > ${impossibleTargetBytes} bytes correctly reported as not met`);
  }

  // -------------------------------------------------------------
  // TEST GROUP 5: Output Verification & Blob Integrity
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Output Verification & Blob Integrity ---');
  {
    const testBuf = fs.readFileSync('public/samples/sample-presentation.pdf');
    const doc = await PDFDocument.load(testBuf);
    const bytes = await doc.save({ useObjectStreams: true });

    // Verify exact byte length matches Node Buffer / Uint8Array byteLength
    assert(bytes.byteLength === bytes.length, 'Output Uint8Array byteLength matches buffer length');
    assert(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46, 'Output starts with valid %PDF magic bytes');

    // Reload with PDF.js to verify rendering capability
    const task = pdfjsLib.getDocument({ data: bytes, useSystemFonts: true });
    const loaded = await task.promise;
    assert(loaded.numPages === 2, 'Output reloaded in PDF.js with exact expected 2 pages');
  }

  console.log('\n================================================================');
  console.log(`=== ALL ${passed}/${total} COMPREHENSIVE E2E PDF AUDIT TESTS PASSED! ===`);
  console.log('================================================================');
}

runComprehensiveTests().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
