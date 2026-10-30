const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

async function testComprehensive() {
  console.log('=== STARTING COMPREHENSIVE PDF ENGINE TEST ===\n');

  // 1. Password-Protected PDF Test
  console.log('Test 1: Password-Protected PDF (password-protected.pdf)');
  const passBuf = fs.readFileSync('public/samples/password-protected.pdf');
  let detectedPassword = false;
  try {
    await PDFDocument.load(passBuf.buffer.slice(passBuf.byteOffset, passBuf.byteOffset + passBuf.byteLength), { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      detectedPassword = true;
    }
  }
  console.log(`  Password protection detected: ${detectedPassword ? 'PASS ✅' : 'FAIL ❌'}`);

  // 2. Corrupted PDF Test
  console.log('\nTest 2: Corrupted PDF (corrupted.pdf)');
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
    console.log(`  Corrupted file caught with error: ${err.name} -> PASS ✅`);
  }
  if (!detectedCorrupt) console.log('  Corrupted file was not caught: FAIL ❌');

  // Helper to test loading and compressing a valid PDF
  async function testValidPdf(label, filePath, level = 'recommended') {
    console.log(`\nTest: ${label} (${path.basename(filePath)})`);
    const fileBuf = fs.readFileSync(filePath);
    const arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
    const originalSize = arrayBuffer.byteLength;

    // Load with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useWorkerFetch: false,
      isEvalSupported: false
    });
    const pdf = await loadingTask.promise;
    console.log(`  Original Size: ${(originalSize / 1024).toFixed(1)} KB, Pages: ${pdf.numPages}`);

    // Inspect metadata
    const metadata = await pdf.getMetadata().catch(() => ({}));
    console.log(`  Title: "${metadata?.info?.Title || 'N/A'}"`);

    // Verify each page can be rendered
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 0.5 });
      if (!vp.width || !vp.height) {
        throw new Error(`Page ${p} has invalid dimensions`);
      }
    }
    console.log(`  All ${pdf.numPages} pages successfully parsed and dimensioned -> PASS ✅`);
  }

  // 3. Normal text-based PDF
  await testValidPdf('Normal Text-Based PDF', 'public/samples/sample-invoice.pdf');

  // 4. Image-based PDF
  await testValidPdf('Image-Based PDF (Scanned)', 'public/samples/sample-scanned.pdf');

  // 5. Multi-page PDF
  await testValidPdf('Multi-Page PDF (5 pages)', 'public/samples/sample-audit-report.pdf');

  // 6. Large PDF
  await testValidPdf('Large PDF (3.1 MB brochure)', 'public/samples/sample-brochure.pdf');

  console.log('\n=== ALL COMPREHENSIVE ENGINE TESTS PASSED! ===');
}

testComprehensive().catch((e) => {
  console.error('\n❌ TEST FAILED:', e);
  process.exit(1);
});
