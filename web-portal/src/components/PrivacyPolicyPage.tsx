import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, XCircle, ExternalLink } from 'lucide-react';
import { GenuxLogo } from './GenuxLogo';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onDownloadExe?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack, onDownloadExe }) => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
            <ShieldCheck size={14} />
            <span>100% On-Device Offline Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy &amp; Data Collection
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Published by Xonarous Inc (<a href="https://xonarous.nl" target="_blank" rel="noreferrer" className="text-indigo-600 underline">xonarous.nl</a>) • Effective Date: October 2026
          </p>
        </div>

        {/* Highlight Guarantee Box */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 mb-10 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
            <Lock size={18} />
            <span>The Genux Privacy Oath: Zero Cloud Uploads of Creative Data</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Genux AI Studio is fundamentally engineered as a <strong>100% local Windows desktop workstation</strong>. All neural video recasting, sub-pixel rotoscope segmentation (SAM 2.1), 133-keypoint tracking (DWPose), facial landmark alignments, and video synthesis (Wan 2.1 14B) execute entirely on your own local NVIDIA GPU. <strong>Your videos, face photographs, audio tracks, and prompts never leave your computer.</strong>
          </p>
        </div>

        <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              1. Creative Content We NEVER Collect or Transmit
            </h2>
            <p className="text-slate-600">
              When utilizing Genux AI Studio, all multimedia processing is confined to your machine&apos;s physical NVMe storage and VRAM. Specifically:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <span>Imported Videos &amp; Audio</span>
                </div>
                <p className="text-xs text-slate-500">
                  Any video ingested from local files, YouTube, or camera imports is demuxed locally via NVDEC into your cache folder (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">~/.cache/genux/media</code>) and is never uploaded anywhere.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <span>Faces, Twins &amp; Character Anchors</span>
                </div>
                <p className="text-xs text-slate-500">
                  Portraits uploaded to the Characters Vault and corresponding <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">.gchar</code> vectors are stored in your local app data directory and never sent to cloud servers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <span>Prompts &amp; Creative Text</span>
                </div>
                <p className="text-xs text-slate-500">
                  Your identity recast prompts, Gemma 2 director instructions, and scene modification parameters remain local unless you explicitly configure a third-party cloud API.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                  <span>Personal Identity &amp; Folders</span>
                </div>
                <p className="text-xs text-slate-500">
                  We never index, scan, or transmit your computer&apos;s personal directories, documents, or browser histories.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              2. Optional Anonymous Performance &amp; Hardware Telemetry (Opt-In)
            </h2>
            <p className="text-slate-600">
              To assist our engineering team in optimizing C++ CUDA streaming, TensorRT 10.x engine compilation, and low-precision FP8 latency across diverse NVIDIA graphics cards (RTX 3060 12GB up to RTX 5090 Blackwell 32GB), Genux AI includes an <strong>optional, strictly opt-in anonymous telemetry system</strong>.
            </p>
            <p className="text-slate-600">
              This system is disabled by default until you deliberately choose to opt in upon the initial application launch or through settings.
            </p>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <h3 className="font-bold text-indigo-950 text-xs">What is synced when you opt in:</h3>
              <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-900">GPU Hardware Specifications:</strong> Exact GPU chipset model (e.g., &quot;NVIDIA GeForce RTX 4080&quot;), total physical VRAM, and system RAM architecture.</li>
                <li><strong className="text-slate-900">Inference Performance Metrics:</strong> Average frames-per-second (FPS) during Wan 2.1 latent generation and NVENC hardware encoding speeds.</li>
                <li><strong className="text-slate-900">C++ Engine Crash Logs:</strong> Uncaught CUDA kernel exceptions, memory allocation failures, or model file parsing errors to help us ship stability updates.</li>
                <li><strong className="text-slate-900">Aggregated Counters:</strong> Total count of successfully completed renders and installed neural weights (no names or metadata).</li>
                <li><strong className="text-slate-900">Client UUID:</strong> A randomized, pseudonymous installation identifier (e.g., <code className="bg-white px-1 py-0.5 rounded text-[11px]">client-1792-x89f</code>) regenerated on clean reinstall.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              3. Complete User Control &amp; Instant Revocation
            </h2>
            <p className="text-slate-600">
              You retain unconditional control over telemetry at any time. To disable data tracking:
            </p>
            <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside pl-2">
              <li>Open Genux AI Studio on your desktop.</li>
              <li>Click <strong>Settings</strong> in the bottom-left sidebar.</li>
              <li>Navigate to the <strong>Data Tracking &amp; Privacy</strong> tab.</li>
              <li>Toggle <strong>&quot;Anonymous Performance &amp; Error Telemetry&quot;</strong> to OFF.</li>
            </ol>
            <p className="text-xs text-slate-500 mt-2">
              The moment this setting is toggled off, all telemetry pings immediately terminate.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              4. 100% Clean Uninstall Policy
            </h2>
            <p className="text-slate-600">
              Unlike other generative tools that leave gigabytes of neural weights behind in hidden directories, the Genux AI Windows uninstaller executes a complete and exhaustive disk wipe:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
              <div>✓ Purges %USERPROFILE%\.cache\genux (all downloaded weights &amp; caches)</div>
              <div>✓ Purges %LOCALAPPDATA%\GenuxAI</div>
              <div>✓ Purges %APPDATA%\genux-desktop-app &amp; settings</div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              5. European GDPR, Dutch Privacy Standards &amp; Contact
            </h2>
            <p className="text-slate-600">
              Genux AI Studio adheres strictly to the European Union General Data Protection Regulation (GDPR) and Dutch privacy legislation. We do not sell, rent, or commercialize any telemetry data to advertisers, data brokers, or third parties.
            </p>
            <p className="text-slate-600">
              For any questions, contact Xonarous Inc via:
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://xonarous.nl"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <span>Xonarous Inc Website (xonarous.nl)</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://github.com/Xonarouss/genuxaistudio"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
              >
                <span>GitHub Repository</span>
                <ExternalLink size={12} />
              </a>
            </div>
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
