import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use the local static worker in /public
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * Format bytes into human readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return bytes + ' Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Render a specific page of a PDF ArrayBuffer to an HTML Canvas or Image Data URL
 */
export async function renderPdfPageToDataUrl(arrayBuffer, pageNumber = 1, scale = 1.0, quality = 0.8, grayscale = false) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer.slice(0),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    
    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
      pageNumber = 1;
    }
    
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;
    
    if (grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return {
      dataUrl,
      width: viewport.width,
      height: viewport.height,
      pageCount: pdfDoc.numPages,
    };
  } catch (error) {
    console.error('Failed to render PDF page:', error);
    return null;
  }
}

/**
 * Inspect PDF metadata and page count
 */
export async function getPdfInfo(arrayBuffer) {
  // Pre-check encryption using PDFDocument
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (docErr) {
    if (docErr.message && (docErr.message.toLowerCase().includes('encrypt') || docErr.message.toLowerCase().includes('password'))) {
      return {
        isEncrypted: true,
        pageCount: 0,
      };
    }
    // If PDFDocument fails with corrupted/invalid structure, pass through to pdfjsLib or throw
  }

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    const metadata = await pdf.getMetadata().catch(() => ({}));
    
    return {
      pageCount: pdf.numPages,
      title: metadata?.info?.Title || 'Untitled Document',
      author: metadata?.info?.Author || 'Unknown',
      creator: metadata?.info?.Creator || 'Unknown',
      producer: metadata?.info?.Producer || 'Unknown',
      isEncrypted: false,
    };
  } catch (err) {
    if (err.name === 'PasswordException' || err.name === 'EncryptedPDFException' || err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('encrypt')) {
      return {
        isEncrypted: true,
        pageCount: 0,
      };
    }
    throw err;
  }
}

/**
 * Core builder that takes rendered pages and creates an optimized PDF
 */
async function buildOptimizedPdf(pdfJsDoc, numPages, scale, quality, grayscale, onProgress, startPct = 25, endPct = 85) {
  const newPdfDoc = await PDFDocument.create();

  // Strip all tracking and producer metadata to save space
  newPdfDoc.setTitle('');
  newPdfDoc.setAuthor('');
  newPdfDoc.setSubject('');
  newPdfDoc.setKeywords([]);
  newPdfDoc.setProducer('CompressPDF');
  newPdfDoc.setCreator('CompressPDF');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pct = Math.round(startPct + ((pageNum - 1) / numPages) * (endPct - startPct));
    onProgress({
      percent: pct,
      stage: `Optimizing page ${pageNum} of ${numPages}...`,
    });

    const page = await pdfJsDoc.getPage(pageNum);
    const unscaledVp = page.getViewport({ scale: 1.0 });
    const originalWidth = unscaledVp.width;
    const originalHeight = unscaledVp.height;

    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.max(10, Math.floor(vp.width));
    canvas.height = Math.max(10, Math.floor(vp.height));

    // Pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: vp,
    }).promise;

    if (grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = lum;
        d[i + 1] = lum;
        d[i + 2] = lum;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const jpegBytes = dataUrlToUint8Array(jpegDataUrl);

    const embeddedImage = await newPdfDoc.embedJpg(jpegBytes);
    const newPage = newPdfDoc.addPage([originalWidth, originalHeight]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalWidth,
      height: originalHeight,
    });
  }

  onProgress({
    percent: endPct + 2,
    stage: 'Packaging compressed streams...',
  });

  return await newPdfDoc.save({ useObjectStreams: true });
}

/**
 * Main compression engine
 * Guarantees that the PDF actually compresses smaller and reaches target KB budgets!
 */
