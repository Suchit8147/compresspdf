const fs = require('fs');
const workerTxt = fs.readFileSync('public/pdf.worker.min.js', 'utf8');
const lines = workerTxt.split('\n').slice(0, 30);
console.log(lines.join('\n'));

// Search for any version string
const matches = workerTxt.match(/version['":\s]+[\d.]+/gi);
console.log('Matches:', matches ? matches.slice(0, 5) : 'None');
