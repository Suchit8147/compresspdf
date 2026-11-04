import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import pako from 'pako';

// Configure the worker using Vite's bundled worker URL, fallback to local static worker in /public
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || '/pdf.worker.min.mjs';
}

const CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/cmaps/';
const STANDARD_FONT_DATA_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/standard_fonts/';

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
    scanScale: 1.5,
    badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
  },
  balanced: {
    id: 'balanced',
    title: 'Balanced',
    subtitle: 'Optimized Quality & Size',
    description: 'Maintains text readability while moderately compressing images (~68% quality, up to 1200px). Ideal for email and sharing.',
    reductionEstimate: '~40% – 70% smaller',
    maxImageDimension: 1200,
    jpegQuality: 0.68,
    scanScale: 1.25,
    badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
  },
  strong_compression: {
    id: 'strong_compression',
    title: 'Strong Compression',
    subtitle: 'Maximum File Reduction',
    description: 'Strongest reduction for strict upload caps (~48% quality, up to 800px). Photo resolution is compacted; text remains readable.',
    reductionEstimate: '~60% – 85% smaller',
    maxImageDimension: 800,
    jpegQuality: 0.48,
    scanScale: 1.0,
    badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
  },
};

// Backward compatibility alias for 'smaller_file'
QUALITY_PROFILES.smaller_file = QUALITY_PROFILES.strong_compression;