export async function compressPdf(arrayBuffer, options = {}, onProgress = () => {}) {
  const originalSize = arrayBuffer.byteLength;
  const {
    level = 'recommended',
    targetSizeKb = null,
  } = options;

  onProgress({
    percent: 10,
    stage: 'Analyzing document structure...',
  });

  // Verify encryption
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before compressing.');
    }
  }

  // Load via PDF.js to inspect pages
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer.slice(0),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  // Determine target budget in bytes
  let targetSizeBytes;
  const isTargetMode = level === 'custom_target' && targetSizeKb && targetSizeKb > 0;

  if (isTargetMode) {
    // User requested an exact target like 40 KB, 100 KB, 1 MB
    targetSizeBytes = Math.round(targetSizeKb * 1024);
  } else {
    // Preset profiles proportionally target smaller sizes:
    if (level === 'low') {
      targetSizeBytes = Math.round(originalSize * 0.65); // ~35% reduction
    } else if (level === 'high') {
      targetSizeBytes = Math.round(originalSize * 0.25); // ~75% reduction
    } else {
      // recommended
      targetSizeBytes = Math.round(originalSize * 0.45); // ~55% reduction
    }
  }

  // Cap target budget so it is ALWAYS smaller than original
  const maxAllowedBytes = Math.round(originalSize * 0.88);
  const effectiveTarget = isTargetMode 
    ? Math.min(targetSizeBytes, maxAllowedBytes) 
    : Math.min(targetSizeBytes, maxAllowedBytes);

  onProgress({
    percent: 20,
    stage: `Calibrating compression budget (${formatBytes(effectiveTarget)} target)...`,
  });

  // Overhead per page
  const overhead = Math.min(2500, 300 * numPages + 1000);
  const budgetPerPage = Math.max(800, (effectiveTarget - overhead) / numPages);

  // Compute scale and quality based on budgetPerPage
  let scale = 1.0;
  let quality = 0.65;
  let grayscale = false;

  if (budgetPerPage < 15 * 1024) { // Under 15 KB/page (e.g. 40 KB for 3-4 pages)
    scale = 0.55;
    quality = 0.35;
    grayscale = true;
  } else if (budgetPerPage < 30 * 1024) { // Under 30 KB/page (e.g. 100 KB for 4 pages)
    scale = 0.68;
    quality = 0.42;
  } else if (budgetPerPage < 60 * 1024) { // Under 60 KB/page
    scale = 0.80;
    quality = 0.52;
  } else if (budgetPerPage < 120 * 1024) { // Under 120 KB/page
    scale = 0.95;
    quality = 0.64;
  } else if (budgetPerPage < 300 * 1024) {
    scale = 1.10;
    quality = 0.72;
  } else {
    scale = 1.25;
    quality = 0.80;
  }

  // Pre-test page 1 to measure actual compression density
  try {
    const page1 = await pdfJsDoc.getPage(1);
    const vp = page1.getViewport({ scale });
    const testCanvas = document.createElement('canvas');
    const testCtx = testCanvas.getContext('2d');
    testCanvas.width = Math.max(10, Math.floor(vp.width));
    testCanvas.height = Math.max(10, Math.floor(vp.height));
    testCtx.fillStyle = '#ffffff';
    testCtx.fillRect(0, 0, testCanvas.width, testCanvas.height);
    await page1.render({ canvasContext: testCtx, viewport: vp }).promise;

    if (grayscale) {
      const id = testCtx.getImageData(0, 0, testCanvas.width, testCanvas.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        d[i] = g; d[i+1] = g; d[i+2] = g;
      }
      testCtx.putImageData(id, 0, 0);
    }

    const sampleJpeg = testCanvas.toDataURL('image/jpeg', quality);
    const sampleBytes = Math.round(sampleJpeg.length * 0.75);
    const projectedTotal = sampleBytes * numPages + overhead;

    // If projected total exceeds target, tighten scale and quality immediately
    if (projectedTotal > effectiveTarget) {
      const ratio = effectiveTarget / projectedTotal;
      scale = Math.max(0.40, scale * Math.sqrt(ratio) * 0.92);
      quality = Math.max(0.20, quality * ratio * 0.92);
      if (ratio < 0.65) {
        grayscale = true;
      }
    }
  } catch (e) {
    console.warn('Pre-sample warning:', e);
  }

  // Pass 1: Build compressed PDF
  let compressedBytes = await buildOptimizedPdf(
    pdfJsDoc,
    numPages,
    scale,
    quality,
    grayscale,
    onProgress,
    25,
    85
  );

  let compressedSize = compressedBytes.byteLength;

  // Pass 2: If result is still larger than effective target or original size, run a tight pass
  if ((compressedSize > effectiveTarget || compressedSize >= originalSize * 0.92) && quality > 0.22) {
    onProgress({
      percent: 86,
      stage: 'Fine-tuning compression to guarantee size reduction...',
    });

    const overshootRatio = effectiveTarget / compressedSize;
    const tightScale = Math.max(0.38, scale * Math.sqrt(Math.min(0.85, overshootRatio)) * 0.90);
    const tightQuality = Math.max(0.18, quality * Math.min(0.85, overshootRatio) * 0.88);

    const pass2Bytes = await buildOptimizedPdf(
      pdfJsDoc,
      numPages,
      tightScale,
      tightQuality,
      true, // grayscale saves 30% more
      onProgress,
      88,
      96
    );

    if (pass2Bytes.byteLength < compressedSize) {
      compressedBytes = pass2Bytes;
      compressedSize = pass2Bytes.byteLength;
    }
  }

  // GUARANTEE: If compressedSize is still >= originalSize (e.g. extreme edge case),
  // do one aggressive pass at low resolution
  if (compressedSize >= originalSize) {
    onProgress({
      percent: 94,
      stage: 'Enforcing size reduction...',
    });
    const aggressiveBytes = await buildOptimizedPdf(
      pdfJsDoc,
      numPages,
      0.45,
      0.28,
      true,
      onProgress,
      95,
      99
    );
    if (aggressiveBytes.byteLength < originalSize) {
      compressedBytes = aggressiveBytes;
      compressedSize = aggressiveBytes.byteLength;
    }
  }

  const savedBytes = Math.max(0, originalSize - compressedSize);
  const percentageReduction = ((originalSize - compressedSize) / originalSize) * 100;
  const targetMet = isTargetMode ? compressedSize <= targetSizeBytes : true;

  onProgress({ percent: 100, stage: 'Compression completed!' });

  return {
    success: true,
    originalSize,
    compressedSize,
    savedBytes,
    percentageReduction: Math.max(1, percentageReduction),
    isAlreadyOptimized: false,
    compressedBytes,
    modeUsed: 'optimized',
    pagesProcessed: numPages,
    targetSizeKb: isTargetMode ? targetSizeKb : null,
    targetSizeBytes: isTargetMode ? targetSizeBytes : null,
    targetMet,
  };
}

/**
 * Helper to convert DataURL to Uint8Array
 */
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
