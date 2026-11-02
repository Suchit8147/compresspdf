import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import pako from 'pako';

// Configure the worker using Vite's bundled worker URL, fallback to local static worker in /public
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || '/pdf.worker.min.mjs';
}

const CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/cmaps/';

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
 * Quality profiles defining image resolution, JPEG compression, and vector retention
 */
export const QUALITY_PROFILES = {
  high_quality: {
    id: 'high_quality',
    title: 'High Quality',
    subtitle: 'Sharp Text & High Fidelity',
    description: 'Preserves original vector text, diagrams, and formatting with gentle image optimization (~82% quality, up to 1600px). Recommended default.',
    reductionEstimate: '~25% – 50% smaller',
    default: true,
    maxImageDimension: 1600,
    jpegQuality: 0.82,
    badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
  },
  balanced: {
    id: 'balanced',
    title: 'Balanced',
    subtitle: 'Optimized Quality & Size',
    description: 'Maintains text readability while moderately compressing images (~70% quality, up to 1200px). Ideal for email and sharing.',
    reductionEstimate: '~40% – 70% smaller',
    maxImageDimension: 1200,
    jpegQuality: 0.70,
    badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
  },
  smaller_file: {
    id: 'smaller_file',
    title: 'Smaller File',
    subtitle: 'Maximum File Reduction',
    description: 'Strongest preset reduction for upload limits. Selectable vector text is preserved; image resolution is compacted (~52% quality, up to 850px).',
    reductionEstimate: '~60% – 85% smaller',
    maxImageDimension: 850,
    jpegQuality: 0.52,
    badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
  },
};

export function getProfileTitle(level) {
  if (level === 'balanced' || level === 'recommended') return 'Balanced';
  if (level === 'smaller_file' || level === 'high') return 'Smaller File';
  return 'High Quality';
}

/**
 * Render a specific page of a PDF ArrayBuffer to an HTML Canvas or Image Data URL
 */
export async function renderPdfPageToDataUrl(arrayBuffer, pageNumber = 1, scale = 1.0, quality = 0.90, grayscale = false) {
  try {
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: CMAP_URL,
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
    canvas.width = Math.max(10, Math.floor(viewport.width));
    canvas.height = Math.max(10, Math.floor(viewport.height));
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: ctx,
      canvas: canvas,
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
    console.warn('Failed to render PDF page thumbnail:', error);
    return null;
  }
}

/**
 * Inspect PDF metadata, page count, and encryption
 */
export async function getPdfInfo(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('The selected file is empty (0 bytes). Please upload a valid PDF.');
  }

  // Pre-check magic bytes (%PDF)
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(10, arrayBuffer.byteLength)));
  const headerStr = String.fromCharCode(...headerBytes);
  if (!headerStr.includes('%PDF')) {
    throw new Error('Invalid file format: This file does not appear to be a valid PDF document (missing %PDF header).');
  }

  // Pre-check encryption using pdf-lib
  let isEncrypted = false;
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (docErr) {
    const msg = (docErr.message || '').toLowerCase();
    if (msg.includes('encrypt') || msg.includes('password')) {
      isEncrypted = true;
      return {
        isEncrypted: true,
        pageCount: 0,
        title: 'Encrypted Document',
      };
    }
  }

  // Inspect document using PDF.js
  try {
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
    });
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
    if (
      isEncrypted ||
      err.name === 'PasswordException' ||
      err.name === 'EncryptedPDFException' ||
      err.message?.toLowerCase().includes('password') ||
      err.message?.toLowerCase().includes('encrypt')
    ) {
      return {
        isEncrypted: true,
        pageCount: 0,
        title: 'Encrypted Document',
      };
    }

    if (err.name === 'InvalidPDFException' || err.message?.toLowerCase().includes('invalid pdf')) {
      throw new Error('Corrupted PDF: This document has an invalid or damaged internal structure.');
    }

    throw new Error(err.message || 'Could not parse PDF document.');
  }
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

