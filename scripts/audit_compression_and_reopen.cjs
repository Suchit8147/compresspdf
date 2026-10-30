const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function testReopen() {
  const brochureBytes = fs.readFileSync('public/samples/sample-brochure.pdf');
  console.log('Original brochure size:', brochureBytes.length, 'bytes');

  // Load original
  const doc = await PDFDocument.load(brochureBytes);
  console.log('Original page count:', doc.getPageCount());

  // Save with object streams (lossless pass)
  const compressedBytes = await doc.save({ useObjectStreams: true });
  console.log('Saved with object streams:', compressedBytes.length, 'bytes');

  // Now TEST REOPENING the output bytes!
  const reopenedDoc = await PDFDocument.load(compressedBytes);
  console.log('Reopened document page count:', reopenedDoc.getPageCount());
  console.log('Document successfully reopened and valid!');
}

testReopen().catch(console.error);
