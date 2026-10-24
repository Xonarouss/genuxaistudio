import React from 'react';
import { 
  Scan, UserCheck, Link2, HardDrive, 
  Sparkles, ArrowRight 
} from 'lucide-react';

interface FeatureBentoProps {
  onOpenModelHub: () => void;
  onOpenStudio: () => void;
}

export const FeatureBento: React.FC<FeatureBentoProps> = ({ 
  onOpenModelHub, 
  onOpenStudio 
}) => {
  return (
    <section id="features" className="py-24 bg-slate-50/50 border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">
            Architected for Creative Supremacy
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Everything Required to Dominate Short-Form Video.
          </p>
          <p className="text-sm sm:text-base text-slate-600">
            A unified local stack replacing five disconnected AI tools. Zero friction from video import to final 60fps export.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: SAM 2.1 + ProPainter (Span 2 cols on md) */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-6">
                <Scan className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Stage 1 & 2 Engine
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">
                1-Click Interactive SAM 2.1 Tracking & ProPainter Clean Plate
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Never rotoscope by hand again. Hover and click any character or object in frame 1. Meta SAM 2.1 tracks the target across all frames with temporal memory, while ProPainter automatically inpaints the background clean plate to prevent ghosting artifacts.
              </p>
            </div>

            {/* Visual Micro-Interface */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mask Tracking: 30+ FPS (TensorRT)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>DWPose 133 Keypoint Skeleton</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>DepthAnything-V2 Temporal Map</span>
              </div>
            </div>
          </div>

          {/* Card 2: Persistent Character Vault */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-6">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Permanent Asset Vault
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">
                Persistent .gchar Character & Object Vault
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Save characters once, recast across hundreds of viral clips. Extracts InstantID and PuLID facial and body embeddings into portable, zero-shot <code>.gchar</code> containers with zero identity drift.
              </p>
            </div>

            <button 
              onClick={onOpenStudio}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>Explore Character Vault in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Social URL Ingestion */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-6">
                <Link2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Instant Ingest
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">
                Watermark-Free Social Importer
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Paste any YouTube Shorts, TikTok, or Instagram Reel URL. Embedded <code className="bg-slate-100 px-1 py-0.5 rounded">yt-dlp</code> and FFmpeg NVDEC decode 1080p frames directly into GPU memory with zero CPU bottleneck.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-emerald-600 font-bold">1080p NVDEC</span>
              <span>•</span>
              <span>Zero-Copy GPU Buffer</span>
            </div>
          </div>

          {/* Card 4: Local Gemma 4 AI Scene Director */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Local Intelligence
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">
                Gemma 4 Director Agent (llama.cpp)
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Your scene lighting and physics director running completely offline. Gemma 4 analyzes video keyframes and generates conditioned diffusion prompts, camera angles, and ControlNet weighting automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
              <span>Structured JSON Conditioning • 0ms API Latency</span>
            </div>
          </div>

          {/* Card 5: Smart Model Hub & Disk Deduplicator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-6">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Zero Friction Setup
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-3">
                Smart Cache Scanner & Official Model Downloader
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Already have ComfyUI, Ollama, or Hugging Face models? Genux automatically detects and SHA-256 symlinks them in seconds. Missing weights download directly from official GitHub/HF releases.
              </p>
            </div>

            <button 
              onClick={onOpenModelHub}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>Test Pre-Flight Model Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
