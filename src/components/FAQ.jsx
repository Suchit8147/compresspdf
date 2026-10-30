import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does CompressPDF compress files without uploading them to a server?',
      a: 'CompressPDF utilizes modern browser technologies, including WebAssembly and the HTML5 Canvas API. Your device reads the binary structure of the PDF, optimizes internal object streams, strips redundant metadata, and re-encodes oversized images locally inside your browser sandbox. None of your data ever traverses the internet.',
    },
    {
      q: 'Will compressing my PDF cause text or images to become blurry?',
      a: 'With Low Compression, vector text and line art remain 100% untouched and razor-sharp, with only structural stream deflating applied. Recommended Compression provides the sweet spot for everyday documents—keeping text crisp while downsizing high-resolution imagery. For strict file-size constraints, High Compression achieves the smallest size while maintaining full readability.',
    },
    {
      q: 'Why did my PDF only shrink by a small percentage or not at all?',
      a: 'If a PDF is composed entirely of plain text fonts and was already saved using modern flate stream compression, there are simply no bulky images or uncompressed objects to shrink. Unlike dishonest tools that report fake savings, CompressPDF gives you honest metrics and will keep your original file if re-saving would not yield reductions.',
    },
    {
      q: 'Is CompressPDF completely free to use?',
      a: 'Yes! CompressPDF is 100% free with no hidden paywalls, no registration required, and no watermarks added to your documents. You can compress as many files as you want.',
    },
    {
      q: 'Can I compress scanned documents and photo-heavy PDFs?',
      a: 'Yes! Scanned PDFs, presentations with embedded high-resolution graphics, and smartphone photo scans typically achieve the largest size reductions—frequently dropping 50% to 80% in size without noticeable loss in document readability.',
    },
    {
      q: 'Can I compress password-protected or encrypted PDF files?',
      a: 'For security reasons, password-protected and encrypted PDF documents cannot be processed until the password is removed. If you upload a locked file, CompressPDF will notify you so you can decrypt it before optimizing.',
    },
    {
      q: 'Does CompressPDF work on mobile devices?',
      a: 'Yes, CompressPDF is fully responsive and functions smoothly on modern mobile browsers including Safari on iOS and Chrome on Android, as long as your mobile browser supports standard HTML5 features.',
    },
  ];

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Got Questions?
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Everything you need to know about our local PDF compression engine.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="w-full py-4 sm:py-5 px-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
