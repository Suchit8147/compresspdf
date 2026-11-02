import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

export default function HeroUpload({ onFileSelected, error, setError }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndHandleFile = async (file) => {
    setError('');
    if (!file) return;

    // Check extension & MIME
    const hasPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';
    if (!hasPdfExt && !isPdfMime) {
      setError('Invalid file type! Please upload a valid PDF document (.pdf).');
      return;
    }

    // Check size limit: 100 MB max
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File is too large! CompressPDF supports files up to 100 MB in your browser.');
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes). Please upload a valid PDF.');
      return;
    }

    // Binary content validation: check magic bytes (%PDF)
    try {
      const headerBlob = file.slice(0, 8);
      const headerBuffer = await headerBlob.arrayBuffer();
      const headerStr = String.fromCharCode(...new Uint8Array(headerBuffer));
      if (!headerStr.includes('%PDF')) {
        setError('Invalid file format: This file does not appear to contain valid PDF content.');
        return;
      }
    } catch (_readErr) {
      // Continue to let engine inspect
    }

    onFileSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  // Quick test sample PDF loader
  const loadSamplePdf = async (samplePath, sampleName) => {
    try {
      setLoadingSample(true);
      setError('');
      const response = await fetch(samplePath);
      if (!response.ok) throw new Error('Failed to load sample');
      const blob = await response.blob();
      const sampleFile = new File([blob], sampleName, { type: 'application/pdf' });
      onFileSelected(sampleFile);
    } catch (err) {
      setError('Could not load sample PDF. You can upload any PDF from your device.');
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <section id="upload-section" className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Security & Trust Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Client-Side Privacy • No Files Uploaded to Any Server</span>
        </div>

        {/* Main Headings */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Compress PDF Files <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Online for Free</span>
        </h1>
        
        <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Reduce your PDF file size in seconds. Easy, secure and completely free.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-6 max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-left font-medium">{error}</div>
          </div>
        )}

        {/* Big Drag and Drop Area */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer rounded-3xl p-8 sm:p-12 transition-all duration-300 border-2 border-dashed ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.02] shadow-xl shadow-indigo-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900/90 shadow-xl shadow-slate-200/50 dark:shadow-none'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleInputChange}
              className="hidden"
              id="pdf-upload-input"
            />

            {/* Icon & Graphic */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <UploadCloud className="w-10 h-10 animate-bounce-subtle" />
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition duration-200"
                >
                  Choose PDF File
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400 pt-2 font-medium">
                  or drag and drop your PDF here
                </p>
              </div>

              {/* Badges / Specs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Format: PDF only
                </span>
                <span>•</span>
                <span>Max size: 100 MB</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> 100% Private
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sample Selector for immediate one-click testing */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Don't have a PDF? Try a sample:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingSample}
                onClick={() => loadSamplePdf('/samples/sample-brochure.pdf', 'High-Res-Brochure.pdf')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-medium border border-slate-200 dark:border-slate-600 shadow-sm transition hover:border-indigo-300"
              >
                📄 Marketing Brochure (3.0 MB)
              </button>
              <button
                type="button"
                disabled={loadingSample}
                onClick={() => loadSamplePdf('/samples/sample-presentation.pdf', 'Presentation-Deck.pdf')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-medium border border-slate-200 dark:border-slate-600 shadow-sm transition hover:border-indigo-300"
              >
                📊 Slide Deck (1.2 MB)
              </button>
              <button
                type="button"
                disabled={loadingSample}
                onClick={() => loadSamplePdf('/samples/sample-scanned.pdf', 'Scanned-Document.pdf')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-medium border border-slate-200 dark:border-slate-600 shadow-sm transition hover:border-indigo-300"
              >
                📑 Scanned Contract (431 KB)
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
