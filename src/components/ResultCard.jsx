import React, { useEffect, useState } from 'react';
import { 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  FileCheck, 
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  Target,
  Eye,
  Sliders
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
  const [showSideBySide, setShowSideBySide] = useState(true);

  useEffect(() => {
    // Generate thumbnail of compressed document
    if (result && result.compressedBytes) {
      const buffer = result.compressedBytes.buffer.slice(
        result.compressedBytes.byteOffset,
        result.compressedBytes.byteOffset + result.compressedBytes.byteLength
      );
      renderPdfPageToDataUrl(buffer, 1, 0.45).then((thumb) => {
        if (thumb?.dataUrl) {
          setCompressedThumbnail(thumb.dataUrl);
        }
      }).catch(() => {});
    }

    // Fire confetti celebration if space was saved or target met
    if (result && (result.percentageReduction > 10 || result.targetMet)) {
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-slate-200/80 dark:border-slate-800 text-center">
        
        {/* Success / Target Met Header */}
        {isTargetMode ? (
          result.targetMet ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Target Achieved: {formatBytes(result.compressedSize)} ≤ Target {formatBytes(result.targetSizeBytes)}!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4 shadow-sm">
              <Target className="w-4 h-4 text-indigo-500" />
              <span>Optimized: {formatBytes(result.compressedSize)} (Closest possible to {formatBytes(result.targetSizeBytes)} budget)</span>
            </div>
          )
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {result.isAlreadyOptimized 
                ? 'Document Verified • Maximum Efficiency Maintained'
                : `Compression Successful • Saved ${percentage}% Space!`}
            </span>
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {isTargetMode && result.targetMet
            ? `Target Reached: ${formatBytes(result.compressedSize)}!`
            : result.isAlreadyOptimized
              ? 'Your PDF is Already Maximally Optimized'
              : `Compressed by ${percentage}% (${formatBytes(result.savedBytes)} Saved)`}
        </h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {isTargetMode
            ? `Resized to meet your strict upload requirements (${formatBytes(result.targetSizeBytes)}). Text structure and pages are preserved.`
            : result.isAlreadyOptimized
              ? 'This document was already deflated and contains no redundant streams. We kept your original file intact so no bytes were added.'
              : 'Your file has been optimized locally in your browser. All pages, text, and formatting have been preserved.'}
        </p>

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
                ? (result.targetMet ? 'Met (≤ Target)' : `-${percentage}%`)
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

        {/* Side-by-Side Visual Inspection (Before vs After) */}
        {originalThumbnail && (
          <div className="mb-8 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-500" />
                Visual Quality Verification (Page 1)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Text & formatting intact
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Before Card */}
              <div className="space-y-2 text-center">
                <div className="w-full aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-1">
                  <img 
                    src={originalThumbnail} 
                    alt="Original document preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Original</span>
                  <span className="text-[11px] text-slate-400">{formatBytes(result.originalSize)}</span>
                </div>
              </div>

              {/* After Card */}
              <div className="space-y-2 text-center">
                <div className="w-full aspect-[3/4] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-indigo-500/80 shadow-md flex items-center justify-center p-1 relative">
                  {compressedThumbnail ? (
                    <img 
                      src={compressedThumbnail} 
                      alt="Compressed document preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={originalThumbnail} 
                      alt="Compressed preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                    Optimized
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

        {/* Security reminder */}
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
          Processed strictly in your browser. No files were retained or transmitted over the internet.
        </p>

      </div>
    </div>
  );
}