/**
 * Standard PNG predictor un-filtering for FlateDecode streams with Predictor >= 10
 */
function unfilterPng(inflatedData, width, height, bytesPerPixel) {
  const rowSize = 1 + width * bytesPerPixel;
  if (inflatedData.length < rowSize * height) {
    throw new Error(`Data length ${inflatedData.length} is less than rowSize * height (${rowSize * height})`);
  }

  const rawPixels = new Uint8Array(width * height * bytesPerPixel);
  const prevRow = new Uint8Array(width * bytesPerPixel);
  const currRow = new Uint8Array(width * bytesPerPixel);

  let srcOffset = 0;
  let dstOffset = 0;

  for (let y = 0; y < height; y++) {
    const filterType = inflatedData[srcOffset++];
    for (let i = 0; i < currRow.length; i++) {
      currRow[i] = inflatedData[srcOffset++];
    }

    switch (filterType) {
      case 0: break; // None
      case 1: // Sub
        for (let x = bytesPerPixel; x < currRow.length; x++) {
          currRow[x] = (currRow[x] + currRow[x - bytesPerPixel]) & 0xff;
        }
        break;
      case 2: // Up
        for (let x = 0; x < currRow.length; x++) {
          currRow[x] = (currRow[x] + prevRow[x]) & 0xff;
        }
        break;
      case 3: // Average
        for (let x = 0; x < currRow.length; x++) {
          const left = x >= bytesPerPixel ? currRow[x - bytesPerPixel] : 0;
          const up = prevRow[x];
          currRow[x] = (currRow[x] + Math.floor((left + up) / 2)) & 0xff;
        }
        break;
      case 4: // Paeth
        for (let x = 0; x < currRow.length; x++) {
          const a = x >= bytesPerPixel ? currRow[x - bytesPerPixel] : 0;
          const b = prevRow[x];
          const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          let pr;
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          else pr = c;
          currRow[x] = (currRow[x] + pr) & 0xff;
        }
        break;
      default:
        break;
    }

    rawPixels.set(currRow, dstOffset);
    dstOffset += currRow.length;
    prevRow.set(currRow);
  }

  return rawPixels;
}

/**
 * Decode JPEG bytes into a scaled canvas
 */
