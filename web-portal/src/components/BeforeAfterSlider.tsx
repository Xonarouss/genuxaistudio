import React, { useState, useRef } from 'react';
import { Sparkles, Scan, Play, Pause, Cpu, Layers } from 'lucide-react';

interface RecastScene {
  id: string;
  title: string;
  originalLabel: string;
  recastLabel: string;
  category: string;
  fps: string;
  vram: string;
  beforeBg: string;
  afterBg: string;
}

const DEMO_SCENES: RecastScene[] = [
  {
    id: 'tokyo-drift',
    title: 'Tokyo Neon Parkour',
    originalLabel: 'Original: Street Dancer (TikTok 14M Views)',
    recastLabel: 'Recast: Obsidian Cyber-Samurai (Custom Vault)',
    category: 'Viral Street Dance',
    fps: '60 FPS (RIFE v4.22)',
    vram: '12.8 GB / 16 GB',
    beforeBg: 'from-amber-500/20 via-rose-500/10 to-indigo-900/30',
    afterBg: 'from-cyan-500/20 via-indigo-600/20 to-purple-950/40'
  },
  {
    id: 'stunt-fight',
    title: 'Acrobatic Flip Stunt',
    originalLabel: 'Original: Martial Artist (Instagram 8.2M)',
    recastLabel: 'Recast: Cyberpunk Ronin with Particle Trail',
    category: 'Action & Physics',
    fps: '60 FPS (RIFE v4.22)',
    vram: '13.4 GB / 16 GB',
    beforeBg: 'from-emerald-500/20 via-teal-500/10 to-slate-900/30',
    afterBg: 'from-violet-500/20 via-fuchsia-600/20 to-slate-950/40'
  },
  {
    id: 'fashion-walk',
    title: 'Paris Runway Stride',
    originalLabel: 'Original: Fashion Model (YouTube Shorts 22M)',
    recastLabel: 'Recast: Mech Valkyrie (Photorealistic FP8)',
    category: 'Lighting Harmonization',
    fps: '60 FPS (RIFE v4.22)',
    vram: '11.9 GB / 16 GB',
    beforeBg: 'from-sky-500/20 via-blue-500/10 to-indigo-900/30',
    afterBg: 'from-rose-500/20 via-purple-600/20 to-indigo-950/40'
  }
];

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScene = DEMO_SCENES[activeSceneIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Scene Switcher Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Render Preset:</span>
          {DEMO_SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setActiveSceneIndex(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeSceneIndex === idx
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-indigo-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {scene.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              showWireframe 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{showWireframe ? 'SAM 2 Mask: Active' : 'Mask: Hidden'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-slate-600" /> : <Play className="w-3.5 h-3.5 text-slate-600" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Comparison Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative h-[440px] md:h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xl select-none cursor-ew-resize bg-slate-950 group"
      >
        {/* RIGHT (AFTER): Recast Character */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${activeScene.afterBg} flex items-center justify-center p-6`}
        >
          {/* Stylized Visual Mockup for Recast Character */}
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            {/* Ambient Lighting Glow */}
            <div className="absolute w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 text-white shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Wan 2.1 FP8 Synthesis</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white">
                {activeScene.recastLabel.replace('Recast: ', '')}
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mb-4">
                100% of original lighting, physics & camera motion preserved. Facial micro-expressions transferred via LivePortrait.
              </p>

              <div className="grid grid-cols-3 gap-2 text-left pt-3 border-t border-slate-800">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] uppercase text-slate-400">Framerate</span>
                  <span className="text-xs font-bold text-emerald-400">60 FPS</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] uppercase text-slate-400">Inference</span>
                  <span className="text-xs font-bold text-indigo-400">TensorRT FP8</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="block text-[10px] uppercase text-slate-400">VRAM Load</span>
                  <span className="text-xs font-bold text-cyan-400">{activeScene.vram.split('/')[0]}</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                ● RECAST OUTPUT
              </span>
            </div>
          </div>
        </div>

        {/* LEFT (BEFORE): Original Clip with SAM 2 & DWPose Skeleton */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <div 
            className={`w-full h-full min-w-[320px] bg-gradient-to-br ${activeScene.beforeBg} bg-slate-900 flex items-center justify-center p-6`}
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
              {/* Wireframe SAM 2 Overlay Visual */}
              {showWireframe && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-2 border-emerald-400/80 rounded-3xl bg-emerald-500/10 relative flex flex-col items-center justify-center animate-pulse">
                    <span className="absolute -top-3 left-6 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold tracking-wider">
                      SAM 2.1 TRACKING MASK
                    </span>
                    {/* Simulated Body Pose Skeleton Points */}
                    <div className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/30 flex items-center justify-center mb-6">
                      <div className="w-3 h-3 rounded-full bg-cyan-300" />
                    </div>
                    <div className="w-1 h-24 bg-cyan-400/80 mb-2 relative">
                      <div className="absolute top-4 -left-12 w-24 h-0.5 bg-cyan-400/80" />
                    </div>
                    <div className="flex gap-12">
                      <div className="w-1 h-20 bg-cyan-400/80" />
                      <div className="w-1 h-20 bg-cyan-400/80" />
                    </div>
                    <span className="absolute -bottom-3 right-6 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-bold">
                      DWPose Bones: 133 Keypoints
                    </span>
                  </div>
                </div>
              )}

              <div className="relative z-10 max-w-md p-6 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white shadow-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium mb-3">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Original Ingested Stream</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white">
                  {activeScene.originalLabel.replace('Original: ', '')}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mb-4">
                  Deconstructed via NVDEC hardware decoder directly into CUDA pointers. Automatic clean-plate inpainting via ProPainter.
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <span>Target Selected: Person (ID #01)</span>
                  <span>•</span>
                  <span>Confidence: 99.4%</span>
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700 backdrop-blur-sm">
                  ● ORIGINAL SOURCE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Central Vertical Draggable Divider */}
        <div
          className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.7)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Thumb / Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-indigo-600">
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-3.5 bg-slate-800 rounded-full" />
              <div className="w-1 h-3.5 bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom Status Ticker */}
        <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] text-white/70 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
          <div className="flex items-center gap-2 font-mono">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>NVDEC Pipe: Active</span>
            <span>|</span>
            <span>Temporal Overlap: Blended</span>
          </div>
          <div className="hidden sm:block text-slate-400">
            Drag slider left/right to inspect recasting fidelity
          </div>
        </div>
      </div>
    </div>
  );
};
