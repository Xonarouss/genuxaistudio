import React, { useEffect } from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { GenuxLogo } from './GenuxLogo';

interface TermsOfServicePageProps {
  onBack: () => void;
  onDownloadExe?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack, onDownloadExe }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2.5">
              <GenuxLogo size={22} />
              <span className="font-extrabold text-sm tracking-tight text-slate-900">GENUX AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/xonarous"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 transition shadow-xs"
            >
              <span>🍺</span>
              <span>Buy me a beer</span>
            </a>
            {onDownloadExe && (
              <button
                onClick={onDownloadExe}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
              >
                Download (.exe)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Title Block */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Scale size={14} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Published by Xonarous Inc (<a href="https://xonarous.nl" target="_blank" rel="noreferrer" className="text-indigo-600 underline">xonarous.nl</a>) • Effective Date: October 2026
          </p>
        </div>

        <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              1. Agreement to Terms
            </h2>
            <p className="text-slate-600">
              By accessing, downloading, installing, or executing Genux AI Studio software or visiting genuxai.io, you agree to comply with and be legally bound by these Terms of Service. If you do not agree to these terms, do not install or use the software.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              2. License Grant &amp; Local Ownership
            </h2>
            <p className="text-slate-600">
              Xonarous Inc grants you a personal, non-exclusive, revocable license to execute Genux AI Studio on your local personal computer or workstation.
            </p>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <strong>Ownership of Output:</strong> You retain 100% full intellectual property ownership of all videos, rendering masters, and exported media generated locally using your hardware and model weights.
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              3. Responsible &amp; Ethical AI Use
            </h2>
            <p className="text-slate-600">
              Genux AI Studio is provided for creative storytelling, film post-production, digital avatar synthesis, parody, and entertainment. You agree that you will NOT use the software to:
            </p>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside pl-2">
              <li>Produce non-consensual sexually explicit deepfakes or imagery of real individuals.</li>
              <li>Generate defamatory, harassing, threatening, or libelous depictions intended to deceive.</li>
              <li>Infringe upon the copyright, publicity rights, or intellectual property of third parties.</li>
              <li>Violate any applicable local, national, or international laws or regulations.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Users assume sole and complete legal liability for all content created on their machines.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              4. Open Foundation Model Licenses
            </h2>
            <p className="text-slate-600">
              Genux AI orchestrates state-of-the-art open-research neural models. Each foundation model is governed by its original creator&apos;s open research license:
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-slate-600 list-disc list-inside pl-2">
              <li><strong>Wan 2.1 14B:</strong> Apache 2.0 / Wan-AI Research License</li>
              <li><strong>Meta SAM 2.1:</strong> Apache 2.0 Community License</li>
              <li><strong>DWPose 133-pt:</strong> OpenMMLab Research License</li>
              <li><strong>Google Gemma 2:</strong> Gemma Terms of Use by Google DeepMind</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              5. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p className="text-slate-600">
              Genux AI Studio is provided on an &quot;AS-IS&quot; and &quot;AS-AVAILABLE&quot; basis without warranties of any kind. Under no circumstances shall Xonarous Inc be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of the software, VRAM exhaustion, or model outputs.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-12 mt-12 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </button>
          <a
            href="https://buymeacoffee.com/xonarous"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs shadow-sm transition"
          >
            <span>🍺</span>
            <span>Buy me a beer</span>
          </a>
        </div>
      </main>
    </div>
  );
};