async function decodeJpegToCanvas(jpegBytes, maxDimension) {
  if (typeof document === 'undefined') return null;

  try {
    const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
    let imgSource = null;

    if (typeof createImageBitmap === 'function') {
      try {
        imgSource = await createImageBitmap(blob);
      } catch (_bmErr) {
        imgSource = null;
      }
    }

    if (!imgSource) {
      imgSource = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
    }

    const origW = imgSource.width;
    const origH = imgSource.height;

    let targetW = origW;
    let targetH = origH;
    if (Math.max(origW, origH) > maxDimension) {
      const scale = maxDimension / Math.max(origW, origH);
      targetW = Math.max(1, Math.round(origW * scale));
      targetH = Math.max(1, Math.round(origH * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgSource, 0, 0, targetW, targetH);

    if (imgSource.close && typeof imgSource.close === 'function') {
      imgSource.close();
    }

    return { canvas, targetW, targetH, origW, origH };
  } catch (err) {
    console.warn('decodeJpegToCanvas failed:', err);
    return null;
  }
}

/**
 * Convert raw scanline bytes (RGB, Grayscale, CMYK) into a scaled canvas
 */
function rawScanlinesToCanvas(rawBytes, width, height, colorSpace, maxDimension) {
  if (typeof document === 'undefined') return null;

  try {
    const isGray = colorSpace && colorSpace.toLowerCase().includes('gray');
    const isCmyk = colorSpace && colorSpace.toLowerCase().includes('cmyk');
    const isRgb = !isGray && !isCmyk;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const d = imgData.data;

    if (isRgb) {
      let srcIdx = 0;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = rawBytes[srcIdx++];
        d[i + 1] = rawBytes[srcIdx++];
        d[i + 2] = rawBytes[srcIdx++];
        d[i + 3] = 255;
      }
    } else if (isGray) {
      let srcIdx = 0;
      for (let i = 0; i < d.length; i += 4) {
        const g = rawBytes[srcIdx++];
        d[i] = g;
        d[i + 1] = g;
        d[i + 2] = g;
        d[i + 3] = 255;
      }
    } else if (isCmyk) {
      let srcIdx = 0;
      for (let i = 0; i < d.length; i += 4) {
        const c = rawBytes[srcIdx++] / 255;
        const m = rawBytes[srcIdx++] / 255;
        const y = rawBytes[srcIdx++] / 255;
        const k = rawBytes[srcIdx++] / 255;
        d[i] = Math.round(255 * (1 - c) * (1 - k));
        d[i + 1] = Math.round(255 * (1 - m) * (1 - k));
        d[i + 2] = Math.round(255 * (1 - y) * (1 - k));
        d[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // If downsampling needed
    if (Math.max(width, height) > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = targetW;
      scaledCanvas.height = targetH;
      const sCtx = scaledCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(canvas, 0, 0, targetW, targetH);
      return { canvas: scaledCanvas, targetW, targetH, origW: width, origH: height };
    }

    return { canvas, targetW: width, targetH: height, origW: width, origH: height };
  } catch (err) {
    console.warn('rawScanlinesToCanvas failed:', err);
    return null;
  }
}

/**
 * Optimize all image indirect objects in a cloned PDFDocument using given settings
 */
async function optimizeDocImages(arrayBuffer, maxDimension, jpegQuality) {
  const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0));
  let imagesOptimized = 0;
  let bytesSaved = 0;

  // Enumerate all indirect objects
  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream || obj.dict) {
      const subtype = obj.dict?.get(PDFName.of('Subtype'));
      if (subtype && subtype.toString() === '/Image') {
        const dict = obj.dict;
        const width = parseInt(dict.get(PDFName.of('Width'))?.toString() || '0', 10);
        const height = parseInt(dict.get(PDFName.of('Height'))?.toString() || '0', 10);
        const filterStr = dict.get(PDFName.of('Filter'))?.toString() || '';
        const colorSpaceStr = dict.get(PDFName.of('ColorSpace'))?.toString() || '/DeviceRGB';
        const decodeParms = dict.get(PDFName.of('DecodeParms'));
        const originalBytes = obj.getContents();
        const origLength = originalBytes.length;

        // Skip tiny spacers (< 1000 bytes or < 24px)
        if (origLength < 1000 || (width > 0 && width < 24 && height > 0 && height < 24)) {
          continue;
        }

        let canvasResult = null;

        // Method A: Direct JPEG Decode
        if (filterStr.includes('DCTDecode')) {
          canvasResult = await decodeJpegToCanvas(originalBytes, maxDimension);
        }

        // Method B: FlateDecode with or without PNG Predictor
        if (!canvasResult && filterStr.includes('FlateDecode') && width > 0 && height > 0) {
          try {
            const inflated = pako.inflate(originalBytes);
            const isGray = colorSpaceStr.toLowerCase().includes('gray');
            const isCmyk = colorSpaceStr.toLowerCase().includes('cmyk');
            const bytesPerPixel = isGray ? 1 : isCmyk ? 4 : 3;

            let predictor = 1;
            if (decodeParms && typeof decodeParms.get === 'function') {
              predictor = parseInt(decodeParms.get(PDFName.of('Predictor'))?.toString() || '1', 10);
            }

            let rawPixels = null;
            if (predictor >= 10) {
              rawPixels = unfilterPng(inflated, width, height, bytesPerPixel);
            } else if (inflated.length >= width * height * bytesPerPixel) {
              rawPixels = inflated;
            }

            if (rawPixels) {
              canvasResult = rawScanlinesToCanvas(rawPixels, width, height, colorSpaceStr, maxDimension);
            }
          } catch (_e) {
            // Predictor error or custom stream
          }
        }

        if (canvasResult && canvasResult.canvas) {
          const newJpegDataUrl = canvasResult.canvas.toDataURL('image/jpeg', jpegQuality);
          const newJpegBytes = dataUrlToUint8Array(newJpegDataUrl);

          // Only replace if new bytes are smaller than original
          if (newJpegBytes.length < origLength * 0.98) {
            try {
              const embedded = await pdfDoc.embedJpg(newJpegBytes);
              await embedded.embedder.embedIntoContext(pdfDoc.context, embedded.ref);
              const embObj = pdfDoc.context.lookup(embedded.ref);

              const existingSMask = dict.get(PDFName.of('SMask'));
              if (existingSMask && embObj.dict) {
                embObj.dict.set(PDFName.of('SMask'), existingSMask);
              }

              pdfDoc.context.assign(ref, embObj);
              pdfDoc.context.delete(embedded.ref);

              imagesOptimized++;
              bytesSaved += (origLength - newJpegBytes.length);
            } catch (embedErr) {
              console.warn('embedJpg error on ref:', ref.toString(), embedErr);
            }
          }
        }
      }
    }
  }

  return { doc: pdfDoc, imagesOptimized, bytesSaved };
}

