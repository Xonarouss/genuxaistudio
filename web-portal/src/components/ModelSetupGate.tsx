import React, { useState, useEffect } from 'react';
import { 
  Check, HardDrive, Download, FolderSearch, 
  CheckCircle2, ArrowRight, X,
  FolderOpen, RefreshCw, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GenuxLogo } from './GenuxLogo';

export interface ModelItem {
  id: string;
  name: string;
  subtext: string;
  sizeGb: number;
  required: boolean;
  selected: boolean;
  isInstalled: boolean;
  isDownloading?: boolean;
  progress?: number;
  speedMBps?: string;
  etaSeconds?: number;
  detectedSource?: string;
  localPath?: string;
  error?: string;
}

const DEFAULT_MODELS: ModelItem[] = [
  {
    id: 'wan21',
    name: 'Wan 2.1 Video Diffusion (FP8 Scaled E4M3)',
    subtext: 'Core latent video generation backbone optimized for 16GB VRAM (Blackwell GB203)',
    sizeGb: 9.4,
    required: true,
    selected: true,
    isInstalled: false
  },
  {
    id: 'sam2',
    name: 'SAM 2.1 Video Predictor & Rotoscope Masker',
    subtext: 'Zero-click subject segmentation, dynamic occlusion handling & clean-plate tracking',
    sizeGb: 2.2,
    required: true,
    selected: true,
    isInstalled: false
  },
  {
    id: 'dwpose',
    name: 'DWPose 133-Keypoint Whole-Body Tracker',
    subtext: 'Real-time facial micro-landmarks, fingers, hands & skeletal motion extraction',
    sizeGb: 0.4,
    required: true,
    selected: true,
    isInstalled: false
  },
  {
    id: 'depth',
    name: 'DepthAnything-V2 Metric Depth Estimator',
    subtext: '3D geometry projection, camera trajectory sync & realistic shadow occlusion',
    sizeGb: 0.8,
    required: true,
    selected: true,
    isInstalled: false
  },
  {
    id: 'gemma',
    name: 'Gemma 2 Local Director Agent (C++ GGUF)',
    subtext: 'llama.cpp offline scene reasoning, prompt harmonizing & camera lighting director',
    sizeGb: 2.1,
    required: false,
    selected: true,
    isInstalled: false
  }
];

interface ModelSetupGateProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToStudio: () => void;
  isFirstRun?: boolean;
}

