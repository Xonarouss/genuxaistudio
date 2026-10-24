import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Sparkles, Layers, Sliders } from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const recastVideoRef = useRef<HTMLVideoElement>(null);

  // Synchronize playback between original and recast videos
  const syncPlayback = useCallback(() => {
    const orig = originalVideoRef.current;
    const recast = recastVideoRef.current;
    if (!orig || !recast) return;

    if (isPlaying) {
      orig.play().catch(() => {});
      recast.play().catch(() => {});
    } else {
      orig.pause();
      recast.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    syncPlayback();
  }, [syncPlayback]);

  // Keep video time in sync if drift occurs
  const handleTimeUpdate = () => {
    const orig = originalVideoRef.current;
    const recast = recastVideoRef.current;
    if (!orig || !recast) return;
    if (Math.abs(orig.currentTime - recast.currentTime) > 0.15) {
      recast.currentTime = orig.currentTime;
    }
  };

  const updateSliderPos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(clampedPct);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSliderPos(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateSliderPos(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSliderPos(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateSliderPos(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Header Controls & Info */}
      <div className="w-full max-w-[440px] flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Wan 2.1 + SAM 2.1 Live Recast</span>
          </div>
        </div>

        <button
          onClick={togglePlay}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs transition cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-slate-600" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-slate-600" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>

      {/* Main 9:16 Vertical Video Frame (Fits Vertical TikTok/Reels Aspect Ratio 100% Perfectly) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[420px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-black cursor-ew-resize group"
      >
        {/* RIGHT LAYER (RECAST OUTPUT): Full width background video */}
        <video
          ref={recastVideoRef}
          src="/videos/recast.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Recast Badge */}
        <div className="absolute top-4 right-4 pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600/90 text-white border border-indigo-400/40 backdrop-blur-md shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>RECAST OUTPUT</span>
          </span>
        </div>

        {/* LEFT LAYER (ORIGINAL SOURCE): Clipped video synchronized on top */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <div
            className="h-full relative overflow-hidden"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '420px' }}
          >
            <video
              ref={originalVideoRef}
              src="/videos/original.mp4"
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Original Source Badge */}
            <div className="absolute top-4 left-4 pointer-events-none z-10">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/85 text-slate-200 border border-slate-700/60 backdrop-blur-md shadow-lg flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>ORIGINAL SOURCE</span>
              </span>
            </div>
          </div>
        </div>

        {/* Central Vertical Draggable Slider Line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] pointer-events-none z-20"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Thumb / Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-indigo-600 transition-transform group-hover:scale-110">
            <Sliders className="w-4 h-4 text-indigo-600 rotate-90" />
          </div>
        </div>

        {/* Subtle Bottom Instruction Bar */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-white/80 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none z-10 font-mono">
          <span>1:1 Motion Fidelity</span>
          <span className="text-[10px] text-slate-400">Drag left/right to compare</span>
        </div>
      </div>
    </div>
  );
};