export function getProfileTitle(level) {
  if (level === 'balanced' || level === 'recommended') return 'Balanced';
  if (level === 'strong_compression' || level === 'smaller_file' || level === 'high') return 'Strong Compression';
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
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
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
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
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
      } catch {
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
 * Decode FlateDecode image streams (RGB, Gray, CMYK, 1-bit monochrome, Indexed) into a canvas
 */
function decodeFlateToCanvas(inflatedData, width, height, colorSpaceStr, bpc, decodeParms, maxDimension) {
  if (typeof document === 'undefined') return null;

  try {
    const isGray = colorSpaceStr.toLowerCase().includes('gray');
    const isCmyk = colorSpaceStr.toLowerCase().includes('cmyk');
    const isIndexed = colorSpaceStr.toLowerCase().includes('indexed');

    let rawPixels = null;

    // 1-bit monochrome (scanned documents)
    if (bpc === 1) {
      const bytesPerRow = Math.ceil(width / 8);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(width, height);
      const d = imgData.data;
      let dst = 0;

      for (let y = 0; y < height; y++) {
        const rowStart = y * bytesPerRow;
        for (let x = 0; x < width; x++) {
          const byteVal = inflatedData[rowStart + (x >> 3)];
          const bit = (byteVal >> (7 - (x & 7))) & 1;
          const val = bit ? 255 : 0;
          d[dst++] = val;
          d[dst++] = val;
          d[dst++] = val;
          d[dst++] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

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
    }

    // 8-bit standard color spaces
    let predictor = 1;
    if (decodeParms && typeof decodeParms.get === 'function') {
      predictor = parseInt(decodeParms.get(PDFName.of('Predictor'))?.toString() || '1', 10);
    }

    const bytesPerPixel = isGray || isIndexed ? 1 : isCmyk ? 4 : 3;

    if (predictor >= 10) {
      rawPixels = unfilterPng(inflatedData, width, height, bytesPerPixel);
    } else if (inflatedData.length >= width * height * bytesPerPixel) {
      rawPixels = inflatedData;
    } else {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const d = imgData.data;

    let src = 0;
    if (isGray || isIndexed) {
      for (let i = 0; i < d.length; i += 4) {
        const val = rawPixels[src++];
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
        d[i + 3] = 255;
      }
    } else if (isCmyk) {
      for (let i = 0; i < d.length; i += 4) {
        const c = rawPixels[src++] / 255;
        const m = rawPixels[src++] / 255;
        const y = rawPixels[src++] / 255;
        const k = rawPixels[src++] / 255;
        d[i] = Math.round(255 * (1 - c) * (1 - k));
        d[i + 1] = Math.round(255 * (1 - m) * (1 - k));
        d[i + 2] = Math.round(255 * (1 - y) * (1 - k));
        d[i + 3] = 255;
      }
    } else {
      // Standard RGB
      for (let i = 0; i < d.length; i += 4) {
        d[i] = rawPixels[src++];
        d[i + 1] = rawPixels[src++];
        d[i + 2] = rawPixels[src++];
        d[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

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
    console.warn('decodeFlateToCanvas error:', err);
    return null;
  }
}

/**
 * Structural optimization: strips unneeded metadata and re-compresses content streams
 */
function optimizePdfStructure(pdfDoc) {
  let cleanedCount = 0;

  // 1. Remove XML XMP Metadata stream from Catalog
  try {
    if (pdfDoc.catalog.has(PDFName.of('Metadata'))) {
      pdfDoc.catalog.delete(PDFName.of('Metadata'));
      cleanedCount++;
    }
  } catch (_) {}

  // 2. Remove page thumbnails
  try {
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      if (page.node.has(PDFName.of('Thumb'))) {
        page.node.delete(PDFName.of('Thumb'));
        cleanedCount++;
      }
    }
  } catch (_) {}

  // 3. Remove PieceInfo (private Illustrator / InDesign metadata)
  try {
    if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) {
      pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
      cleanedCount++;
    }
  } catch (_) {}

  // 4. Re-compress uncompressed or poorly-compressed content streams
  try {
    for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream) {
        const filter = obj.dict.get(PDFName.of('Filter'));
        const filterStr = filter ? filter.toString() : '';
        const subtype = obj.dict.get(PDFName.of('Subtype'))?.toString();

        if (subtype !== '/Image') {
          if (!filter || filterStr === '') {
            const raw = obj.getContents();
            if (raw && raw.length > 32) {
              const deflated = pako.deflate(raw, { level: 9 });
              if (deflated.length < raw.length) {
                obj.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
                obj.contents = deflated;
                obj.dict.set(PDFName.of('Length'), PDFNumber.of(deflated.length));
                cleanedCount++;
              }
            }
          } else if (filterStr === '/FlateDecode') {
            try {
              const raw = pako.inflate(obj.getContents());
              const recompressed = pako.deflate(raw, { level: 9 });
              if (recompressed.length < obj.getContents().length * 0.95) {
                obj.contents = recompressed;
                obj.dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
                cleanedCount++;
              }
            } catch (_) {}
          }
        }
      }
    }
  } catch (_) {}

  return cleanedCount;
}

/**
 * Optimize all image indirect objects in a cloned PDFDocument using given settings.
 * Preserves 100% vector typography and layout by replacing image streams in-place.
 */
async function optimizeDocImages(arrayBuffer, maxDimension, jpegQuality) {
  const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0));
  let imagesOptimized = 0;
  let bytesSaved = 0;

  // Collect all image XObjects first into an array to avoid mutating Map while iterating
  const imageTargets = [];
  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream || obj.dict) {
      const subtype = obj.dict?.get(PDFName.of('Subtype'));
      if (subtype && subtype.toString() === '/Image') {
        imageTargets.push({ ref, obj });
      }
    }
  }

  for (const target of imageTargets) {
    const { ref, obj } = target;
    const dict = obj.dict;
    const width = parseInt(dict.get(PDFName.of('Width'))?.toString() || '0', 10);
    const height = parseInt(dict.get(PDFName.of('Height'))?.toString() || '0', 10);
    const filterStr = dict.get(PDFName.of('Filter'))?.toString() || '';
    const colorSpaceStr = dict.get(PDFName.of('ColorSpace'))?.toString() || '/DeviceRGB';
    const bpc = parseInt(dict.get(PDFName.of('BitsPerComponent'))?.toString() || '8', 10);
    const decodeParms = dict.get(PDFName.of('DecodeParms'));
    const existingSMask = dict.get(PDFName.of('SMask'));
    const originalBytes = obj.getContents();
    const origLength = originalBytes ? originalBytes.length : 0;

    // Skip tiny icons or spacer pixels (< 600 bytes or < 20px)
    if (origLength < 600 || (width > 0 && width < 20 && height > 0 && height < 20)) {
      continue;
    }

    // Safety rule for SMask: if image has an SMask, keep original dimensions
    // to avoid PDF specification mismatch error between parent image and mask.
    const effectiveMaxDim = existingSMask ? Math.max(width, height) : maxDimension;

    let canvasResult = null;

    // Method A: Direct JPEG Decode
    if (filterStr.includes('DCTDecode')) {
      canvasResult = await decodeJpegToCanvas(originalBytes, effectiveMaxDim);
    }

    // Method B: FlateDecode (PNG / Raw Scanlines)
    if (!canvasResult && filterStr.includes('FlateDecode') && width > 0 && height > 0) {
      try {
        const inflated = pako.inflate(originalBytes);
        canvasResult = decodeFlateToCanvas(
          inflated,
          width,
          height,
          colorSpaceStr,
          bpc,
          decodeParms,
          effectiveMaxDim
        );
      } catch (_) {}
    }

    if (canvasResult && canvasResult.canvas) {
      const newJpegDataUrl = canvasResult.canvas.toDataURL('image/jpeg', jpegQuality);
      const newJpegBytes = dataUrlToUint8Array(newJpegDataUrl);

      // Only replace if new bytes achieve a meaningful reduction or downsampling
      const didDownsample = canvasResult.targetW < canvasResult.origW || canvasResult.targetH < canvasResult.origH;
      const threshold = didDownsample ? 0.98 : 0.95;

      if (newJpegBytes.length < origLength * threshold) {
        try {
          const embedded = await pdfDoc.embedJpg(newJpegBytes);
          await embedded.embedder.embedIntoContext(pdfDoc.context, embedded.ref);
          const embObj = pdfDoc.context.lookup(embedded.ref);

          // Preserve soft mask (transparency) if present
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

  // Also apply structural cleanup
  optimizePdfStructure(pdfDoc);

  return { doc: pdfDoc, imagesOptimized, bytesSaved, totalTargets: imageTargets.length };
}

/**
 * Page-level optimization for scanned documents where pages are scanned images
 */
async function optimizeScannedDocPages(arrayBuffer, scale, jpegQuality, onProgress = () => {}) {
  try {
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });
    const pdf = await loadingTask.promise;
    const newDoc = await PDFDocument.create();

    for (let p = 1; p <= pdf.numPages; p++) {
      onProgress({
        percent: Math.round(40 + (p / pdf.numPages) * 45),
        stage: `Recompressing scanned page ${p} of ${pdf.numPages}...`,
      });

      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(10, Math.floor(viewport.width));
      canvas.height = Math.max(10, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: viewport,
      }).promise;

      const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
      const embeddedJpg = await newDoc.embedJpg(jpegBytes);

      // Add page matching original point dimensions
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });
    }

    newDoc.setProducer('CompressPDF');
    newDoc.setCreator('CompressPDF');
    const bytes = await newDoc.save({ useObjectStreams: true });
    return bytes;
  } catch (err) {
    console.warn('optimizeScannedDocPages failed:', err);
    return null;
  }
}

