import React from 'react';
import { Check, AlertTriangle, FileSpreadsheet, Sparkles, HelpCircle } from 'lucide-react';

export default function CompressionGuide() {
  return (
    <section className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Compression Levels Compared
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Choosing the Right Compression Level
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Different documents require different compression approaches. Here is how each setting affects quality and file size.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/50">
                  <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Profile</th>
                  <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Best Used For</th>
                  <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Typical Reduction</th>
                  <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Text Crispness</th>
                  <th className="py-4 px-6 font-bold text-slate-900 dark:text-white">Image Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      Low Compression
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs">Print materials, architectural drafts, high-res portfolios, legal agreements</td>
                  <td className="py-4 px-6 text-xs font-semibold text-slate-900 dark:text-white">10% – 30%</td>
                  <td className="py-4 px-6 text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% Original Vector</td>
                  <td className="py-4 px-6 text-xs">High Resolution (~150+ DPI)</td>
                </tr>

                <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm">
                      Recommended
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs">Business reports, resumes, presentations, email attachments</td>
                  <td className="py-4 px-6 text-xs font-bold text-indigo-600 dark:text-indigo-400">40% – 70%</td>
                  <td className="py-4 px-6 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Sharp & Very Clear</td>
                  <td className="py-4 px-6 text-xs">Standard Web (~120 DPI)</td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 text-xs font-bold">
                      High Compression
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs">Mobile sharing, government portals with strict file size caps (e.g. &lt; 2 MB)</td>
                  <td className="py-4 px-6 text-xs font-bold text-purple-600 dark:text-purple-400">65% – 85%</td>
                  <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-300">Readable</td>
                  <td className="py-4 px-6 text-xs">Compact (~96 DPI)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Realistic Note Box */}
        <div className="mt-8 p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-4 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">
              Why some PDFs don't get much smaller
            </h4>
            <p>
              PDF compression algorithms work by removing duplicate binary structures, stripping non-essential metadata, and downsampling over-sized images. If a PDF is already exported with minimal flate streams or consists only of plain vector text fonts without embedded photos, there may be little to no redundant data to remove. In such cases, CompressPDF verifies your document and keeps the original file so no quality is lost.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
