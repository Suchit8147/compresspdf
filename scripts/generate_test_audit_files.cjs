const fs = require('fs');
const path = require('path');

// 1. Corrupted PDF
const corrupted = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nCORRUPTED_STREAM_GARBAGE_NO_EOF\n');
fs.writeFileSync(path.join(__dirname, '../public/samples/corrupted.pdf'), corrupted);

// 2. Encrypted / Password-protected PDF
const pdfLines = [
  '%PDF-1.4',
  '1 0 obj',
  '<< /Type /Catalog /Pages 2 0 R >>',
  'endobj',
  '2 0 obj',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  'endobj',
  '3 0 obj',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>',
  'endobj',
  '4 0 obj',
  '<< /Filter /Standard /V 1 /R 2 /O (28bf4e5e4e758a4164004e56fffa0108) /U (28bf4e5e4e758a4164004e56fffa0108) /P -44 >>',
  'endobj',
  'xref',
  '0 5',
  '0000000000 65535 f ',
  '0000000009 00000 n ',
  '0000000058 00000 n ',
  '0000000115 00000 n ',
  '0000000189 00000 n ',
  'trailer',
  '<< /Size 5 /Root 1 0 R /Encrypt 4 0 R /ID [<0123456789abcdef0123456789abcdef> <0123456789abcdef0123456789abcdef>] >>',
  'startxref',
  '305',
  '%%EOF'
];
fs.writeFileSync(path.join(__dirname, '../public/samples/password-protected.pdf'), Buffer.from(pdfLines.join('\n')));

// 3. Invalid non-PDF file
fs.writeFileSync(path.join(__dirname, '../public/samples/invalid-file.txt'), Buffer.from('This is a plain text file, not a valid PDF.'));

console.log('Audit files generated successfully.');
