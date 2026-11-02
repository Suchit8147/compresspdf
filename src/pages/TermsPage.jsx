import React from 'react';
import { FileText, ArrowLeft, Mail } from 'lucide-react';

export default function TermsPage({ onNavigateHome }) {
  return (
    <div className="py-12 md:py-20 animate-fade-in text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="space-y-4 text-left">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Compressor</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Effective Date: October 31, 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-left text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Agreement to Terms</h2>
            <p>
              By accessing and using CompressPDF (accessible at <a href="https://compresspdf.app" className="text-indigo-600 dark:text-indigo-400 underline">https://compresspdf.app</a>), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you are prohibited from using the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Scope of Service</h2>
            <p>
              CompressPDF provides client-side document compression and optimization utilities. All processing occurs locally within your web browser. The service is provided free of charge, with no registration required. We reserve the right to modify, update, or discontinue features at any time without liability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Intellectual Property and File Ownership</h2>
            <p>
              You retain 100% of the ownership, copyright, and intellectual property rights to any files you process through CompressPDF. CompressPDF does not claim ownership or license rights over any uploaded, optimized, or downloaded documents.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "as is" and "as available" basis. While we strive to preserve visual readability and formatting, we do not guarantee that every document will achieve a specific percentage reduction. Users are advised to verify the output document before deleting their original file copies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
            <p>
              Under no circumstances shall CompressPDF, its creators, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this utility, including document corruption, lost data, or transmission errors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Inquiries and Contact</h2>
            <p>
              Questions regarding these Terms of Service may be submitted via email to:
            </p>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 inline-block">
              <a 
                href="mailto:businesswithsuchit@gmail.com" 
                className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>businesswithsuchit@gmail.com</span>
              </a>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
