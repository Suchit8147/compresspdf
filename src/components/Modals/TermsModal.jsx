import React from 'react';
import { X, FileText } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-labelledby="terms-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="terms-title" className="text-xl font-bold text-slate-900 dark:text-white">Terms of Service</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Effective Date: October 2026</p>
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

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">1. Acceptance of Terms</h3>
            <p>
              By accessing and using CompressPDF, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">2. Service Description</h3>
            <p>
              CompressPDF provides client-side document compression utilities. The service is provided "as is" and "as available". Because processing occurs directly on your client hardware, performance and compression times may vary depending on your device specifications and file structure.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">3. Intellectual Property Rights</h3>
            <p>
              You retain all ownership, intellectual property rights, and copyright to any documents you compress using CompressPDF. CompressPDF claims no ownership or rights over your files.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">4. Limitation of Liability</h3>
            <p>
              In no event shall CompressPDF or its creators be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service, including data corruption or loss. Users are encouraged to maintain backup copies of all original files before compression.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">5. Modifications</h3>
            <p>
              We reserve the right to revise or modify these Terms of Service at any time without prior notice. Continued use of the service constitutes acceptance of any changes.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
          >
            Agree & Close
          </button>
        </div>
      </div>
    </div>
  );
}
