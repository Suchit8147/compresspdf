const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createSamples() {
  const samplesDir = path.join(__dirname, '../public/samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // 1. Text & Vector PDF (Invoice/Report)
  const doc1 = await PDFDocument.create();
  const font = await doc1.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc1.embedFont(StandardFonts.HelveticaBold);
  
  const page1 = doc1.addPage([595.28, 841.89]); // A4
  page1.drawText('INVOICE / FINANCIAL REPORT', { x: 50, y: 780, size: 22, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
  page1.drawText('CompressPDF Technologies Inc.', { x: 50, y: 755, size: 12, font });
  page1.drawText('Invoice Number: INV-2026-8942', { x: 50, y: 735, size: 10, font });
  page1.drawText('Date: October 30, 2026', { x: 50, y: 720, size: 10, font });
  
  // Draw some decorative vector lines & boxes
  page1.drawRectangle({
    x: 50,
    y: 650,
    width: 495,
    height: 40,
    color: rgb(0.93, 0.95, 0.98),
    borderColor: rgb(0.7, 0.8, 0.95),
    borderWidth: 1,
  });
  page1.drawText('Description', { x: 60, y: 665, size: 11, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
  page1.drawText('Amount', { x: 480, y: 665, size: 11, font: boldFont, color: rgb(0.1, 0.15, 0.3) });

  let curY = 620;
  for (let i = 1; i <= 8; i++) {
    page1.drawText(`Enterprise Cloud Storage & Document Suite - Item #${i}`, { x: 60, y: curY, size: 10, font });
    page1.drawText(`$${(i * 125.5).toFixed(2)}`, { x: 480, y: curY, size: 10, font });
    page1.drawLine({
      start: { x: 50, y: curY - 8 },
      end: { x: 545, y: curY - 8 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.9),
    });
    curY -= 25;
  }

  doc1.setTitle('Standard Business Invoice #8942');
  doc1.setAuthor('Financial Services');
  doc1.setSubject('Quarterly billing details');
  doc1.setProducer('Antigravity PDF Generator');
  
  const pdfBytes1 = await doc1.save();
  fs.writeFileSync(path.join(samplesDir, 'sample-invoice.pdf'), pdfBytes1);
  console.log('Created sample-invoice.pdf:', pdfBytes1.length, 'bytes');

  // 2. Multi-page Presentation PDF with Embedded Image
  const doc2 = await PDFDocument.create();
  // Create a raw uncompressed-style PNG in memory
  // Let's create a 400x400 PNG with colored pattern
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  // To keep it simple and valid, we can generate a basic PNG or draw multiple vector elements
  // Let's create 3 pages with rich content
  for (let p = 1; p <= 3; p++) {
    const page = doc2.addPage([842, 595]); // Landscape
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 842,
      height: 595,
      color: rgb(0.96, 0.97, 1.0),
    });
    page.drawText(`High Impact Presentation - Slide ${p}`, {
      x: 60,
      y: 520,
      size: 26,
      font: boldFont,
      color: rgb(0.15, 0.2, 0.45)
    });
    page.drawText(`Comprehensive Analysis & Digital Transformation Overview`, {
      x: 60,
      y: 490,
      size: 14,
      font,
      color: rgb(0.4, 0.45, 0.55)
    });

    // Draw rich graphical grids
    for (let x = 60; x <= 740; x += 110) {
      for (let y = 100; y <= 400; y += 70) {
        page.drawRectangle({
          x,
          y,
          width: 95,
          height: 55,
          color: rgb(
            0.5 + ((x * p) % 100) / 200,
            0.6 + ((y * p) % 100) / 250,
            0.8 + ((x + y) % 50) / 250
          ),
          borderColor: rgb(0.3, 0.4, 0.7),
          borderWidth: 1.5,
        });
        page.drawText(`Card ${x/10}-${y/10}`, { x: x + 10, y: y + 25, size: 9, font });
      }
    }
  }

  const pdfBytes2 = await doc2.save();
  fs.writeFileSync(path.join(samplesDir, 'sample-presentation.pdf'), pdfBytes2);
  console.log('Created sample-presentation.pdf:', pdfBytes2.length, 'bytes');

  // 3. Document with large metadata & multiple pages (simulating bloated PDF)
  const doc3 = await PDFDocument.create();
  for (let i = 1; i <= 5; i++) {
    const page = doc3.addPage([600, 800]);
    page.drawText(`Document Archive Record - Page ${i} of 5`, { x: 50, y: 750, size: 18, font: boldFont });
    for (let j = 0; j < 30; j++) {
      page.drawText(`Audit trail row #${j + 1}: Checksum verification completed. Log code 0x${(i * 1000 + j).toString(16)}. Timestamp ${new Date().toISOString()}`, {
        x: 50,
        y: 700 - (j * 20),
        size: 9,
        font
      });
    }
  }
  doc3.setTitle('Archival Audit Report 2026 - Very Long Detailed Title with Extensive Metadata');
  doc3.setAuthor('Antigravity Automated Compliance Bot');
  doc3.setSubject('Deep compliance logs for testing compression algorithms and stream deflating');
  doc3.setKeywords(['audit', 'compliance', 'pdf', 'archive', 'benchmark', 'test']);

  const pdfBytes3 = await doc3.save();
  fs.writeFileSync(path.join(samplesDir, 'sample-audit-report.pdf'), pdfBytes3);
  console.log('Created sample-audit-report.pdf:', pdfBytes3.length, 'bytes');
}

createSamples().catch(console.error);