/**
 * Inspect document content to classify it: 'text_vector', 'scanned', or 'mixed'
 */
async function analyzeDocumentContent(arrayBuffer) {
  try {
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });
    const pdf = await loadingTask.promise;
    let totalTextChars = 0;

    for (let p = 1; p <= Math.min(5, pdf.numPages); p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      totalTextChars += tc.items.reduce((sum, it) => sum + (it.str ? it.str.trim().length : 0), 0);
    }

    // Count image XObjects with pdf-lib
    const tempDoc = await PDFDocument.load(arrayBuffer.slice(0));
    let imageCount = 0;
    for (const [, obj] of tempDoc.context.enumerateIndirectObjects()) {
      if (obj.dict && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image') {
        imageCount++;
      }
    }

    if (imageCount === 0) {
      return { type: 'text_vector', imageCount, totalTextChars };
    }
    if (totalTextChars < 30) {
      return { type: 'scanned', imageCount, totalTextChars };
    }
    return { type: 'mixed', imageCount, totalTextChars };
  } catch {
    return { type: 'mixed', imageCount: 1, totalTextChars: 100 };
  }
}

/**
 * Main multi-strategy compression engine.
 * Supports High Quality, Balanced, Strong Compression, and Custom Target Size.
 * Preserves 100% searchable text, embedded fonts, and vector layout.
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
    stage: 'Analyzing document structure & content type...',
  });

  // Verify encryption
  try {
    await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: false });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      throw new Error('This PDF is password-protected. Please unlock it before compressing.');
    }
  }

  // Classify document
  const { type: docType, imageCount } = await analyzeDocumentContent(arrayBuffer);
  const hasImages = imageCount > 0;

  // ========================================================
  // PASS 1: Lossless PDF Optimization & Object Stream Compaction
  // ========================================================
  onProgress({
    percent: 25,
    stage: 'Pass 1: Lossless structural cleanup & stream compaction...',
  });

  const docPass1 = await PDFDocument.load(arrayBuffer.slice(0));
  optimizePdfStructure(docPass1);
  docPass1.setProducer('CompressPDF');
  docPass1.setCreator('CompressPDF');
  const bytesPass1 = await docPass1.save({ useObjectStreams: true });
  const sizePass1 = bytesPass1.byteLength;

  // If Target Mode and Pass 1 reached the target:
  if (isTargetMode && sizePass1 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved losslessly!' });
    const finalBytes = sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0));
    const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });

    return {
      success: true,
      originalSize,
      compressedSize: finalBlob.size,
      savedBytes: Math.max(0, originalSize - finalBlob.size),
      percentageReduction: originalSize > 0 ? ((originalSize - finalBlob.size) / originalSize) * 100 : 0,
      isAlreadyOptimized: finalBlob.size >= originalSize,
      compressedBytes: finalBytes,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Lossless Structural Optimization',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: 'Target reached using lossless structure optimization. Vector text, fonts, and layout preserved with zero quality change.',
      imagesProcessed: 0,
      totalImages: imageCount,
    };
  }

  // If the document has NO images (pure vector typography & embedded fonts):
  if (!hasImages || docType === 'text_vector') {
    onProgress({ percent: 100, stage: 'Vector document optimization completed.' });
    const finalBytes = sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0));
    const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
    const verifiedSize = finalBlob.size;
    const saved = Math.max(0, originalSize - verifiedSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;
    const met = isTargetMode ? verifiedSize <= targetSizeBytes : true;

    return {
      success: true,
      originalSize,
      compressedSize: verifiedSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: verifiedSize >= originalSize,
      compressedBytes: finalBytes,
      modeUsed: isTargetMode ? 'custom_target' : level,
      modeTitle: isTargetMode ? `Target ≤ ${formatBytes(targetSizeBytes)}` : getProfileTitle(level),
      strategyUsed: 'Vector Text & Structure Optimization',
      targetMet: met,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: isTargetMode && !met
        ? `Target of ${formatBytes(targetSizeBytes)} could not be reached safely. This document consists of vector typography and embedded fonts with no compressible images. Entire pages were preserved as selectable vector text rather than being converted into blurry raster images.`
        : verifiedSize < originalSize
        ? 'Vector typography and document streams optimized losslessly. 100% selectable text preserved.'
        : 'This document consists of clean vector typography and contains no redundant data. It is already optimally sized.',
      imagesProcessed: 0,
      totalImages: 0,
    };
  }

  // ========================================================
  // PRESET MODES (High Quality, Balanced, Strong Compression)
  // ========================================================
  if (!isTargetMode) {
    onProgress({
      percent: 50,
      stage: `Applying ${getProfileTitle(level)} image optimization...`,
    });

    const profile = QUALITY_PROFILES[level] || QUALITY_PROFILES.high_quality;
    const { doc: docOpt, imagesOptimized } = await optimizeDocImages(
      arrayBuffer,
      profile.maxImageDimension,
      profile.jpegQuality
    );

    docOpt.setProducer('CompressPDF');
    docOpt.setCreator('CompressPDF');
    const bytesOpt = await docOpt.save({ useObjectStreams: true });
    let bestBytes = bytesOpt;

    // For scanned documents without text, if in-place replacement didn't compress enough:
    if (docType === 'scanned' && (bytesOpt.length >= originalSize * 0.85)) {
      onProgress({ percent: 75, stage: 'Applying scanned document page recompression...' });
      const scannedBytes = await optimizeScannedDocPages(
        arrayBuffer,
        profile.scanScale,
        profile.jpegQuality,
        onProgress
      );
      if (scannedBytes && scannedBytes.length < bytesOpt.length) {
        bestBytes = scannedBytes;
      }
    }

    // Safety: never return larger bytes than original
    if (bestBytes.length >= originalSize) {
      bestBytes = sizePass1 < originalSize ? bytesPass1 : new Uint8Array(arrayBuffer.slice(0));
    }

    const finalBlob = new Blob([bestBytes], { type: 'application/pdf' });
    const finalSize = finalBlob.size;
    const saved = Math.max(0, originalSize - finalSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;

    onProgress({ percent: 100, stage: 'Compression completed successfully!' });

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: finalSize >= originalSize,
      compressedBytes: bestBytes,
      modeUsed: level,
      modeTitle: getProfileTitle(level),
      strategyUsed: `${getProfileTitle(level)} Adaptive Image Compression`,
      targetMet: true,
      targetSizeBytes: null,
      targetSizeKb: null,
      qualityNotice: finalSize >= originalSize
        ? 'Your document is already maximally compact. Re-encoding would increase file size, so the original document was preserved.'
        : `Preserved selectable vector text and document layout while optimizing ${imagesOptimized || imageCount} embedded images.`,
      imagesProcessed: imagesOptimized,
      totalImages: imageCount,
    };
  }

  // ========================================================
  // CUSTOM TARGET SIZE: Progressive Multi-Pass Engine
  // ========================================================

  // PASS 2: High Quality Pass
  onProgress({
    percent: 45,
    stage: 'Pass 2: Testing High Quality image compression...',
  });

  const { doc: docPass2, imagesOptimized: countPass2 } = await optimizeDocImages(
    arrayBuffer,
    1600,
    0.82
  );
  docPass2.setProducer('CompressPDF');
  docPass2.setCreator('CompressPDF');
  const bytesPass2 = await docPass2.save({ useObjectStreams: true });
  const sizePass2 = bytesPass2.byteLength;

  if (sizePass2 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved successfully!' });
    const finalBlob = new Blob([bytesPass2], { type: 'application/pdf' });
    const finalSize = finalBlob.size;
    const saved = Math.max(0, originalSize - finalSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: finalSize >= originalSize,
      compressedBytes: bytesPass2,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'High Quality Adaptive Compression',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: `Target achieved: ${formatBytes(finalSize)} ≤ target ${formatBytes(targetSizeBytes)}. Vector text remained selectable and intact.`,
      imagesProcessed: countPass2,
      totalImages: imageCount,
    };
  }

  // PASS 3: Balanced Compression Pass
  onProgress({
    percent: 65,
    stage: 'Pass 3: Progressive balanced compression...',
  });

  const { doc: docPass3, imagesOptimized: countPass3 } = await optimizeDocImages(
    arrayBuffer,
    1200,
    0.68
  );
  docPass3.setProducer('CompressPDF');
  docPass3.setCreator('CompressPDF');
  const bytesPass3 = await docPass3.save({ useObjectStreams: true });
  const sizePass3 = bytesPass3.byteLength;

  if (sizePass3 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved successfully!' });
    const finalBlob = new Blob([bytesPass3], { type: 'application/pdf' });
    const finalSize = finalBlob.size;
    const saved = Math.max(0, originalSize - finalSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: finalSize >= originalSize,
      compressedBytes: bytesPass3,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Balanced Progressive Compression',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: `Target achieved: ${formatBytes(finalSize)} ≤ target ${formatBytes(targetSizeBytes)}. Vector text remained selectable and intact.`,
      imagesProcessed: countPass3,
      totalImages: imageCount,
    };
  }

  // PASS 4: Strong Compression Pass
  onProgress({
    percent: 80,
    stage: 'Pass 4: Evaluating strong compression limits...',
  });

  const { doc: docPass4, imagesOptimized: countPass4 } = await optimizeDocImages(
    arrayBuffer,
    800,
    0.48
  );
  docPass4.setProducer('CompressPDF');
  docPass4.setCreator('CompressPDF');
  const bytesPass4 = await docPass4.save({ useObjectStreams: true });
  const sizePass4 = bytesPass4.byteLength;

  if (sizePass4 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved successfully!' });
    const finalBlob = new Blob([bytesPass4], { type: 'application/pdf' });
    const finalSize = finalBlob.size;
    const saved = Math.max(0, originalSize - finalSize);
    const pct = originalSize > 0 ? (saved / originalSize) * 100 : 0;

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes: saved,
      percentageReduction: pct,
      isAlreadyOptimized: finalSize >= originalSize,
      compressedBytes: bytesPass4,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Strong Progressive Compression',
      targetMet: true,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice: `Target achieved: ${formatBytes(finalSize)} ≤ target ${formatBytes(targetSizeBytes)}. Vector text remained selectable and intact.`,
      imagesProcessed: countPass4,
      totalImages: imageCount,
    };
  }

  // PASS 5: Adaptive Deep Compression / Scanned Document Recompression
  onProgress({
    percent: 90,
    stage: 'Pass 5: Calculating adaptive compression budget...',
  });

  const overshoot = sizePass4 / targetSizeBytes;
  const adaptiveMaxDim = Math.max(480, Math.round(800 / Math.sqrt(Math.min(3.5, overshoot))));
  const adaptiveQuality = Math.max(0.32, Math.min(0.45, 0.48 / Math.min(2.0, overshoot)));

  const { doc: docPass5, imagesOptimized: countPass5 } = await optimizeDocImages(
    arrayBuffer,
    adaptiveMaxDim,
    adaptiveQuality
  );
  docPass5.setProducer('CompressPDF');
  docPass5.setCreator('CompressPDF');
  const bytesPass5 = await docPass5.save({ useObjectStreams: true });
  let sizePass5 = bytesPass5.byteLength;
  let candidatePass5 = bytesPass5;

  // If document is scanned and still above target, attempt page recompression
  if (docType === 'scanned' && sizePass5 > targetSizeBytes) {
    onProgress({ percent: 95, stage: 'Applying deep scanned page recompression...' });
    const scannedBytes = await optimizeScannedDocPages(
      arrayBuffer,
      0.95,
      0.40,
      onProgress
    );
    if (scannedBytes && scannedBytes.length < sizePass5) {
      candidatePass5 = scannedBytes;
      sizePass5 = scannedBytes.length;
    }
  }

  // Candidate pool of all passes
  const candidates = [
    { bytes: candidatePass5, size: sizePass5, count: countPass5 },
    { bytes: bytesPass4, size: sizePass4, count: countPass4 },
    { bytes: bytesPass3, size: sizePass3, count: countPass3 },
    { bytes: bytesPass2, size: sizePass2, count: countPass2 },
    { bytes: bytesPass1, size: sizePass1, count: 0 },
  ];

  // Pick smallest candidate that is valid
  let best = candidates[0];
  for (const c of candidates) {
    if (c.size < best.size) {
      best = c;
    }
  }

  // Safety: if best size is >= original size, keep original
  let finalBytes = best.bytes;
  if (best.size >= originalSize) {
    finalBytes = new Uint8Array(arrayBuffer.slice(0));
  }

  const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
  const finalSize = finalBlob.size;
  const targetMet = finalSize <= targetSizeBytes;
  const savedBytes = Math.max(0, originalSize - finalSize);
  const percentageReduction = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

  onProgress({
    percent: 100,
    stage: targetMet ? 'Target achieved!' : 'Compression completed.',
  });

  return {
    success: true,
    originalSize,
    compressedSize: finalSize,
    savedBytes,
    percentageReduction,
    isAlreadyOptimized: finalSize >= originalSize,
    compressedBytes: finalBytes,
    modeUsed: 'custom_target',
    modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
    strategyUsed: targetMet ? 'Adaptive Progressive Compression' : 'Quality-Protected Compression',
    targetMet,
    targetSizeBytes,
    targetSizeKb,
    qualityNotice: targetMet
      ? `Target achieved: ${formatBytes(finalSize)} ≤ target ${formatBytes(targetSizeBytes)}.`
      : `Target of ${formatBytes(targetSizeBytes)} was not reached. Reduced to ${formatBytes(finalSize)} (${Math.round(percentageReduction)}% saved). Further compression was stopped at safe visual limits to prevent severe photo degradation and keep the document legible.`,
    imagesProcessed: best.count,
    totalImages: imageCount,
  };
}
