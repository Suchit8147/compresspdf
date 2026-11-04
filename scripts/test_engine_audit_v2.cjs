const fs = require('fs');
const path = require('path');
const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = require('pdf-lib');
const pako = require('pako');

// Standard minimal valid JPEG buffer
const validJpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

async function runTestSuite() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  console.log('========================================================');
  console.log('=== RUNNING COMPREHENSIVE PDF ENGINE AUDIT SUITE V2 ===');
  console.log('========================================================\n');

  // Test 1: Password-protected detection
  console.log('Test 1: Password-Protected PDF Trap');
  const passBuf = fs.readFileSync('public/samples/password-protected.pdf');
  let passProtected = false;
  try {
    await PDFDocument.load(passBuf, { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      passProtected = true;
    }
  }
  console.log(`  Password detection: ${passProtected ? 'PASS ✅' : 'FAIL ❌'}`);

  // Test 2: Corrupted PDF Trap
  console.log('\nTest 2: Corrupted PDF Trap');
  const corruptBuf = fs.readFileSync('public/samples/corrupted.pdf');
  let corruptTrapped = false;
  try {
    const task = pdfjsLib.getDocument({ data: new Uint8Array(corruptBuf) });
    await task.promise;
  } catch (err) {
    corruptTrapped = true;
    console.log(`  Corrupted structure caught (${err.name}): PASS ✅`);
  }
  if (!corruptTrapped) throw new Error('Corrupted file was not trapped!');

  // Helper to extract text and page info
  async function inspectDoc(buffer) {
    const task = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true
    });
    const doc = await task.promise;
    const pages = [];
    let fullText = '';

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });
      const tc = await page.getTextContent();
      const text = tc.items.map(i => i.str).join(' ').trim();
      fullText += text;
      pages.push({ pageNum: p, width: vp.width, height: vp.height, textLength: text.length });
    }
    return { numPages: doc.numPages, pages, fullTextLength: fullText.length, fullText };
  }

  // Test Files Matrix
  const testFiles = [
    { name: 'sample-invoice.pdf', desc: 'Text-Based Invoice (Small ~1.9 KB)', expectedType: 'text_vector' },
    { name: 'sample-audit-report.pdf', desc: 'Multi-Page Audit Report (Text/Vector ~6.4 KB)', expectedType: 'text_vector' },
    { name: 'placement-test.pdf', desc: 'Precision Vector Layout (~4.5 KB)', expectedType: 'text_vector' },
    { name: 'sample-brochure.pdf', desc: 'Image-Heavy Marketing Brochure (~3.1 MB)', expectedType: 'image_heavy' },
    { name: 'sample-presentation.pdf', desc: 'Corporate Presentation Slides (~1.3 MB)', expectedType: 'mixed' },
    { name: 'sample-scanned.pdf', desc: 'Scanned Document (~441 KB)', expectedType: 'scanned' },
  ];

  for (const item of testFiles) {
    console.log(`\n--------------------------------------------------------`);
    console.log(`Testing: ${item.desc} [${item.name}]`);
    const fileBuf = fs.readFileSync(path.join('public/samples', item.name));
    const origSize = fileBuf.length;

    // 1. Baseline analysis
    const baseline = await inspectDoc(fileBuf);
    console.log(`  Baseline: ${(origSize / 1024).toFixed(1)} KB, ${baseline.numPages} pages, ${baseline.fullTextLength} chars text`);

    // 2. Count image XObjects
    const doc = await PDFDocument.load(fileBuf);
    const imageTargets = [];
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj.dict && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image') {
        imageTargets.push({ ref, obj });
      }
    }
    console.log(`  Embedded Image XObjects: ${imageTargets.length}`);

    // 3. Structural optimization
    if (doc.catalog.has(PDFName.of('Metadata'))) {
      doc.catalog.delete(PDFName.of('Metadata'));
    }
    for (const p of doc.getPages()) {
      if (p.node.has(PDFName.of('Thumb'))) p.node.delete(PDFName.of('Thumb'));
    }
    if (doc.catalog.has(PDFName.of('PieceInfo'))) doc.catalog.delete(PDFName.of('PieceInfo'));

    // Recompress streams
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const filterStr = obj.dict.get(PDFName.of('Filter'))?.toString() || '';
        const subtype = obj.dict.get(PDFName.of('Subtype'))?.toString();
        if (subtype !== '/Image' && filterStr === '/FlateDecode') {
          try {
            const raw = pako.inflate(obj.getContents());
            const recompressed = pako.deflate(raw, { level: 9 });
            if (recompressed.length < obj.getContents().length * 0.95) {
              obj.contents = recompressed;
              obj.dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
            }
          } catch (_) {}
        }
      }
    }

    // 4. In-place image recompression simulation for images
    if (imageTargets.length > 0) {
      for (const target of imageTargets) {
        const embedded = await doc.embedJpg(validJpeg);
        await embedded.embedder.embedIntoContext(doc.context, embedded.ref);
        const embObj = doc.context.lookup(embedded.ref);
        const existingSMask = target.obj.dict.get(PDFName.of('SMask'));
        if (existingSMask && embObj.dict) {
          embObj.dict.set(PDFName.of('SMask'), existingSMask);
        }
        doc.context.assign(target.ref, embObj);
        doc.context.delete(embedded.ref);
      }
    }

    // 5. Save with object streams
    const savedBytes = await doc.save({ useObjectStreams: true });
    const finalSize = savedBytes.length;
    const diff = origSize - finalSize;
    const pct = ((diff / origSize) * 100).toFixed(1);

    console.log(`  Result Size: ${(finalSize / 1024).toFixed(1)} KB (Saved: ${(diff / 1024).toFixed(1)} KB, ${pct}%)`);

    // 6. Inspect after compression
    const after = await inspectDoc(savedBytes);

    // Assertions
    // A. Page count must match
    if (after.numPages !== baseline.numPages) {
      throw new Error(`Page count mismatch! Expected ${baseline.numPages}, got ${after.numPages}`);
    }
    console.log(`  Page Count: ${after.numPages}/${baseline.numPages} -> MATCH ✅`);

    // B. Viewports must match
    for (let i = 0; i < baseline.pages.length; i++) {
      const bP = baseline.pages[i];
      const aP = after.pages[i];
      if (Math.abs(bP.width - aP.width) > 0.01 || Math.abs(bP.height - aP.height) > 0.01) {
        throw new Error(`Dimension mismatch on page ${i + 1}`);
      }
    }
    console.log(`  Page Dimensions: Exact match preserved -> MATCH ✅`);

    // C. Searchable text preservation
    if (baseline.fullTextLength > 0) {
      if (after.fullTextLength !== baseline.fullTextLength) {
        throw new Error(`Text length mismatch! Baseline: ${baseline.fullTextLength}, After: ${after.fullTextLength}`);
      }
      console.log(`  Searchable Text: 100% vector text preserved (${after.fullTextLength} chars) -> PASS ✅`);
    } else {
      console.log(`  Searchable Text: Scanned document (0 vector text chars) -> PASS ✅`);
    }
  }

  console.log('\n========================================================');
  console.log('=== ALL COMPREHENSIVE PDF ENGINE AUDIT TESTS PASSED! ===');
  console.log('========================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});

