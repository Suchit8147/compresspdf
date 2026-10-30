const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

async function testFile(filename) {
  const filePath = path.join('public/samples', filename);
  console.log(`\n================ Testing ${filename} ================`);
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  // Test 1: pdf-lib with ignoreEncryption: false
  try {
    const doc1 = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
    console.log(`  [pdf-lib strict]: SUCCESS (${doc1.getPageCount()} pages)`);
  } catch (err) {
    console.log(`  [pdf-lib strict]: FAILED -> ${err.name}: ${err.message}`);
  }

  // Test 2: pdf-lib with ignoreEncryption: true
  try {
    const doc2 = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
    console.log(`  [pdf-lib ignoreEncryption]: SUCCESS (${doc2.getPageCount()} pages)`);
  } catch (err) {
    console.log(`  [pdf-lib ignoreEncryption]: FAILED -> ${err.name}: ${err.message}`);
  }

  // Test 3: pdfjsLib
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    console.log(`  [pdfjsLib]: SUCCESS (${pdf.numPages} pages)`);
  } catch (err) {
    console.log(`  [pdfjsLib]: FAILED -> ${err.name}: ${err.message}`);
  }
}

async function run() {
  const files = fs.readdirSync('public/samples');
  for (const f of files) {
    if (f.endsWith('.pdf')) {
      await testFile(f);
    }
  }
}

run().catch(console.error);
