const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Generate a valid minimal 200x200 JPEG or create rich pages
// We can construct a valid JFIF JPEG using canvas or standard headers, or generate multi-page rich graphics
async function createRichPhotoSample() {
  const samplesDir = path.join(__dirname, '../public/samples');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Simple valid 1x1 or small jpeg base64 repeated or multi-page rich artwork
  // Minimal valid 100x100 solid color JPEG base64:
  const sampleJpgBase64 = 
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAHgAoABAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  
  // Let's create a 4-page rich brochure with geometric patterns, high density shapes, paths and metadata
  for (let pageNum = 1; pageNum <= 4; pageNum++) {
    const page = doc.addPage([595.28, 841.89]);
    
    // Background gradient effect with strips
    for (let i = 0; i < 50; i++) {
      page.drawRectangle({
        x: 0,
        y: 841.89 - (i * 17),
        width: 595.28,
        height: 18,
        color: rgb(
          0.9 + Math.sin(i * 0.1) * 0.08,
          0.92 + Math.cos(i * 0.1) * 0.06,
          0.98
        )
      });
    }

    page.drawText(`High-Resolution Visual Brochure - Page ${pageNum}`, {
      x: 40,
      y: 790,
      size: 20,
      font: boldFont,
      color: rgb(0.12, 0.18, 0.4)
    });

    page.drawText('Sample document containing high-density graphical elements and embedded metadata.', {
      x: 40,
      y: 765,
      size: 11,
      font,
      color: rgb(0.35, 0.4, 0.5)
    });

    // Draw high density matrix of elements
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 40 + c * 86;
        const y = 690 - r * 50;
        
        page.drawRectangle({
          x,
          y,
          width: 78,
          height: 42,
          color: rgb(
            (r * 20 % 255) / 255,
            (c * 40 % 255) / 255,
            0.7
          ),
          borderColor: rgb(0.2, 0.3, 0.5),
          borderWidth: 1
        });

        page.drawText(`Obj ${r}-${c}`, {
          x: x + 6,
          y: y + 16,
          size: 9,
          font: boldFont,
          color: rgb(1, 1, 1)
        });
      }
    }
  }

  doc.setTitle('High-Resolution Visual Brochure Sample');
  doc.setAuthor('CompressPDF Studio');
  doc.setKeywords(['sample', 'pdf', 'test', 'compress']);

  const bytes = await doc.save();
  fs.writeFileSync(path.join(samplesDir, 'sample-brochure.pdf'), bytes);
  console.log('Created sample-brochure.pdf:', bytes.length, 'bytes');
}

createRichPhotoSample().catch(console.error);
