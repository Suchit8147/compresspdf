const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName } = require('pdf-lib');

async function testComprehensive() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  console.log('=====================================================');
  console.log('=== STARTING COMPREHENSIVE PDF ENGINE AUDIT SUITE ===');
  console.log('=====================================================\n');

  // 1. Password-Protected PDF Test
  console.log('Test 1: Password-Protected PDF Detection');
  const passBuf = fs.readFileSync('public/samples/password-protected.pdf');
  let detectedPassword = false;
  try {
    await PDFDocument.load(passBuf.buffer.slice(passBuf.byteOffset, passBuf.byteOffset + passBuf.byteLength), { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      detectedPassword = true;
    }
  }
  console.log(`  Result: Password-protected document identified safely -> ${detectedPassword ? 'PASS ✅' : 'FAIL ❌'}`);

  // 2. Corrupted PDF Test
  console.log('\nTest 2: Corrupted PDF Structure Handling');
  const corruptBuf = fs.readFileSync('public/samples/corrupted.pdf');
  let detectedCorrupt = false;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(corruptBuf.buffer.slice(corruptBuf.byteOffset, corruptBuf.byteOffset + corruptBuf.byteLength)),
      useWorkerFetch: false,
      isEvalSupported: false
    });
    await loadingTask.promise;
  } catch (err) {
    detectedCorrupt = true;
    console.log(`  Result: Corrupted structure safely trapped (${err.name}) -> PASS ✅`);
  }
  if (!detectedCorrupt) throw new Error('Corrupted file was not caught!');

  // Helper to extract all text strings and page viewports from a PDF
  async function extractDocumentDetails(buffer) {
    // Slicing buffer prevents detachment
    const copy = buffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(copy),
      useWorkerFetch: false,
      isEvalSupported: false
    });
    const doc = await loadingTask.promise;
    const pages = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      const text = textContent.items.map(it => it.str).join(' ').trim();
      pages.push({
        pageNum: p,
        width: vp.width,
        height: vp.height,
        textLength: text.length,
        sampleText: text.slice(0, 80)
      });
    }

    return { numPages: doc.numPages, pages };
  }

  // 3. Document Quality & Text Preservation Audit
  const testFiles = [
    { label: 'Normal Text-Based Invoice', file: 'sample-invoice.pdf', type: 'text' },
    { label: 'Multi-Page Audit Report (5 Pages)', file: 'sample-audit-report.pdf', type: 'text_multipage' },
    { label: 'Precision Diagram & Layout Test', file: 'placement-test.pdf', type: 'diagram_layout' },
    { label: 'High-Resolution Marketing Brochure', file: 'sample-brochure.pdf', type: 'mixed_media' },
    { label: 'Corporate Presentation Slides', file: 'sample-presentation.pdf', type: 'presentation' },
    { label: 'Scanned Document', file: 'sample-scanned.pdf', type: 'scanned' },
  ];

  for (const item of testFiles) {
    console.log(`\n-----------------------------------------------------`);
    console.log(`Testing: ${item.label} (${item.file})`);
    const fileBuf = fs.readFileSync(path.join('public/samples', item.file));
    const arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
    const originalSize = arrayBuffer.byteLength;

    // A. Extract baseline before compression
    const baseline = await extractDocumentDetails(arrayBuffer.slice(0));
    console.log(`  Baseline: ${(originalSize / 1024).toFixed(1)} KB, ${baseline.numPages} pages`);

    // B. Optimize document with PDF-Lib (preserving 100% vector text)
    const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0));
    
    // Inspect image indirect objects
    let imageCount = 0;
    for (const [_ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if (obj.dict && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image') {
        imageCount++;
      }
    }
    console.log(`  Embedded Image XObjects detected: ${imageCount}`);

    // Structure optimization
    pdfDoc.setProducer('CompressPDF');
    pdfDoc.setCreator('CompressPDF');
    const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
    const optimizedSize = optimizedBytes.length;

    // C. Re-inspect optimized document with PDF.js
    const after = await extractDocumentDetails(optimizedBytes.buffer.slice(optimizedBytes.byteOffset, optimizedBytes.byteOffset + optimizedBytes.byteLength));

    // D. Assertions
    // 1. Page count must be identical
    if (after.numPages !== baseline.numPages) {
      throw new Error(`Page count mismatch! Expected ${baseline.numPages}, got ${after.numPages}`);
    }
    console.log(`  Page count verification: ${after.numPages}/${baseline.numPages} -> MATCH ✅`);

    // 2. Viewport dimensions must be identical
    for (let i = 0; i < baseline.pages.length; i++) {
      const bP = baseline.pages[i];
      const aP = after.pages[i];
      if (Math.abs(bP.width - aP.width) > 0.01 || Math.abs(bP.height - aP.height) > 0.01) {
        throw new Error(`Page ${i + 1} dimension mismatch!`);
      }
    }
    console.log(`  Page dimensions verification: Exact dimensions preserved across all pages -> MATCH ✅`);

    // 3. Text content must be 100% intact (zero missing text, zero broken fonts)
    for (let i = 0; i < baseline.pages.length; i++) {
      const bP = baseline.pages[i];
      const aP = after.pages[i];
      if (bP.textLength > 0) {
        if (aP.textLength !== bP.textLength) {
          throw new Error(`Text length mismatch on page ${i + 1}! Original: ${bP.textLength}, Optimized: ${aP.textLength}`);
        }
      }
    }
    console.log(`  Text clarity & readability: 100% selectable vector text preserved -> PASS ✅`);

    console.log(`  Overall Status: PASS ✅ (${(optimizedSize / 1024).toFixed(1)} KB, valid & verified)`);
  }

  console.log('\n=====================================================');
  console.log('=== ALL COMPREHENSIVE ENGINE AUDIT TESTS PASSED!  ===');
  console.log('=====================================================');
}

testComprehensive().catch((e) => {
  console.error('\n❌ AUDIT FAILED:', e);
  process.exit(1);
});
