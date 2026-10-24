import React from 'react';
import { Cpu, HardDrive, Monitor, Laptop } from 'lucide-react';

interface TierSpec {
  name: string;
  badge: string;
  badgeColor: string;
  gpu: string;
  vram: string;
  ram: string;
  storage: string;
  diffusionSpeed: string;
  recommendedRole: string;
}

const HARDWARE_TIERS: TierSpec[] = [
  {
    name: 'Minimum Specification',
    badge: '12GB VRAM Minimum',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    gpu: 'NVIDIA RTX 3060 12GB / RTX 4070 12GB',
    vram: '12 GB GDDR6',
    ram: '32 GB DDR4 / DDR5',
    storage: '50 GB Free NVMe SSD',
    diffusionSpeed: '~1.8s / frame (FP8 Scaled)',
    recommendedRole: 'Standard Recasting (480p / 720p 30 FPS)'
  },
  {
    name: 'Recommended Studio',
    badge: '16GB Native Profile',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gpu: 'NVIDIA RTX 4080 16GB / RTX 4070 Ti Super',
    vram: '16 GB GDDR6X',
    ram: '32 GB - 64 GB DDR5',
    storage: '80 GB NVMe Gen 4 SSD',
    diffusionSpeed: '~0.6s / frame (Native FP8)',
    recommendedRole: 'High-Speed Recasting (720p / 1080p 60 FPS)'
  },
  {
    name: 'Flagship Blackwell / Ultra',
    badge: 'Blackwell FP8 Accelerated',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gpu: 'NVIDIA RTX 5080 16GB / RTX 5090 / RTX 4090 24GB',
    vram: '16 GB - 24 GB GDDR7',
    ram: '64 GB DDR5 High-Speed',
    storage: '100 GB NVMe Gen 5 SSD',
    diffusionSpeed: '~0.28s / frame (Tensor Core FP8 E4M3)',
    recommendedRole: 'Full 4K Ultra Cinematic Video Recasting'
  }
];

export const RequirementsSection: React.FC = () => {
  return (
    <section id="requirements" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Cpu size={14} />
            <span>Hardware & System Compatibility</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            System Requirements
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Genux AI runs entirely on local consumer NVIDIA hardware. No cloud tokens, no monthly subscriptions. The engine dynamically tunes precision between FP8 and BF16 based on your GPU's exact VRAM budget.
          </p>
        </div>

        {/* Tiers Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {HARDWARE_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`p-7 rounded-3xl bg-slate-50/70 border transition-all duration-300 flex flex-col justify-between ${
                idx === 1 
                  ? 'border-indigo-400 bg-white shadow-xl shadow-indigo-100/60 relative overflow-hidden ring-2 ring-indigo-500/10' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {idx === 1 && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-bl-xl tracking-wider">
                  Recommended
                </div>
              )}

              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border mb-4 ${tier.badgeColor}`}>
                  {tier.badge}
                </span>

                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {tier.name}
                </h3>
                
                <p className="text-xs text-indigo-600 font-semibold mb-6">
                  {tier.recommendedRole}
                </p>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="flex items-start gap-3">
                    <Monitor size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Target GPU</div>
                      <div className="text-slate-600 font-mono text-[11px] mt-0.5">{tier.gpu}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Cpu size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Video Memory (VRAM)</div>
                      <div className="text-slate-600 font-mono text-[11px] mt-0.5">{tier.vram}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Laptop size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">System RAM</div>
                      <div className="text-slate-600 font-mono text-[11px] mt-0.5">{tier.ram}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HardDrive size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Storage Disk</div>
                      <div className="text-slate-600 font-mono text-[11px] mt-0.5">{tier.storage}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed Benchmark */}
              <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Inference speed:</span>
                <span className="text-emerald-600 font-bold">{tier.diffusionSpeed}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Operating System & Driver Requirements Bar */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div>
            <div className="font-bold text-slate-900 mb-1">Operating System</div>
            <div className="text-slate-600">Windows 10 / 11 64-bit</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-1">NVIDIA Drivers</div>
            <div className="text-slate-600">v570.xx or newer (CUDA 12.8+)</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-1">Hardware Acceleration</div>
            <div className="text-slate-600">NVENC + NVDEC Dual Encoders</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-1">Privacy & Telemetry</div>
            <div className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Offline Capable</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
