import React from 'react';
import { 
  UploadCloud, 
  Sliders, 
  DownloadCloud, 
  Cpu, 
  CheckCircle2, 
  Target, 
  FileDown 
} from 'lucide-react';

export default function HowItWorksPage({ onNavigateHome }) {
  const steps = [
    {
      num: '01',
      title: 'Upload Document to Browser Memory',
      desc: 'Drag & drop your PDF file or click "Choose PDF File". The file is instantly read into your local browser RAM buffer as a typed binary array (ArrayBuffer). Crucially, no bytes are sent across the network.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'Select Profile or Target File Size (KB/MB)',
      desc: 'Choose between Low, Recommended, or High Compression, or type your exact required file budget (e.g. 40 KB, 100 KB, 1 MB). Our engine analyzes document DPI, fonts, and internal streams to calibrate downsampling.',
      icon: Target,
    },
    {
      num: '03',
      title: 'Real-Time Stream Optimization & Verification',
      desc: 'The engine strips unneeded metadata dictionaries, compresses internal cross-reference tables into object streams, and re-encodes bulky raster graphics. You can inspect the side-by-side Page 1 visual preview before downloading.',
      icon: Sliders,
    },
    {
      num: '04',
      title: 'Instant Local Download',
      desc: 'Click "Download Compressed PDF" to save your newly optimized document with clean naming ([filename]-compressed.pdf). All temporary RAM buffers and ObjectURLs are automatically garbage-collected.',
      icon: DownloadCloud,
    },
  ];

  return (
    <div className="py-12 md:py-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm">
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Algorithm & Compression Guide</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">CompressPDF</span> Works
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Discover the inner workings of our client-side compression pipeline. Learn how we reduce file sizes by up to 90% while keeping your text razor-sharp and your data completely private.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition shadow-indigo-500/25"
            >
              <FileDown className="w-4 h-4" />
              <span>Try CompressPDF Now</span>
            </button>
          </div>
        </div>

        {/* 4 Steps In-Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div 
                key={st.num}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-200 dark:text-slate-800 select-none">
                    {st.num}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {st.title}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Technical Deep Dive */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-6 text-left">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">The Technology</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Behind the Compression Algorithms
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-300">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">1. Object Stream Deflating</h4>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                In modern PDF specifications (PDF 1.5+), individual indirect objects (fonts, content streams, layout dictionaries) can be combined and compressed into single flate-encoded stream objects, significantly shrinking structural document overhead.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">2. Intelligent Image Resampling</h4>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Most oversized PDFs stem from 300+ DPI camera photos or print graphics. By re-encoding embedded raster streams to screen-optimized DPI with perceptual chroma subsampling, file sizes drop by 50% to 85% with zero perceptible loss on screens.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">3. Non-Destructive Metadata Stripping</h4>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                PDF editors automatically append application history, thumbnail caches, unreferenced annotations, and XML metadata. Removing these orphaned blocks slashes bytes without altering document typography.
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips for Best Results */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Tips for Getting the Smallest File Size
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span><strong>Job / Visa Portals:</strong> Use the <em>Target Specific File Size</em> box and type your portal limit (e.g. 100 KB or 40 KB). The engine will calculate the exact byte budget per page.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span><strong>Scanned Documents:</strong> Scanned contracts and receipts achieve the largest savings because camera sensors embed uncompressed JPEG streams that CompressPDF deflates efficiently.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span><strong>Plain Text PDFs:</strong> If a document consists only of vector text (like a code export or plain Word document with no images), it is already compact. Structural optimization ensures no quality is lost.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
