import React from 'react';
import { Download, BookOpen, CheckCircle2, Cpu, ExternalLink } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface HeroSectionProps {
  onDownloadExe: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onDownloadExe 
}) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden bg-white">
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      
      {/* Subtle Top Ambient Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Hardware & Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 shadow-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            GENUX ENGINE v1.0.4
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>NVIDIA RTX 12GB - 24GB • Blackwell FP8 TensorRT</span>
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.08] mb-6">
          Local AI Video Recasting.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
            100% On Your GPU.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          The high-performance local AI workstation for Windows. Import any TikTok, Instagram Reel, or YouTube video, select subjects with SAM 2.1 zero-shot tracking, and recast them with Wan 2.1 14B diffusion — 100% private, zero subscription fees, and zero cloud queues.
        </p>

        {/* Dual Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
          <button
            onClick={onDownloadExe}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md hover:shadow-xl transform active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Download for Windows (.exe)</span>
          </button>

          <a
            href="https://docs.genuxai.io"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 transition-all shadow-xs hover:shadow-md"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Documentation (docs.genuxai.io)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Trust & Performance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium mb-14">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>$0 Monthly Subscription Fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% On-Device Zero-Cloud Privacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Runs on 12GB+ VRAM (RTX 3060 - RTX 5090)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Maestro-Style Video Trimming & Scrubbing</span>
          </div>
        </div>

        {/* Interactive Before & After Visual Slider Demonstration */}
        <div className="relative">
          <BeforeAfterSlider />
        </div>
      </div>
    </section>
  );
};
