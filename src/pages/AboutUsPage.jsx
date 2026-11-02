import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  CheckCircle2, 
  Mail,
  FileDown
} from 'lucide-react';

export default function AboutUsPage({ onNavigateHome, onOpenContact }) {
  return (
    <div className="py-12 md:py-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Our Mission & Technology</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            About <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">CompressPDF</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            We are dedicated to building high-speed, 100% private digital utilities. CompressPDF was created to solve a universal pain point: reducing PDF file sizes without surrendering confidential documents to unknown cloud servers.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition shadow-indigo-500/25"
            >
              <FileDown className="w-4 h-4" />
              <span>Start Compressing PDF Files</span>
            </button>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero Server Uploads</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional online converters upload your tax returns, medical files, and contracts to external cloud servers. We do not. Every byte of your document is parsed and compressed entirely in your browser RAM.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">True Client-Side Speed</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              By eliminating slow network upload and download queues, CompressPDF compresses multi-page documents in seconds using modern WebAssembly and HTML5 Canvas engines directly on your hardware.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Accessible to Everyone</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              No account creation, no subscriptions, and no paywalls. Whether submitting a university thesis, a job application, or a government portal document, CompressPDF is always free.
            </p>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white space-y-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Engineering Principles</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How We Built CompressPDF</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 text-sm text-slate-300 leading-relaxed">
            <p>
              CompressPDF is engineered as a modern Single-Page Application (SPA) utilizing <strong>React</strong> and <strong>Vite</strong>. We combine the document structural manipulation capabilities of <strong>pdf-lib</strong> with the high-fidelity rendering pipeline of <strong>PDF.js</strong>.
            </p>
            <p>
              When a PDF is loaded, our compression algorithm inspects internal XObject image dictionaries, strips redundant metadata (author, creator, timestamp tags), and re-encodes bulky raster streams while preserving sharp vector typography and page aspect ratios.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 relative z-10 text-xs text-slate-400">
            <span>Developer: Suchit</span>
            <a 
              href="mailto:businesswithsuchit@gmail.com" 
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              <span>businesswithsuchit@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Have questions, feedback, or a partnership inquiry?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            We are continuously improving our compression engine and love hearing from our community.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenContact}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow transition"
            >
              Contact Support
            </button>
            <button
              onClick={onNavigateHome}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Go to Compressor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