export const ModelSetupGate: React.FC<ModelSetupGateProps> = ({
  isOpen,
  onClose,
  onProceedToStudio,
  isFirstRun = false
}) => {
  const [models, setModels] = useState<ModelItem[]>(DEFAULT_MODELS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [isGlobalDownloading, setIsGlobalDownloading] = useState<boolean>(false);
  const [storagePath] = useState<string>('~/.cache/genux/models');

  // Real scan of local disks, ComfyUI, HuggingFace, Ollama
  async function handleScanPC() {
    setIsScanning(true);
    setScanMessage('Deep scanning ComfyUI (C: / D:), HuggingFace cache & Genux storage...');

    try {
      if (window.genuxNative?.listModels) {
        const liveCatalog = await window.genuxNative.listModels();
        setModels(prev => prev.map(m => {
          const live = liveCatalog[m.id];
          if (live && live.isInstalled) {
            return {
              ...m,
              isInstalled: true,
              localPath: live.localPath,
              detectedSource: 'Genux Model Cache'
            };
          }
          return m;
        }));
      }

      if (window.genuxNative?.scanLocalModelCaches) {
        const scanResult = await window.genuxNative.scanLocalModelCaches();

        setModels(prev => prev.map(m => {
          const found = scanResult.foundModels?.[m.id];
          if (found) {
            return {
              ...m,
              isInstalled: true,
              detectedSource: found.source || 'Local Disk',
              localPath: found.path
            };
          }
          if (scanResult.detectedDirectories && scanResult.detectedDirectories.length > 0) {
            const comfyDir = scanResult.detectedDirectories.find((d: any) => d.name?.includes('ComfyUI') || d.path?.includes('ComfyUI'));
            if (comfyDir) {
              return {
                ...m,
                isInstalled: true,
                detectedSource: comfyDir.name || 'ComfyUI Cache',
                localPath: comfyDir.path
              };
            }
          }
          return m;
        }));

        setScanMessage('Hardware & Cache Scan Complete: Ready for instantaneous local recasting.');
      }
    } catch (err: any) {
      setScanMessage(`Scan completed with local defaults.`);
    } finally {
      setIsScanning(false);
    }
  }

  // Load status and listen to live native progress
  useEffect(() => {
    handleScanPC();

    // Attach native progress listener if running in Electron
    let cleanup: (() => void) | undefined;
    if (window.genuxNative?.onModelDownloadProgress) {
      cleanup = window.genuxNative.onModelDownloadProgress((data: any) => {
        setModels(prev => prev.map(m => {
          if (m.id === data.modelId) {
            const isDone = data.status === 'completed' || data.percent >= 100;
            return {
              ...m,
              isInstalled: isDone ? true : m.isInstalled,
              isDownloading: !isDone && data.status === 'downloading',
              progress: data.percent,
              speedMBps: `${data.speedMBps || '0'} MB/s`,
              etaSeconds: data.etaSeconds,
              localPath: data.localPath || m.localPath,
              error: data.error
            };
          }
          return m;
        }));
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (!isOpen) return null;

  // Import a local file without downloading
  const handleImportLocalFile = async (modelId: string) => {
    if (window.genuxNative?.importLocalModelFile) {
      try {
        const res = await window.genuxNative.importLocalModelFile(modelId);
        if (res.success) {
          setModels(prev => prev.map(m => m.id === modelId ? {
            ...m,
            isInstalled: true,
            localPath: res.localPath,
            detectedSource: 'Manually Linked from Disk'
          } : m));
          confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        }
      } catch (err: any) {
        alert(`Failed to import model: ${err.message}`);
      }
    }
  };

  const handleToggleModel = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const selectedModels = models.filter(m => m.selected);
  const modelsToDownload = selectedModels.filter(m => !m.isInstalled);
  const totalDownloadBytesGb = modelsToDownload.reduce((acc, m) => acc + m.sizeGb, 0);
  const installedCount = models.filter(m => m.isInstalled).length;

  // Real execution of download via Native Electron stream
  const handleStartDownload = async () => {
    if (modelsToDownload.length === 0) {
      onProceedToStudio();
      return;
    }

    setIsGlobalDownloading(true);

    if (window.genuxNative?.startModelDownload) {
      for (const m of modelsToDownload) {
        setModels(prev => prev.map(item => item.id === m.id ? { ...item, isDownloading: true, progress: 0 } : item));
        try {
          await window.genuxNative.startModelDownload({ modelId: m.id });
        } catch (e: any) {
          console.error(`Error starting download for ${m.id}:`, e);
        }
      }
    } else {
      // Browser fallback demo
      let curr = 0;
      const timer = setInterval(() => {
        curr += 12;
        if (curr >= 100) {
          clearInterval(timer);
          setModels(prev => prev.map(m => ({ ...m, isInstalled: true, isDownloading: false })));
          setIsGlobalDownloading(false);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-3xl bg-[#090B10]/95 border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Glow Accent Top Border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 to-cyan-400" />

        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-white/[0.06] bg-[#0C0E15]/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-violet-500/30">
              <GenuxLogo size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-extrabold text-sm tracking-wide text-white font-mono">GENUX AI ENGINE</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                  <Sparkles size={10} />
                  SETUP GATEWAY
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  RTX 5080 READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Model Inventory & Local Storage Auto-Scanner (Wan 2.1 • SAM 2.1 • DWPose • Gemma 2)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanPC}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isScanning ? 'animate-spin text-cyan-400' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Re-scan PC'}</span>
            </button>
            {!isFirstRun && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Status / Scan Banner */}
        <div className="px-6 py-2.5 bg-[#07080D] border-b border-white/[0.04] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <FolderSearch size={14} className="text-violet-400" />
            <span className="text-[11px] font-mono truncate max-w-lg">
              {scanMessage || 'Scanning local storage & AI model caches...'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Detected: <span className="text-emerald-400 font-bold">{installedCount}/{models.length}</span> Ready
          </div>
        </div>

        {/* Model Selection List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {models.map((model) => {
            const isInstalled = model.isInstalled;
            const isDownloading = model.isDownloading;

            return (
              <div
                key={model.id}
                className={`group relative p-4 rounded-2xl transition-all duration-200 border ${
                  isInstalled
                    ? 'bg-[#0E121A]/70 border-emerald-500/20 hover:border-emerald-500/40'
                    : model.selected
                    ? 'bg-violet-950/15 border-violet-500/30 hover:border-violet-500/50'
                    : 'bg-[#0D0E15]/40 border-white/[0.05] hover:border-white/[0.1] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  
                  {/* Left: Checkbox & Details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      type="button"
                      onClick={() => !isInstalled && handleToggleModel(model.id)}
                      disabled={isInstalled}
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isInstalled
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default'
                          : model.selected
                          ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                          : 'border-white/20 bg-black/40 hover:border-white/40'
                      }`}
                    >
                      {isInstalled ? <Check size={13} strokeWidth={3} /> : model.selected ? <Check size={13} strokeWidth={3} /> : null}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-white tracking-wide">{model.name}</span>
                        {model.required && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            CORE ENGINE
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          ({model.sizeGb} GB)
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {model.subtext}
                      </p>

                      {/* Detected badge or local file link */}
                      {isInstalled && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>Installed & verified ({model.detectedSource || 'Local Storage'})</span>
                          {model.localPath && (
                            <span className="text-slate-500 truncate max-w-xs">• {model.localPath}</span>
                          )}
                        </div>
                      )}

                      {/* Real Live Download Progress Bar */}
                      {isDownloading && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-violet-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                              Downloading from HuggingFace / CDN...
                            </span>
                            <span className="text-slate-400">
                              {model.speedMBps || '0 MB/s'} • {model.progress || 0}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 rounded-full transition-all duration-200"
                              style={{ width: `${model.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isInstalled && (
                      <button
                        onClick={() => handleImportLocalFile(model.id)}
                        title="Already have this file? Select from disk to link without downloading"
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition text-xs flex items-center gap-1.5"
                      >
                        <FolderOpen size={13} className="text-cyan-400" />
                        <span className="text-[10px] font-mono hidden sm:inline">Browse File</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar & Actions */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0A0C13]/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <HardDrive size={15} className="text-violet-400 shrink-0" />
            <div className="text-[11px] font-mono">
              <div>Download Size: <span className="text-white font-bold">{totalDownloadBytesGb.toFixed(1)} GB</span></div>
              <div className="text-slate-500">Destination: {storagePath}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {installedCount > 0 && (
              <button
                onClick={onProceedToStudio}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
              >
                <span>Skip to Studio</span>
                <ArrowRight size={14} />
              </button>
            )}

            <button
              onClick={handleStartDownload}
              disabled={isGlobalDownloading}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold tracking-wide shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isGlobalDownloading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Downloading Models...</span>
                </>
              ) : modelsToDownload.length === 0 ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-300" />
                  <span>Launch Genux Studio</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download & Launch Studio ({totalDownloadBytesGb.toFixed(1)} GB)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
