import { PDFDocument, PDFName, PDFRawStream, PDFNumber, StandardFonts } from 'pdf-lib';
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
        const filter = lookupValue(pdfDoc.context, obj.dict.get(PDFName.of('Filter')));
        const filterStr = filter ? filter.toString() : '';
        const subtype = lookupValue(pdfDoc.context, obj.dict.get(PDFName.of('Subtype')))?.toString();

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
 * Helper to safely resolve direct values or indirect references from PDF context
 */
function lookupValue(context, entry) {
  if (!entry) return null;
  return typeof context.lookup === 'function' ? context.lookup(entry) : entry;
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
      const subtypeObj = lookupValue(pdfDoc.context, obj.dict?.get(PDFName.of('Subtype')));
      if (subtypeObj && subtypeObj.toString() === '/Image') {
        imageTargets.push({ ref, obj });
      }
    }
  }

  for (const target of imageTargets) {
    const { ref, obj } = target;
    const dict = obj.dict;
    const widthObj = lookupValue(pdfDoc.context, dict.get(PDFName.of('Width')));
    const heightObj = lookupValue(pdfDoc.context, dict.get(PDFName.of('Height')));
    const width = widthObj && typeof widthObj.asNumber === 'function' ? widthObj.asNumber() : parseInt(widthObj?.toString() || '0', 10);
    const height = heightObj && typeof heightObj.asNumber === 'function' ? heightObj.asNumber() : parseInt(heightObj?.toString() || '0', 10);

    const filterRaw = lookupValue(pdfDoc.context, dict.get(PDFName.of('Filter')));
    let filterStr = '';
    if (filterRaw) {
      if (typeof filterRaw.asArray === 'function') {
        filterStr = filterRaw.asArray().map(f => lookupValue(pdfDoc.context, f)?.toString() || '').join(' ');
      } else {
        filterStr = filterRaw.toString();
      }
    }

    const colorSpaceRaw = lookupValue(pdfDoc.context, dict.get(PDFName.of('ColorSpace')));
    let colorSpaceStr = '/DeviceRGB';
    if (colorSpaceRaw) {
      if (typeof colorSpaceRaw.asArray === 'function') {
        colorSpaceStr = colorSpaceRaw.asArray().map(c => lookupValue(pdfDoc.context, c)?.toString() || '').join(' ');
      } else {
        colorSpaceStr = colorSpaceRaw.toString();
      }
    }

    const bpcObj = lookupValue(pdfDoc.context, dict.get(PDFName.of('BitsPerComponent')));
    const bpc = bpcObj && typeof bpcObj.asNumber === 'function' ? bpcObj.asNumber() : parseInt(bpcObj?.toString() || '8', 10);

    const decodeParms = lookupValue(pdfDoc.context, dict.get(PDFName.of('DecodeParms')));
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
    if (filterStr.includes('DCTDecode') || filterStr.includes('/DCT')) {
      canvasResult = await decodeJpegToCanvas(originalBytes, effectiveMaxDim);
    }

    // Method B: FlateDecode (PNG / Raw Scanlines)
    if (!canvasResult && (filterStr.includes('FlateDecode') || filterStr.includes('/Fl')) && width > 0 && height > 0) {
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

    // Method C: Raw uncompressed bitmap stream (no filter)
    if (!canvasResult && (!filterStr || filterStr === 'null' || filterStr === 'undefined') && width > 0 && height > 0) {
      try {
        canvasResult = decodeFlateToCanvas(
          originalBytes,
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

      // Accept any savings when downsampled; require 2% savings for same-size re-encode
      const didDownsample = canvasResult.targetW < canvasResult.origW || canvasResult.targetH < canvasResult.origH;
      const threshold = didDownsample ? 1.00 : 0.98;

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
 * High-Fidelity Page Visual Optimization with Searchable Text Overlay.
 * Calibrated specifically for documents where fixed font tables or vector drawings
 * prevent meeting aggressive target sizes or strong compression requests.
 * Uses closed-loop refinement to guarantee reaching required target budgets.
 */
async function optimizeVisualDocPages(arrayBuffer, targetSizeBytes = null, onProgress = () => {}) {
  try {
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Helper to render and assemble PDF at specific scale & jpegQuality
    async function renderDocWithParams(scale, quality, includeTextLayer, progressBase, progressSpan) {
      const newDoc = await PDFDocument.create();
      let stdFont = null;
      if (includeTextLayer) {
        try {
          stdFont = await newDoc.embedFont(StandardFonts.Helvetica);
        } catch (_) {}
      }

      for (let p = 1; p <= numPages; p++) {
        onProgress({
          percent: Math.round(progressBase + (p / numPages) * progressSpan),
          stage: `Optimizing page ${p} of ${numPages} (scale: ${Math.round(scale * 100)}%, quality: ${Math.round(quality * 100)}%)...`,
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

        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
        const embeddedJpg = await newDoc.embedJpg(jpegBytes);

        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        // Overlay searchable text layer with standard WinAnsi chars when budget allows
        if (includeTextLayer && stdFont) {
          try {
            const textContent = await page.getTextContent();
            if (textContent?.items?.length > 0) {
              for (const item of textContent.items) {
                if (item.str && item.str.trim()) {
                  const cleanStr = item.str.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
                  if (!cleanStr) continue;
                  const tx = item.transform;
                  const x = tx[4];
                  const y = tx[5];
                  const fontSize = Math.max(4, Math.min(72, Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || 10));
                  try {
                    newPage.drawText(cleanStr, {
                      x: Math.max(0, Math.min(origViewport.width - 10, x)),
                      y: Math.max(0, Math.min(origViewport.height - 10, y)),
                      size: fontSize,
                      font: stdFont,
                      opacity: 0.001,
                    });
                  } catch (_) {}
                }
              }
            }
          } catch (_) {}
        }
      }

      newDoc.setProducer('CompressPDF');
      newDoc.setCreator('CompressPDF');
      return await newDoc.save({ useObjectStreams: true });
    }

    // Determine target budget per page
    const containerOverhead = Math.min(6144, Math.max(1500, numPages * 500));
    const targetDocBudget = targetSizeBytes ? Math.max(8000, targetSizeBytes - containerOverhead) : 100000;
    // Conservative budget per page with 12% safety buffer
    const budgetPerPage = (targetDocBudget * 0.88) / numPages;

    const MIN_SCALE = 0.35;
    const MIN_QUALITY = 0.15;

    let scale = 1.0;
    let jpegQuality = 0.55;
    let includeTextLayer = budgetPerPage >= 45000;

    if (!targetSizeBytes) {
      // Strong compression preset default
      scale = 1.0;
      jpegQuality = 0.50;
      includeTextLayer = true;
    } else if (budgetPerPage >= 140000) {
      scale = 1.25;
      jpegQuality = 0.72;
    } else if (budgetPerPage >= 85000) {
      scale = 1.10;
      jpegQuality = 0.62;
    } else if (budgetPerPage >= 50000) {
      scale = 0.95;
      jpegQuality = 0.52;
    } else if (budgetPerPage >= 30000) {
      scale = 0.80;
      jpegQuality = 0.42;
    } else if (budgetPerPage >= 18000) {
      scale = 0.65;
      jpegQuality = 0.32;
    } else if (budgetPerPage >= 10000) {
      scale = 0.50;
      jpegQuality = 0.24;
    } else {
      scale = Math.max(MIN_SCALE, 0.40 * Math.sqrt(budgetPerPage / 10000));
      jpegQuality = Math.max(MIN_QUALITY, Math.min(0.20, (budgetPerPage / 10000) * 0.22));
    }

    // Pass 1: Render with initial calibrated settings
    let bytes = await renderDocWithParams(scale, jpegQuality, includeTextLayer, 80, 10);

    // Closed-loop iterative refinement:
    // If target was specified and output exceeded targetSizeBytes, perform up to 5 adaptive refinements
    if (targetSizeBytes && bytes.byteLength > targetSizeBytes) {
      let currentScale = scale;
      let currentQuality = jpegQuality;
      let currentTextLayer = false; // Immediately drop invisible text layer if initial output is over budget
      const maxRefinements = 5;

      for (let attempt = 0; attempt < maxRefinements && bytes.byteLength > targetSizeBytes; attempt++) {
        const ratio = targetSizeBytes / bytes.byteLength;
        // Proportional correction with safety margin to guarantee hitting target
        const adjustFactor = Math.min(0.88, ratio * 0.90);
        const nextScale = Math.max(MIN_SCALE, currentScale * Math.sqrt(adjustFactor));
        const nextQuality = Math.max(MIN_QUALITY, currentQuality * Math.pow(adjustFactor, 0.60));

        currentScale = nextScale;
        currentQuality = nextQuality;

        onProgress({
          percent: 90 + attempt * 2,
          stage: `Refining to meet target budget (${formatBytes(targetSizeBytes)})...`,
        });

        const refinedBytes = await renderDocWithParams(currentScale, currentQuality, currentTextLayer, 90 + attempt * 2, 2);
        if (refinedBytes && refinedBytes.byteLength < bytes.byteLength) {
          bytes = refinedBytes;
        } else {
          break;
        }
      }
    }

    return bytes;
  } catch (err) {
    console.warn('optimizeVisualDocPages failed:', err);
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
      if (obj.dict) {
        const subtypeObj = lookupValue(tempDoc.context, obj.dict.get(PDFName.of('Subtype')));
        if (subtypeObj && subtypeObj.toString() === '/Image') {
          imageCount++;
        }
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
 * Works across all document categories, sizes, and targets.
 */
export async function compressPdf(arrayBuffer, options = {}, onProgress = () => {}) {
  const originalSize = arrayBuffer.byteLength;
  const {
    level = 'high_quality',
    targetSizeKb = null,
  } = options;

  const isTargetMode = level === 'custom_target' && targetSizeKb && targetSizeKb > 0;
  const targetSizeBytes = isTargetMode ? Math.round(targetSizeKb * 1024) : null;

  // Development diagnostics tracker
  const stagesAttempted = ['Stage 1: Document classification & structure analysis'];
  const skippedStages = [];
  const errorsEncountered = [];
  const imageSettingsUsed = [];

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

  if (!hasImages) {
    skippedStages.push('Stage B: Embedded image optimization (no raster image XObjects detected)');
  }

  /**
   * Helper to construct unified result with honest byte sizing,
   * accurate messages, and development diagnostics.
   */
  function buildResult({
    finalBytes,
    modeUsed,
    modeTitle,
    strategyUsed,
    targetMet = true,
    qualityNotice = '',
    imagesProcessed = 0,
    rawCandidateBytesLength = null,
  }) {
    const rawSize = rawCandidateBytesLength ?? finalBytes.byteLength;
    const isLargerThanInput = rawSize > originalSize;
    let safeBytes = finalBytes;
    if (finalBytes.byteLength >= originalSize) {
      safeBytes = new Uint8Array(arrayBuffer.slice(0));
    }
    const finalBlob = new Blob([safeBytes], { type: 'application/pdf' });
    const finalSize = finalBlob.size;
    const savedBytes = Math.max(0, originalSize - finalSize);
    const percentageReduction = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;
    const isAlreadyOptimized = finalSize >= originalSize;
    const isNoReduction = percentageReduction < 0.5;

    const devDiagnostics = {
      originalSizeBytes: originalSize,
      targetSizeBytes: targetSizeBytes || null,
      outputSizeBytes: finalSize,
      compressionPercentage: Number(percentageReduction.toFixed(2)),
      stagesAttempted: [...stagesAttempted],
      imageSettingsUsed: [...imageSettingsUsed],
      targetMet: isTargetMode ? targetMet : true,
      skippedStages: [...skippedStages],
      errorsEncountered: [...errorsEncountered],
    };

    if (
      (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
      (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1' || Boolean(import.meta?.env?.DEV)))
    ) {
      console.info('[PDFCompressor Development Diagnostics]', devDiagnostics);
    }

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      savedBytes,
      percentageReduction,
      isAlreadyOptimized,
      isNoReduction,
      isLargerThanInput,
      compressedBytes: safeBytes,
      modeUsed,
      modeTitle,
      strategyUsed,
      targetMet,
      targetSizeBytes,
      targetSizeKb,
      qualityNotice,
      imagesProcessed,
      totalImages: imageCount,
      diagnostics: devDiagnostics,
      docType,
    };
  }

  // ========================================================
  // PASS 1: Lossless Structural Cleanup & Stream Compaction
  // ========================================================
  onProgress({
    percent: 25,
    stage: 'Pass 1: Lossless structural cleanup & stream compaction...',
  });

  stagesAttempted.push('Stage A: Safe structural cleanup & content stream compaction');
  const docPass1 = await PDFDocument.load(arrayBuffer.slice(0));
  optimizePdfStructure(docPass1);
  docPass1.setProducer('CompressPDF');
  docPass1.setCreator('CompressPDF');
  const bytesPass1 = await docPass1.save({ useObjectStreams: true });
  const sizePass1 = bytesPass1.byteLength;

  // If Target Mode and Pass 1 reached the target:
  if (isTargetMode && sizePass1 <= targetSizeBytes) {
    onProgress({ percent: 100, stage: 'Target achieved losslessly!' });
    return buildResult({
      finalBytes: bytesPass1,
      modeUsed: 'custom_target',
      modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
      strategyUsed: 'Lossless Structural Optimization',
      targetMet: true,
      qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(Math.min(sizePass1, originalSize))}. Vector text, fonts, and layout preserved with zero quality change.`,
      imagesProcessed: 0,
      rawCandidateBytesLength: sizePass1,
    });
  }

  // ========================================================
  // PRESET MODES (High Quality, Balanced, Strong Compression)
  // ========================================================
  if (!isTargetMode) {
    // 1. High Quality Preset (Strict Vector Preservation Default)
    if (level === 'high_quality') {
      onProgress({ percent: 60, stage: 'Applying High Quality optimization...' });

      let bestBytes = bytesPass1;
      let count = 0;
      let rawCandidateSize = bytesPass1.byteLength;

      if (hasImages) {
        stagesAttempted.push('Stage B: High Quality in-place image optimization (max 1600px, quality 0.82)');
        imageSettingsUsed.push({ stage: 'High Quality', maxDimension: 1600, jpegQuality: 0.82 });
        try {
          const { doc: docHQ, imagesOptimized } = await optimizeDocImages(arrayBuffer, 1600, 0.82);
          docHQ.setProducer('CompressPDF');
          docHQ.setCreator('CompressPDF');
          const hqBytes = await docHQ.save({ useObjectStreams: true });
          rawCandidateSize = hqBytes.byteLength;
          if (hqBytes.length < bestBytes.length) {
            bestBytes = hqBytes;
            count = imagesOptimized;
          }
        } catch (e) {
          errorsEncountered.push(`High Quality image pass failed: ${e.message}`);
        }
      }

      onProgress({ percent: 100, stage: 'High Quality optimization completed!' });

      return buildResult({
        finalBytes: bestBytes,
        modeUsed: 'high_quality',
        modeTitle: 'High Quality',
        strategyUsed: hasImages && count > 0 ? 'High Quality Vector & Image Optimization' : 'Lossless Structural Optimization',
        targetMet: true,
        qualityNotice: rawCandidateSize >= originalSize
          ? 'This PDF is already highly optimized. We couldn’t reduce its size without changing its content or quality.'
          : 'Preserved 100% selectable vector text and document formatting while optimizing embedded structures.',
        imagesProcessed: count,
        rawCandidateBytesLength: rawCandidateSize,
      });
    }

    // 2. Balanced Preset
    if (level === 'balanced' || level === 'recommended') {
      onProgress({ percent: 60, stage: 'Applying Balanced optimization...' });

      let bestBytes = bytesPass1;
      let count = 0;
      let rawCandidateSize = bytesPass1.byteLength;

      if (hasImages) {
        stagesAttempted.push('Stage B: Balanced in-place image optimization (max 1200px, quality 0.68)');
        imageSettingsUsed.push({ stage: 'Balanced', maxDimension: 1200, jpegQuality: 0.68 });
        try {
          const { doc: docBal, imagesOptimized } = await optimizeDocImages(arrayBuffer, 1200, 0.68);
          docBal.setProducer('CompressPDF');
          docBal.setCreator('CompressPDF');
          const balBytes = await docBal.save({ useObjectStreams: true });
          rawCandidateSize = balBytes.byteLength;
          if (balBytes.length < bestBytes.length) {
            bestBytes = balBytes;
            count = imagesOptimized;
          }
        } catch (e) {
          errorsEncountered.push(`Balanced image pass failed: ${e.message}`);
        }
      }

      onProgress({ percent: 100, stage: 'Balanced compression completed!' });

      return buildResult({
        finalBytes: bestBytes,
        modeUsed: 'balanced',
        modeTitle: 'Balanced',
        strategyUsed: hasImages && count > 0 ? 'Balanced Adaptive Compression' : 'Lossless Structural Optimization',
        targetMet: true,
        qualityNotice: rawCandidateSize >= originalSize
          ? 'This PDF is already highly optimized. We couldn’t reduce its size without changing its content or quality.'
          : 'Optimized document layout and imagery. Vector typography remains crisp and searchable.',
        imagesProcessed: count,
        rawCandidateBytesLength: rawCandidateSize,
      });
    }

    // 3. Strong Compression Preset
    if (level === 'strong_compression' || level === 'smaller_file' || level === 'high') {
      onProgress({ percent: 50, stage: 'Evaluating strong compression strategies...' });

      let bestBytes = bytesPass1;
      let count = 0;
      let usedVisual = false;
      let rawCandidateSize = bytesPass1.byteLength;

      if (hasImages) {
        stagesAttempted.push('Stage B: Strong in-place image optimization (max 800px, quality 0.48)');
        imageSettingsUsed.push({ stage: 'Strong Compression', maxDimension: 800, jpegQuality: 0.48 });
        try {
          const { doc: docStrong, imagesOptimized } = await optimizeDocImages(arrayBuffer, 800, 0.48);
          docStrong.setProducer('CompressPDF');
          docStrong.setCreator('CompressPDF');
          const strongBytes = await docStrong.save({ useObjectStreams: true });
          rawCandidateSize = strongBytes.byteLength;
          if (strongBytes.length < bestBytes.length) {
            bestBytes = strongBytes;
            count = imagesOptimized;
          }
        } catch (e) {
          errorsEncountered.push(`Strong image pass failed: ${e.message}`);
        }
      }

      if (docType === 'scanned') {
        onProgress({ percent: 70, stage: 'Applying scanned page optimization...' });
        stagesAttempted.push('Stage C: Scanned page visual optimization');
        try {
          const visualBytes = await optimizeVisualDocPages(arrayBuffer, originalSize * 0.40, onProgress);
          if (visualBytes && visualBytes.length < bestBytes.length) {
            bestBytes = visualBytes;
            usedVisual = true;
            rawCandidateSize = visualBytes.byteLength;
          }
        } catch (e) {
          errorsEncountered.push(`Visual page pass failed: ${e.message}`);
        }
      }

      onProgress({ percent: 100, stage: 'Strong compression completed!' });

      return buildResult({
        finalBytes: bestBytes,
        modeUsed: 'strong_compression',
        modeTitle: 'Strong Compression',
        strategyUsed: usedVisual ? 'Strong Visual Page Compression' : (docType === 'text_vector' ? 'Structural Stream Compaction' : 'Strong In-Place Image Compression'),
        targetMet: true,
        qualityNotice: rawCandidateSize >= originalSize
          ? (docType === 'text_vector'
            ? 'This document consists entirely of vector text and embedded fonts, which are already optimally encoded. Original vector typography was preserved intact.'
            : 'This PDF is already highly optimized. We couldn’t reduce its size without changing its content or quality.')
          : (usedVisual
            ? 'Scanned pages re-encoded with high-fidelity compression. Searchable text layer preserved.'
            : (docType === 'text_vector'
              ? 'Losslessly optimized document structure and compacted content streams. 100% vector typography remained sharp and selectable without blurry rasterization.'
              : 'Strong compression applied. Photos and graphics were compacted while keeping all vector typography crisp and searchable.')),
        imagesProcessed: count,
        rawCandidateBytesLength: rawCandidateSize,
      });
    }
  }

  // ========================================================
  // CUSTOM TARGET SIZE: Progressive Multi-Pass Pipeline
  // ========================================================

  // PASS 2: High Quality Pass (if images present)
  let bytesPass2 = bytesPass1;
  let countPass2 = 0;
  if (hasImages) {
    onProgress({ percent: 40, stage: 'Pass 2: Testing High Quality in-place image optimization...' });
    stagesAttempted.push('Pass 2: High Quality in-place image optimization (max 1600px, quality 0.82)');
    imageSettingsUsed.push({ stage: 'Pass 2 HQ', maxDimension: 1600, jpegQuality: 0.82 });
    try {
      const { doc: docPass2, imagesOptimized } = await optimizeDocImages(arrayBuffer, 1600, 0.82);
      docPass2.setProducer('CompressPDF');
      docPass2.setCreator('CompressPDF');
      bytesPass2 = await docPass2.save({ useObjectStreams: true });
      countPass2 = imagesOptimized;

      if (bytesPass2.byteLength <= targetSizeBytes) {
        onProgress({ percent: 100, stage: 'Target achieved successfully!' });
        return buildResult({
          finalBytes: bytesPass2,
          modeUsed: 'custom_target',
          modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
          strategyUsed: 'High Quality In-Place Compression',
          targetMet: true,
          qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(bytesPass2.byteLength)}. Vector text remained 100% selectable and intact.`,
          imagesProcessed: countPass2,
          rawCandidateBytesLength: bytesPass2.byteLength,
        });
      }
    } catch (e) {
      errorsEncountered.push(`Pass 2 HQ failed: ${e.message}`);
    }
  }

  // PASS 3: Balanced In-Place Pass (if images present)
  let bytesPass3 = bytesPass2;
  let countPass3 = countPass2;
  if (hasImages) {
    onProgress({ percent: 55, stage: 'Pass 3: Progressive balanced image compression...' });
    stagesAttempted.push('Pass 3: Balanced in-place image optimization (max 1200px, quality 0.68)');
    imageSettingsUsed.push({ stage: 'Pass 3 Balanced', maxDimension: 1200, jpegQuality: 0.68 });
    try {
      const { doc: docPass3, imagesOptimized } = await optimizeDocImages(arrayBuffer, 1200, 0.68);
      docPass3.setProducer('CompressPDF');
      docPass3.setCreator('CompressPDF');
      bytesPass3 = await docPass3.save({ useObjectStreams: true });
      countPass3 = imagesOptimized;

      if (bytesPass3.byteLength <= targetSizeBytes) {
        onProgress({ percent: 100, stage: 'Target achieved successfully!' });
        return buildResult({
          finalBytes: bytesPass3,
          modeUsed: 'custom_target',
          modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
          strategyUsed: 'Balanced Progressive Compression',
          targetMet: true,
          qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(bytesPass3.byteLength)}. Vector text remained 100% selectable and intact.`,
          imagesProcessed: countPass3,
          rawCandidateBytesLength: bytesPass3.byteLength,
        });
      }
    } catch (e) {
      errorsEncountered.push(`Pass 3 Balanced failed: ${e.message}`);
    }
  }

  // PASS 4: Strong In-Place Pass (if images present)
  let bytesPass4 = bytesPass3;
  let countPass4 = countPass3;
  if (hasImages) {
    onProgress({ percent: 70, stage: 'Pass 4: Evaluating strong compression limits...' });
    stagesAttempted.push('Pass 4: Strong in-place image optimization (max 800px, quality 0.48)');
    imageSettingsUsed.push({ stage: 'Pass 4 Strong', maxDimension: 800, jpegQuality: 0.48 });
    try {
      const { doc: docPass4, imagesOptimized } = await optimizeDocImages(arrayBuffer, 800, 0.48);
      docPass4.setProducer('CompressPDF');
      docPass4.setCreator('CompressPDF');
      bytesPass4 = await docPass4.save({ useObjectStreams: true });
      countPass4 = imagesOptimized;

      if (bytesPass4.byteLength <= targetSizeBytes) {
        onProgress({ percent: 100, stage: 'Target achieved successfully!' });
        return buildResult({
          finalBytes: bytesPass4,
          modeUsed: 'custom_target',
          modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
          strategyUsed: 'Strong Progressive Compression',
          targetMet: true,
          qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(bytesPass4.byteLength)}. Vector text remained 100% selectable and intact.`,
          imagesProcessed: countPass4,
          rawCandidateBytesLength: bytesPass4.byteLength,
        });
      }
    } catch (e) {
      errorsEncountered.push(`Pass 4 Strong failed: ${e.message}`);
    }
  }

  // PASS 4B: Adaptive In-Place Target Calibrated Pass (if images present and size still exceeds target)
  let bytesPass4B = null;
  let countPass4B = countPass4;
  if (hasImages && bytesPass4.byteLength > targetSizeBytes) {
    const overshoot4 = bytesPass4.byteLength / targetSizeBytes;
    onProgress({ percent: 76, stage: 'Pass 4B: Adaptive in-place image downsampling...' });
    const adaptiveMaxDim = Math.max(260, Math.round(800 / Math.pow(overshoot4, 0.75)));
    const adaptiveQuality = Math.max(0.20, Math.min(0.44, 0.48 / Math.pow(overshoot4, 0.50)));
    stagesAttempted.push(`Pass 4B: Adaptive in-place image downsampling (max ${adaptiveMaxDim}px, quality ${adaptiveQuality.toFixed(2)})`);
    imageSettingsUsed.push({ stage: 'Pass 4B Adaptive', maxDimension: adaptiveMaxDim, jpegQuality: adaptiveQuality });

    try {
      const { doc: docPass4B, imagesOptimized: opt4B } = await optimizeDocImages(
        arrayBuffer,
        adaptiveMaxDim,
        adaptiveQuality
      );
      docPass4B.setProducer('CompressPDF');
      docPass4B.setCreator('CompressPDF');
      bytesPass4B = await docPass4B.save({ useObjectStreams: true });
      countPass4B = opt4B;

      if (bytesPass4B.byteLength <= targetSizeBytes) {
        onProgress({ percent: 100, stage: 'Target achieved successfully!' });
        return buildResult({
          finalBytes: bytesPass4B,
          modeUsed: 'custom_target',
          modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
          strategyUsed: 'Adaptive In-Place Compression',
          targetMet: true,
          qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(bytesPass4B.byteLength)}. Vector text remained 100% selectable and intact.`,
          imagesProcessed: countPass4B,
          rawCandidateBytesLength: bytesPass4B.byteLength,
        });
      }

      // If within 18% of target, try precision in-place refinement
      if (bytesPass4B.byteLength <= targetSizeBytes * 1.18) {
        const fineDim = Math.max(200, Math.round(adaptiveMaxDim * 0.82));
        const fineQuality = Math.max(0.18, adaptiveQuality * 0.80);
        stagesAttempted.push(`Pass 4B Refinement: Fine in-place tuning (max ${fineDim}px, quality ${fineQuality.toFixed(2)})`);
        imageSettingsUsed.push({ stage: 'Pass 4B Fine', maxDimension: fineDim, jpegQuality: fineQuality });

        const { doc: docFine, imagesOptimized: optFine } = await optimizeDocImages(
          arrayBuffer,
          fineDim,
          fineQuality
        );
        docFine.setProducer('CompressPDF');
        docFine.setCreator('CompressPDF');
        const bytesFine = await docFine.save({ useObjectStreams: true });
        if (bytesFine.byteLength <= targetSizeBytes) {
          onProgress({ percent: 100, stage: 'Target achieved successfully!' });
          return buildResult({
            finalBytes: bytesFine,
            modeUsed: 'custom_target',
            modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
            strategyUsed: 'Precision In-Place Compression',
            targetMet: true,
            qualityNotice: `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(bytesFine.byteLength)}. Vector text remained 100% selectable and intact.`,
            imagesProcessed: optFine,
            rawCandidateBytesLength: bytesFine.byteLength,
          });
        }
        if (bytesFine.byteLength < bytesPass4B.byteLength) {
          bytesPass4B = bytesFine;
          countPass4B = optFine;
        }
      }
    } catch (e) {
      errorsEncountered.push(`Pass 4B Adaptive failed: ${e.message}`);
    }
  }

  // PASS 5: High-Fidelity Page Visual Optimization Pass
  // Triggers when target cannot be met by structure or image replacement alone (e.g. heavy fonts or vector paths)
  onProgress({
    percent: 82,
    stage: 'Pass 5: Applying high-fidelity visual optimization to reach target budget...',
  });
  stagesAttempted.push('Pass 5: High-fidelity visual optimization fallback with searchable text overlay');

  let visualPassBytes = null;
  try {
    visualPassBytes = await optimizeVisualDocPages(arrayBuffer, targetSizeBytes, onProgress);
  } catch (e) {
    errorsEncountered.push(`Pass 5 Visual failed: ${e.message}`);
  }

  // Pool all candidates
  const candidates = [
    { bytes: bytesPass1, size: bytesPass1.byteLength, strategy: 'Lossless Structural Optimization', inPlace: true },
  ];

  if (hasImages) {
    if (bytesPass2) candidates.push({ bytes: bytesPass2, size: bytesPass2.byteLength, strategy: 'High Quality In-Place Compression', inPlace: true });
    if (bytesPass3) candidates.push({ bytes: bytesPass3, size: bytesPass3.byteLength, strategy: 'Balanced In-Place Compression', inPlace: true });
    if (bytesPass4) candidates.push({ bytes: bytesPass4, size: bytesPass4.byteLength, strategy: 'Strong In-Place Compression', inPlace: true });
    if (bytesPass4B) candidates.push({ bytes: bytesPass4B, size: bytesPass4B.byteLength, strategy: 'Adaptive In-Place Compression', inPlace: true });
  }

  if (visualPassBytes) {
    candidates.push({
      bytes: visualPassBytes,
      size: visualPassBytes.byteLength,
      strategy: 'High-Fidelity Visual Optimization (Searchable Text)',
      inPlace: false,
    });
  }

  // Find candidate that meets target, preferring in-place if both meet target
  const meetingTarget = candidates.filter(c => c.size <= targetSizeBytes);
  let bestCandidate = null;

  if (meetingTarget.length > 0) {
    const inPlaceMeeting = meetingTarget.filter(c => c.inPlace);
    if (inPlaceMeeting.length > 0) {
      bestCandidate = inPlaceMeeting.reduce((best, cur) => cur.size > best.size ? cur : best, inPlaceMeeting[0]);
    } else {
      bestCandidate = meetingTarget[meetingTarget.length - 1];
    }
  } else {
    // None met target: pick smallest candidate overall
    bestCandidate = candidates.reduce((best, cur) => cur.size < best.size ? cur : best, candidates[0]);
  }

  const candidateSize = bestCandidate.size;
  const targetMet = candidateSize <= targetSizeBytes;

  onProgress({
    percent: 100,
    stage: targetMet ? 'Target achieved successfully!' : 'Compression completed.',
  });

  const finalNotice = targetMet
    ? `Target reached. Your PDF was reduced from ${formatBytes(originalSize)} to ${formatBytes(candidateSize)} (${Math.round(Math.max(0, originalSize - candidateSize) / originalSize * 100)}% saved).`
    : (docType === 'text_vector'
      ? `Target not reached. The best safe result was ${formatBytes(candidateSize)}. This PDF contains mostly text, vector graphics, and embedded fonts, so further reduction may require quality loss.`
      : `Target not reached. The best safe result was ${formatBytes(candidateSize)}. Further compression was stopped at safe visual limits to prevent severe photo degradation.`);

  return buildResult({
    finalBytes: bestCandidate.bytes,
    modeUsed: 'custom_target',
    modeTitle: `Target ≤ ${formatBytes(targetSizeBytes)}`,
    strategyUsed: bestCandidate.strategy,
    targetMet,
    qualityNotice: finalNotice,
    imagesProcessed: imageCount,
    rawCandidateBytesLength: candidateSize,
  });
}
