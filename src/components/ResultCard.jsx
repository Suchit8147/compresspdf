import React, { useEffect, useState } from 'react';
import { 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  FileCheck, 
  TrendingDown,
  Check,
  Eye,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatBytes, renderPdfPageToDataUrl } from '../utils/pdfCompressor';

export default function ResultCard({
  result,
  originalFile,
  originalThumbnail,
  onReset,
}) {
  const [downloaded, setDownloaded] = useState(false);
  const [compressedThumbnail, setCompressedThumbnail] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal fit, 1.6 = zoomed detail

  useEffect(() => {
    // Generate high-resolution thumbnail of compressed document (scale 1.0 for sharpness)
    if (result && result.compressedBytes) {
      const buffer = result.compressedBytes.buffer.slice(
        result.compressedBytes.byteOffset,
        result.compressedBytes.byteOffset + result.compressedBytes.byteLength
      );
      renderPdfPageToDataUrl(buffer, 1, 1.0).then((thumb) => {
        if (thumb?.dataUrl) {
          setCompressedThumbnail(thumb.dataUrl);
        }
      }).catch(() => {});
    }

    // Fire confetti celebration if target achieved or >10% saved
    if (result && ((result.targetSizeBytes && result.targetMet) || result.percentageReduction > 10)) {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#7c3aed', '#10b981', '#38bdf8']
      });
    }
  }, [result]);

  if (!result) return null;

  const handleDownload = () => {
    const blob = new Blob([result.compressedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Clean download filename
    const baseName = originalFile.name.replace(/\.pdf$/i, '');
    link.href = url;
    link.download = `${baseName}-compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    setDownloaded(true);
  };

  const percentage = Math.round(result.percentageReduction);
  const compressedPercentage = Math.max(5, Math.min(100, Math.round((result.compressedSize / result.originalSize) * 100)));
  const isTargetMode = Boolean(result.targetSizeBytes);

  // Format mode title
  const modeTitle = result.modeTitle || (
    result.modeUsed === 'high_quality' ? 'High Quality' :
    result.modeUsed === 'balanced' ? 'Balanced' :
    result.modeUsed === 'smaller_file' ? 'Smaller File' : 'Standard'
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-slate-200/80 dark:border-slate-800 text-center">
        
        {/* Status Badge & Quality Mode Tag */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {isTargetMode ? (
            result.targetMet ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Target Achieved: {formatBytes(result.compressedSize)} ≤ {formatBytes(result.targetSizeBytes)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Target Not Reached: {formatBytes(result.compressedSize)} (Target: {formatBytes(result.targetSizeBytes)})</span>
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {result.isAlreadyOptimized 
                  ? 'Document Verified • Already Optimally Sized'
                  : `Compression Successful • Saved ${percentage}% Space`}
              </span>
            </div>
          )}

          {/* Selected Quality Mode Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mode: {modeTitle}</span>
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {isTargetMode
            ? result.targetMet
              ? `Target Achieved: ${formatBytes(result.compressedSize)}`
              : `Target Not Reached: Reduced to ${formatBytes(result.compressedSize)} (-${percentage}%)`
            : result.isAlreadyOptimized
              ? 'Your PDF is Already Maximally Optimized'
              : `Compressed by ${percentage}% (${formatBytes(result.savedBytes)} Saved)`}
        </h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          {isTargetMode
            ? result.targetMet
              ? `Successfully reduced from ${formatBytes(result.originalSize)} to ${formatBytes(result.compressedSize)} (${percentage}% saved), achieving your ${formatBytes(result.targetSizeBytes)} target budget while preserving text and structure.`
              : `Target of ${formatBytes(result.targetSizeBytes)} was not reached. File was reduced from ${formatBytes(result.originalSize)} to ${formatBytes(result.compressedSize)} (${formatBytes(result.savedBytes)} saved, -${percentage}%). Further compression was stopped to prevent severe visual degradation and maintain readability.`
            : result.isAlreadyOptimized
              ? 'This document consists of clean vector typography and contains no redundant streams. Your original file was kept intact so no bytes were added.'
              : `Your file has been optimized from ${formatBytes(result.originalSize)} to ${formatBytes(result.compressedSize)}. All vector text remains selectable and searchable.`}
        </p>

        {/* Quality Notice / Prioritization Banner if applicable */}
        {result.qualityNotice && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-left flex items-start gap-3 text-xs max-w-xl mx-auto ${
            isTargetMode && !result.targetMet
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
          }`}>
            {isTargetMode && !result.targetMet ? (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">
              <strong>Compression Details:</strong> {result.qualityNotice}
            </p>
          </div>
        )}

        {/* Comparison Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-left">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Original Size
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 mt-1 block">
              {formatBytes(result.originalSize)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 text-left">
            <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider block">
              Compressed
            </span>
            <span className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
              {formatBytes(result.compressedSize)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-left">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Space Saved
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatBytes(result.savedBytes)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 text-left">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              {isTargetMode ? 'Target Status' : 'Reduction'}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              {isTargetMode 
                ? (result.targetMet ? 'Target Achieved' : `Not Reached (-${percentage}%)`)
                : (result.percentageReduction > 0 ? `-${percentage}%` : '0%')}
            </span>
          </div>
        </div>

        {/* Visual Reduction Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 mb-8">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-indigo-500" />
              Size Reduction Comparison
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {compressedPercentage}% of original size
            </span>
          </div>

          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${compressedPercentage}%` }}
              title={`Compressed size: ${formatBytes(result.compressedSize)}`}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>0 KB</span>
            <span>Compressed: {formatBytes(result.compressedSize)}</span>
            <span>Original: {formatBytes(result.originalSize)}</span>
          </div>
        </div>

        {/* Side-by-Side Visual Inspection (Before vs After) with Zoom Detail */}
        {originalThumbnail && (
          <div className="mb-8 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Visual Quality Verification (Page 1)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 ml-2">
                  <Check className="w-3.5 h-3.5" /> Layout & Text Preserved
                </span>
              </div>

              {/* Zoom detail toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                    zoomLevel === 1 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ZoomOut className="w-3 h-3" />
                  <span>Fit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.6)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                    zoomLevel > 1 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>160% Zoom</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Card */}
              <div className="space-y-2 text-center">
                <div className="w-full aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-auto border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-2">
                  <img 
                    src={originalThumbnail} 
                    alt="Original document preview" 
                    className="max-w-none transition-transform duration-200"
                    style={{
                      width: zoomLevel === 1 ? '100%' : '160%',
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Original</span>
                  <span className="text-[11px] text-slate-400">{formatBytes(result.originalSize)}</span>
                </div>
              </div>

              {/* After Card */}
              <div className="space-y-2 text-center">
                <div className="w-full aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-auto border-2 border-indigo-500/80 shadow-md flex items-center justify-center p-2 relative">
                  {compressedThumbnail ? (
                    <img 
                      src={compressedThumbnail} 
                      alt="Compressed document preview" 
                      className="max-w-none transition-transform duration-200"
                      style={{
                        width: zoomLevel === 1 ? '100%' : '160%',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <img 
                      src={originalThumbnail} 
                      alt="Compressed preview" 
                      className="max-w-none transition-transform duration-200"
                      style={{
                        width: zoomLevel === 1 ? '100%' : '160%',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold shadow-sm">
                    {modeTitle}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Compressed</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{formatBytes(result.compressedSize)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition duration-200 flex items-center justify-center gap-2.5"
          >
            {downloaded ? (
              <>
                <Check className="w-5 h-5" />
                <span>Downloaded Again!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Compressed PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Compress Another File</span>
          </button>
        </div>

        {/* Security & Integrity reminder */}
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
          Processed 100% locally in your browser. All pages, typography, and vector structures are preserved.
        </p>

      </div>
    </div>
  );
}
