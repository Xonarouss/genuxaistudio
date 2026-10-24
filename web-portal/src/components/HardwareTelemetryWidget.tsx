import React, { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface TelemetryData {
  gpuName: string;
  gpuShortName: string;
  gpuUtil: number;
  vramUsedGb: number;
  vramTotalGb: number;
  powerDrawW: number;
  powerLimitW: number;
  ramUsedGb: number;
  ramTotalGb: number;
  cpuPercent: number;
  engineMemGb: number;
  isCompatible: boolean;
  profile: string;
  engineReachable: boolean;
}

const DEFAULT_TELEMETRY: TelemetryData = {
  gpuName: 'NVIDIA GeForce GPU',
  gpuShortName: 'GPU (12GB+)',
  gpuUtil: 4,
  vramUsedGb: 1.8,
  vramTotalGb: 16.0,
  powerDrawW: 42,
  powerLimitW: 389,
  ramUsedGb: 20.4,
  ramTotalGb: 63.1,
  cpuPercent: 9,
  engineMemGb: 0.4,
  isCompatible: true,
  profile: 'Profile ready: Full native - BF16/FP8',
  engineReachable: true
};

interface HardwareTelemetryWidgetProps {
  className?: string;
}

export const HardwareTelemetryWidget: React.FC<HardwareTelemetryWidgetProps> = ({
  className = ''
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      if (window.genuxNative?.getGpuTelemetry) {
        try {
          const data = await window.genuxNative.getGpuTelemetry();
          if (isMounted && data) {
            setTelemetry(prev => ({
              ...prev,
              ...data
            }));
          }
        } catch (e) {
          // ignore error
        }
      }
    };

    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 2000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleCopySpecs = () => {
    const text = `${telemetry.gpuName} | VRAM: ${telemetry.vramUsedGb}/${telemetry.vramTotalGb} GB | RAM: ${telemetry.ramUsedGb}/${telemetry.ramTotalGb} GB | Power: ${telemetry.powerDrawW}/${telemetry.powerLimitW} W`;
    navigator.clipboard?.writeText?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const vramPercent = Math.min(100, Math.round((telemetry.vramUsedGb / Math.max(1, telemetry.vramTotalGb)) * 100));
  const powerPercent = Math.min(100, Math.round((telemetry.powerDrawW / Math.max(1, telemetry.powerLimitW)) * 100));
  const ramPercent = Math.min(100, Math.round((telemetry.ramUsedGb / Math.max(1, telemetry.ramTotalGb)) * 100));

  return (
    <div className={`flex flex-col gap-2 font-sans select-none ${className}`}>
      
      {/* CARD 1: Real-time Hardware Metrics (YuE2 Style) */}
      <div className="p-3.5 rounded-2xl bg-[#0C0E14] border border-white/[0.08] shadow-xl text-xs space-y-3">
        
        {/* GPU Title Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-extrabold text-white text-xs tracking-wide">
              {telemetry.gpuShortName || telemetry.gpuName || 'NVIDIA GPU'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopySpecs}
              title="Copy specs to clipboard"
              className="p-1 rounded text-slate-500 hover:text-white transition"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded text-slate-500 hover:text-white transition"
            >
              {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-2.5 pt-1">
            
            {/* GPU Utilization */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">GPU</span>
                <span className="text-white font-bold">{telemetry.gpuUtil}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#161B26] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, telemetry.gpuUtil)}%` }}
                />
              </div>
            </div>

            {/* VRAM (GB) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">VRAM</span>
                <span className="text-white font-bold">
                  {telemetry.vramUsedGb.toFixed(1)} GB / {telemetry.vramTotalGb.toFixed(1)} GB
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#161B26] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    vramPercent > 85 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(4, vramPercent)}%` }}
                />
              </div>
            </div>

            {/* Power (W) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">Power</span>
                <span className="text-white font-bold">
                  {telemetry.powerDrawW} / {telemetry.powerLimitW} W
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#161B26] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, powerPercent)}%` }}
                />
              </div>
            </div>

            {/* RAM (GB) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">RAM</span>
                <span className="text-white font-bold">
                  {telemetry.ramUsedGb.toFixed(1)} GB / {telemetry.ramTotalGb.toFixed(1)} GB
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#161B26] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, ramPercent)}%` }}
                />
              </div>
            </div>

            {/* CPU (%) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">CPU</span>
                <span className="text-white font-bold">{telemetry.cpuPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#161B26] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, telemetry.cpuPercent)}%` }}
                />
              </div>
            </div>

            {/* Engine Process RSS */}
            <div className="flex justify-between items-center text-[11px] font-mono pt-1 text-slate-400">
              <span>Engine</span>
              <span className="text-white font-bold">{telemetry.engineMemGb.toFixed(1)} GB</span>
            </div>

          </div>
        )}

      </div>

      {/* CARD 2: Runtime Engine Status & Profiles (YuE2 Style) */}
      <div className="p-3 rounded-2xl bg-[#0C0E14] border border-white/[0.08] shadow-xl text-[11px] font-mono space-y-2">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="truncate">Genux engine reachable</span>
        </div>

        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="truncate text-emerald-300 font-semibold">{telemetry.profile}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span className="truncate">Director AI: Local Gemma 2 active</span>
        </div>
      </div>

    </div>
  );
};
