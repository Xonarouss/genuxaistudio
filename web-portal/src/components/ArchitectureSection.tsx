import { Cpu, ShieldCheck } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Blackwell Architecture & TensorRT 10.x</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Engineered Strictly for 16GB VRAM GPUs.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Running 14-billion parameter video synthesis locally requires precision systems engineering. Here is how the Genux C++ engine locks execution inside a 14.5 GB memory envelope.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Native FP8 (E4M3)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Blackwell Tensor Core native FP8 quantization compresses Wan 2.1 14B weights down to ~10.4 GB VRAM with zero perceptual loss.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Stage VRAM Offload</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Custom C++ <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800">VRAMManager</code> streams weights between DDR5 host RAM and VRAM using <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800">cudaMallocAsync</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Tiled Spatio-Temporal VAE</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Splits high-resolution video latents into spatial tiles with overlapping temporal blending, preventing spike crashes during 1080p decoding.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Zero-Copy NVDEC</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct-to-GPU video decoding avoids PCIe bandwidth choking. Frames pass straight from hardware decoder into SAM 2 tracking memory.
            </p>
          </div>
        </div>

        {/* Comparison Table: Genux AI vs Higgsfield vs Runway */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Commercial Benchmark Comparison</h3>
              <p className="text-xs text-slate-500">Why local desktop architecture wins over cloud subscriptions</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Private & Uncensored</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-700 font-bold">
                  <th className="py-3.5 px-6">Specification</th>
                  <th className="py-3.5 px-6 text-indigo-700 bg-indigo-50/40">
                    <span className="flex items-center gap-1.5 font-extrabold text-sm">
                      Genux AI (Local Engine)
                    </span>
                  </th>
                  <th className="py-3.5 px-6 text-slate-500">Higgsfield Genjutsu</th>
                  <th className="py-3.5 px-6 text-slate-500">Runway Gen-3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Monthly License / Cost</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-indigo-50/20">$0 (100% Local GPU)</td>
                  <td className="py-3.5 px-6">$49 – $199 / month</td>
                  <td className="py-3.5 px-6">$76 – $95 / month</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Cloud Queue & Rendering Wait</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-indigo-50/20">0 Seconds (Instant Execution)</td>
                  <td className="py-3.5 px-6 text-amber-600">2 – 8 minutes in queue</td>
                  <td className="py-3.5 px-6 text-amber-600">3 – 10 minutes in queue</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Output Framerate</td>
                  <td className="py-3.5 px-6 font-bold text-indigo-600 bg-indigo-50/20">60 FPS Ultra-Smooth (RIFE v4.22)</td>
                  <td className="py-3.5 px-6">24 FPS</td>
                  <td className="py-3.5 px-6">24 / 30 FPS</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Hardware Acceleration</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900 bg-indigo-50/20">TensorRT 10.x Native C++20 FP8</td>
                  <td className="py-3.5 px-6">Shared Cloud Clusters</td>
                  <td className="py-3.5 px-6">Shared Cloud Clusters</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Target Character Persistence</td>
                  <td className="py-3.5 px-6 font-bold text-indigo-600 bg-indigo-50/20">.gchar Local Embeddings Vault</td>
                  <td className="py-3.5 px-6">Pre-baked cloud avatars only</td>
                  <td className="py-3.5 px-6">Seed locks (high drift)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">Video Ingestion Method</td>
                  <td className="py-3.5 px-6 font-bold text-slate-900 bg-indigo-50/20">1-Click Direct TikTok/IG/YT Ripping</td>
                  <td className="py-3.5 px-6">Manual MP4 File Upload</td>
                  <td className="py-3.5 px-6">Manual MP4 File Upload</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
