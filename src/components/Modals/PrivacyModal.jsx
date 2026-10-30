import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, ServerOff, Database } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-labelledby="privacy-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-title" className="text-xl font-bold text-slate-900 dark:text-white">Privacy Policy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: October 2026</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <ServerOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">100% Client-Side Processing Guarantee</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                CompressPDF executes entirely within your web browser using HTML5 Canvas and JavaScript WebAssembly. <strong>Your PDF files and their contents are never uploaded to any remote server or stored anywhere.</strong>
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-500" /> 1. Information We Do Not Collect
            </h3>
            <p>
              We do not collect, view, inspect, or retain:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>The contents, text, photos, or data inside any uploaded PDF documents.</li>
              <li>Document metadata (such as author names, titles, creation dates).</li>
              <li>Personal identification information unless voluntarily submitted via our Contact form.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" /> 2. Local Storage and Memory
            </h3>
            <p>
              When you compress a PDF, it is processed temporarily in your browser's RAM memory. As soon as you reload the page, close your browser tab, or click "Compress Another File", all temporary memory buffers and object URLs are immediately revoked and destroyed.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> 3. Analytics and Advertising
            </h3>
            <p>
              We may utilize standard privacy-compliant web analytics and Google AdSense to sustain our free service. Third-party vendors may use cookies to serve ads based on user visits. You can opt out of personalized advertising by visiting Google Ad Settings.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">4. Contact Concerning Privacy</h3>
            <p>
              If you have any questions regarding this Privacy Policy, please reach out to us through our Contact page or email businesswithsuchit@gmail.com.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