/**
 * Main intelligent compression engine with progressive multi-pass strategy
 * Preserves 100% vector typography, searchable text, embedded fonts, and page layout.
 */
export async function compressPdf(arrayBuffer, options = {}, onProgress = () => {}) {
  const originalSize = arrayBuffer.byteLength;
  const {
    level = 'high_quality',
    targetSizeKb = null,
  } = options;

  const isTargetMode = level === 'custom_target' && targetSizeKb && targetSizeKb > 0;
  const targetSizeBytes = isTargetMode ? Math.round(targetSizeKb * 1024) : null;

  onProgress({
    percent: 10,
    stage: 'Analyzing document structure & contents...',
  });

  // Verify encryption with pdf-lib
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before compressing.');
    }
  }

  // Count image XObjects in the document
  const tempDoc = await PDFDocument.load(arrayBuffer.slice(0));
  const imageRefs = [];
  for (const [ref, obj] of tempDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream || obj.dict) {
      const subtype = obj.dict?.get(PDFName.of('Subtype'));
      if (subtype && subtype.toString() === '/Image') {
        imageRefs.push(ref);
      }
    }
  }
  const hasImages = imageRefs.length > 0;

  // ========================================================
  // PASS 1: Lossless PDF Optimization & Object Stream Compaction
  // ========================================================
  onProgress({
    percent: 25,
    stage: 'Pass 1: Lossless PDF optimization & stream compaction...',
  });

  const docPass1 = await PDFDocument.load(arrayBuffer.slice(0));
  docPass1.setProducer('CompressPDF');
  docPass1.setCreator('CompressPDF');
  const bytesPass1 = await docPass1.save({ useObjectStreams: true });
  const sizePass1 = bytesPass1.byteLength;

  // If Target Mode and Pass 1 already reached the target:
  if (isTargetMode && sizePass1 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target reached losslessly!' });
    const saved = Math.max(0, originalSize - sizePass1);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;
    return {
      success: true,
      originalSize,
      compressedSize: sizePass1,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: sizePass1 >= originalSize,
      compressedBytes: sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0)),
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Lossless PDF Structure Optimization',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: 'Target reached using lossless structure optimization. Vector text, fonts, and images were preserved with zero quality change.',
      imagesProcessed: 0,
      totalImages: imageRefs.length,
    };
  }

  // If the document has NO images (pure vector text):
  if (!hasImages) {
    onProgress({ percent: 100, stage: 'Document optimization completed.' });
    const finalSize = Math.min(originalSize, sizePass1);
    const finalBytes = sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0));
    const saved = Math.max(0, originalSize - finalSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;
    const met = isTargetMode ? finalSize <= targetSizeBytes : true;

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: finalSize >= originalSize,
      compressedBytes: finalBytes,
      modeUsed: isTargetMode ? 'custom_target' : level,
      modeTitle: isTargetMode ? `Target ≤ ${formatBytes(targetSizeBytes)}` : getProfileTitle(level),
      strategyUsed: 'Vector Text & Structure Optimization',
      targetMet: met,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: isTargetMode && !met
        ? `Target of ${formatBytes(targetSizeBytes)} not reached: This document contains vector typography and embedded fonts with no compressible images. Entire pages were preserved as selectable vector text rather than blurry rasterized images.`
        : 'Vector typography and document streams optimized losslessly.',
      imagesProcessed: 0,
      totalImages: 0,
    };
  }

  // ========================================================
  // PASS 2: Moderate Image Compression & Downsampling
  // ========================================================
  onProgress({
    percent: 50,
    stage: 'Pass 2: Applying calibrated image compression...',
  });

  let pass2MaxDim = 1600;
  let pass2Quality = 0.82;

  if (level === 'balanced' || level === 'recommended') {
    pass2MaxDim = 1200;
    pass2Quality = 0.70;
  } else if (level === 'smaller_file' || level === 'high') {
    pass2MaxDim = 850;
    pass2Quality = 0.52;
  } else if (isTargetMode) {
    const targetRatio = targetSizeBytes / originalSize;
    if (targetRatio < 0.45) {
      pass2MaxDim = 1000;
      pass2Quality = 0.62;
    } else if (targetRatio < 0.70) {
      pass2MaxDim = 1250;
      pass2Quality = 0.72;
    } else {
      pass2MaxDim = 1500;
      pass2Quality = 0.80;
    }
  }

  const { doc: docPass2, imagesOptimized: countPass2 } = await optimizeDocImages(
    arrayBuffer,
    pass2MaxDim,
    pass2Quality
  );
  docPass2.setProducer('CompressPDF');
  docPass2.setCreator('CompressPDF');
  const bytesPass2 = await docPass2.save({ useObjectStreams: true });
  const sizePass2 = bytesPass2.byteLength;

  // Preset Mode Finished at Pass 2
  if (!isTargetMode) {
    onProgress({ percent: 100, stage: 'Compression completed successfully!' });
    const bestBytes = sizePass2 < originalSize ? bytesPass2 : (sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0)));
    const bestSize = bestBytes.byteLength;
    const saved = Math.max(0, originalSize - bestSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;

    return {
      success: true,
      originalSize,
      compressedSize: bestSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: bestSize >= originalSize,
      compressedBytes: bestBytes,
      modeUsed: level,
      modeTitle: getProfileTitle(level),
      strategyUsed: `${getProfileTitle(level)} Adaptive Image Compression`,
      targetMet: true,
      targetSizeBytes: null,
      targetSizeKb: null,
      qualityNotice: `Preserved selectable vector text while optimizing ${countPass2} embedded images.`,
      imagesProcessed: countPass2,
      totalImages: imageRefs.length,
    };
  }

  // Target Mode: Did Pass 2 reach target?
  if (sizePass2 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved successfully!' });
    const saved = Math.max(0, originalSize - sizePass2);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;
    return {
      success: true,
      originalSize,
      compressedSize: sizePass2,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: sizePass2 >= originalSize,
      compressedBytes: bytesPass2,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Calibrated Adaptive Compression (Target Met)',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: `Target achieved: ${formatBytes(sizePass2)} ≤ target ${formatBytes(targetSizeBytes)}. Vector text remained selectable and intact.`,
      imagesProcessed: countPass2,
      totalImages: imageRefs.length,
    };
  }

  // ========================================================
  // PASS 3: Progressive Adaptive Compression (Target Not Reached in Pass 2)
  // ========================================================
  onProgress({
    percent: 72,
    stage: 'Pass 3: Progressive adaptive compression to reach target budget...',
  });

  const overshootRatio = sizePass2 / targetSizeBytes;
  const pass3MaxDim = Math.max(650, Math.round(pass2MaxDim / Math.sqrt(Math.min(2.8, overshootRatio))));
  const pass3Quality = Math.max(0.44, Math.min(0.65, pass2Quality / Math.min(2.2, overshootRatio)));

  const { doc: docPass3, imagesOptimized: countPass3 } = await optimizeDocImages(
    arrayBuffer,
    pass3MaxDim,
    pass3Quality
  );
  docPass3.setProducer('CompressPDF');
  docPass3.setCreator('CompressPDF');
  const bytesPass3 = await docPass3.save({ useObjectStreams: true });
  const sizePass3 = bytesPass3.byteLength;

  if (sizePass3 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved successfully!' });
    const saved = Math.max(0, originalSize - sizePass3);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;
    return {
      success: true,
      originalSize,
      compressedSize: sizePass3,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: sizePass3 >= originalSize,
      compressedBytes: bytesPass3,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Progressive Adaptive Compression (Target Met)',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: `Target achieved: ${formatBytes(sizePass3)} ≤ target ${formatBytes(targetSizeBytes)}. Vector text remained selectable and intact.`,
      imagesProcessed: countPass3,
      totalImages: imageRefs.length,
    };
  }

  // ========================================================
  // PASS 4: Final Safe Quality Floor Attempt
  // ========================================================
  onProgress({
    percent: 90,
    stage: 'Pass 4: Evaluating safe quality floor limit...',
  });

  const pass4MaxDim = 500;
  const pass4Quality = 0.36;

  const { doc: docPass4, imagesOptimized: countPass4 } = await optimizeDocImages(
    arrayBuffer,
    pass4MaxDim,
    pass4Quality
  );
  docPass4.setProducer('CompressPDF');
  docPass4.setCreator('CompressPDF');
  const bytesPass4 = await docPass4.save({ useObjectStreams: true });
  const sizePass4 = bytesPass4.byteLength;

  // Determine best (smallest) output between passes
  let bestBytes = bytesPass4;
  let bestSize = sizePass4;
  let bestCount = countPass4;

  if (sizePass4 >= sizePass3) {
    bestBytes = bytesPass3;
    bestSize = sizePass3;
    bestCount = countPass3;
  }
  if (bestSize >= sizePass2) {
    bestBytes = bytesPass2;
    bestSize = sizePass2;
    bestCount = countPass2;
  }
  if (bestSize >= originalSize) {
    bestBytes = new Uint8Array(arrayBuffer.slice(0));
    bestSize = originalSize;
  }

  const targetMet = bestSize <= targetSizeBytes;
  const savedBytes = Math.max(0, originalSize - bestSize);
  const percentageReduction = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

  onProgress({
    percent: 100,
    stage: targetMet ? 'Target achieved!' : 'Compression completed.',
  });

  return {
    success: true,
    originalSize,
    compressedSize: bestSize,
    savedBytes,
    percentageReduction,
    isAlreadyOptimized: bestSize >= originalSize,
    compressedBytes: bestBytes,
    modeUsed: 'custom_target',
    modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
    strategyUsed: targetMet ? 'Multi-Pass Adaptive Compression' : 'Quality-Protected Compression',
    targetMet,
    targetSizeBytes,
    targetSizeKb,
    qualityNotice: targetMet
      ? `Target achieved: ${formatBytes(bestSize)} ≤ target ${formatBytes(targetSizeBytes)}.`
      : `Target of ${formatBytes(targetSizeBytes)} was not reached. Reduced to ${formatBytes(bestSize)} (${Math.round(percentageReduction)}% saved). Further compression was halted at safe visual floor limits to avoid severe photo blurriness and maintain text legibility.`,
    imagesProcessed: bestCount,
    totalImages: imageRefs.length,
  };
}
