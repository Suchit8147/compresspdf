import React from 'react';
import { FileDown, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';

export default function Footer({ 
  navigateTo, 
  onOpenPrivacy, 
  onOpenTerms, 
  onOpenContact 
}) {
  const handleNav = (page, sectionId = null) => {
    if (navigateTo) {
      navigateTo(page, sectionId);
    } else if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <button 
              onClick={() => handleNav('home', 'upload-section')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
              aria-label="CompressPDF Home"
            >
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <FileDown className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Compress<span className="text-indigo-600 dark:text-indigo-400">PDF</span>
              </span>
            </button>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-sm">
              Reduce PDF Size. Save Space. Share Faster.
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              CompressPDF is a high-speed, 100% client-side PDF utility tool. All processing happens locally on your computer. Your documents are never stored or transmitted over any cloud network.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Client-Side Privacy Guarantee</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <button 
                  onClick={() => handleNav('home', 'upload-section')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('how-it-works')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('home', 'features')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Features & Presets
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('home', 'faq')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <button 
                  onClick={() => handleNav('about')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('privacy')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('terms')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNav('contact')} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Contact Support
                </button>
              </li>
              <li className="pt-2">
                <a 
                  href="mailto:businesswithsuchit@gmail.com?subject=CompressPDF%20Support%20Inquiry" 
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>businesswithsuchit@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div>
            © {new Date().getFullYear()} CompressPDF. All rights reserved. Free client-side PDF compressor.
          </div>
          <div className="flex items-center gap-1">
            Built with modern web standards and client-side cryptography.
          </div>
        </div>
      </div>
    </footer>
  );
}

