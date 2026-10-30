import React from 'react';
import { UploadCloud, Sliders, DownloadCloud, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload Your PDF',
      description: 'Select your file or drag and drop it into the upload box. Your document never leaves your device or browser.',
      icon: UploadCloud,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      number: '02',
      title: 'Choose Compression',
      description: 'Select Low, Recommended, or High compression. Customize grayscale and metadata removal in advanced settings.',
      icon: Sliders,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      number: '03',
      title: 'Download & Share',
      description: 'Your optimized, smaller PDF is ready immediately. Download with one click and share faster via email or messaging.',
      icon: DownloadCloud,
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Effortless 3-Step Process
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How CompressPDF Works
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Enjoy instant client-side PDF compression without account sign-ups, server uploads, or wait queues.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number}
                className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 transition duration-300"
              >
                {/* Step number badge */}
                <span className="absolute top-6 right-8 text-3xl font-black text-slate-100 dark:text-slate-800 select-none">
                  {step.number}
                </span>

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md mb-6`}>
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
