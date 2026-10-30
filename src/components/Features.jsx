import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Sparkles, 
  FileCheck2, 
  Zap,
  Lock,
  Layers
} from 'lucide-react';

export default function Features() {
  const featureList = [
    {
      icon: Lock,
      title: '100% Local Browser Privacy',
      description: 'Your sensitive contracts, financial statements, and personal IDs never leave your computer. Processing happens completely inside your browser sandbox.',
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      icon: Cpu,
      title: 'Intelligent PDF Optimization',
      description: 'Cleans unreferenced PDF objects, deflates cross-reference stream dictionaries, and downsamples high-DPI imagery while maintaining high text readability.',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
    },
    {
      icon: Zap,
      title: 'Instant Compression Speeds',
      description: 'Powered by modern JavaScript WebAssembly and HTML5 Canvas engines. No waiting for server queues, cloud uploads, or email download links.',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      icon: Sparkles,
      title: 'No Watermarks or Hidden Fees',
      description: 'CompressPDF is 100% free with no registration required. We never stamp watermarks on your pages or lock higher compression behind paywalls.',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      icon: Smartphone,
      title: 'Works on Any Device',
      description: 'Fully responsive and optimized for Windows, Mac, Linux, iPhone, iPad, and Android phones. Clean modern interface with light and dark mode.',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      icon: FileCheck2,
      title: 'Preserves Layout & Structure',
      description: 'Multi-page document layouts, orientation, and aspect ratios are carefully preserved so your compressed document looks just like the original.',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Why Choose CompressPDF
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for Security, Speed, and Quality
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Everything you need in a modern PDF compressor without the risks of uploading your data to third-party cloud servers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/30 dark:shadow-none hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
