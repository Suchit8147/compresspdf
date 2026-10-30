import React from 'react';
import { ShieldCheck, Lock, ServerOff, EyeOff, Database, Mail, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage({ onNavigateHome, onOpenContact }) {
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: October 31, 2026</p>
            </div>
          </div>
        </div>

        {/* Highlight Guarantee */}
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4 text-left">
          <ServerOff className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
              100% Client-Side Privacy Guarantee
            </h3>
            <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              CompressPDF processes all document bytes directly inside your web browser sandbox using modern JavaScript WebAssembly and HTML5 Canvas APIs. <strong>Your PDF files and their confidential contents are never transmitted across the internet, uploaded to any remote server, or stored in any database.</strong>
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-left text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-indigo-500" />
              1. Information We Do Not Collect
            </h2>
            <p>
              Because CompressPDF operates strictly on your local hardware, we do not collect, view, inspect, or retain:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
              <li>The text, photography, financial data, or forms contained within your PDF documents.</li>
              <li>Document metadata such as author names, titles, creation software, or timestamps.</li>
              <li>Personal identification information unless voluntarily submitted via our Contact form.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              2. Memory Management and Object Destruction
            </h2>
            <p>
              When a document is selected for compression, it is held temporarily in your browser's Random Access Memory (RAM). Once processing completes and you click "Download Compressed PDF" or "Compress Another File", all temporary memory buffers and object URLs (<code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">URL.createObjectURL</code>) are immediately revoked and garbage-collected. Reloading the page or closing the tab destroys all session state.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              3. Cookies, Analytics & Monetization
            </h2>
            <p>
              We may utilize standard privacy-compliant web analytics to understand general website traffic (such as total visitor count and browser types). We also prepare reserved advertisement slots for Google AdSense to sustain our free service. Third-party vendors, including Google, may use cookies to serve ads based on prior visits. Users may opt out of personalized advertising by visiting Google Ad Settings (<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">google.com/settings/ads</a>).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              4. Contact Concerning Privacy
            </h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact our data controller directly at:
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
