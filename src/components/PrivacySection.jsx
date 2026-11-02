import React from 'react';
import { ShieldCheck, Lock, ServerOff, EyeOff, CheckCircle2 } from 'lucide-react';

export default function PrivacySection() {
  const points = [
    {
      title: 'Zero Cloud Storage',
      desc: 'Most online PDF tools upload your file to an unknown remote server where it stays stored for hours or days. CompressPDF never uploads your file anywhere.',
      icon: ServerOff,
    },
    {
      title: 'Browser Sandbox Security',
      desc: 'All operations execute within the isolated sandbox of your web browser. Your confidential information stays entirely on your physical computer.',
      icon: Lock,
    },
    {
      title: 'Enterprise & GDPR Safe',
      desc: 'Because data never crosses network boundaries, you remain fully compliant with HIPAA, GDPR, CCPA, and strict corporate non-disclosure requirements.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant Memory Revocation',
      desc: 'All memory buffers and temporary binary objects are automatically garbage collected and cleared the moment you finish or close the tab.',
      icon: EyeOff,
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Bank-Grade Local Privacy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Why Client-Side Privacy Matters
          </h2>
          <p className="mt-3 text-slate-400 text-base leading-relaxed">
            Unlike traditional PDF tools that require uploading your sensitive files to cloud servers, CompressPDF compresses your documents directly on your device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt) => {
            const Icon = pt.icon;
            return (
              <div 
                key={pt.title}
                className="p-6 rounded-3xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm hover:border-indigo-500/50 transition duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {pt.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
