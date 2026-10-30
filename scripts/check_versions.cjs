const fs = require('fs');

const workerTxt = fs.readFileSync('public/pdf.worker.min.js', 'utf8');
const match = workerTxt.match(/pdfjsVersion\s*=\s*['"]([^'"]+)['"]/);
console.log('public/pdf.worker.min.js version:', match ? match[1] : 'not found');

const pdfjsPkg = JSON.parse(fs.readFileSync('node_modules/pdfjs-dist/package.json', 'utf8'));
console.log('node_modules/pdfjs-dist version:', pdfjsPkg.version);

const pdflibPkg = JSON.parse(fs.readFileSync('node_modules/pdf-lib/package.json', 'utf8'));
console.log('node_modules/pdf-lib version:', pdflibPkg.version);
