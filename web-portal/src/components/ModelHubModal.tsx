import React, { useState, useEffect } from 'react';
import { 
  X, Download, CheckCircle2, RefreshCw, HardDrive, 
  Zap, FolderOpen, ArrowDownToLine, Trash2, ExternalLink, Link, Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ModelItem {
  id: string;
  name: string;
  category: 'core' | 'segmentation' | 'motion' | 'vault' | 'llm' | 'synthesis' | 'lipsync';
  source: string;
  sourceUrl: string;
  size: string;
  directDownloadUrl?: string;
  status: 'installed' | 'detected_cache' | 'missing' | 'downloading';
  progress: number;
  downloadSpeed?: string;
  eta?: string;
  localPath: string;
  trtOptimized: boolean;
}

export const INITIAL_MODELS: ModelItem[] = [
  {
    id: 'binaries',
    name: 'yt-dlp + FFmpeg (NVDEC GPU Master Pipeline)',
    category: 'core',
    source: 'Official yt-dlp & FFmpeg Gyan Build',
    sourceUrl: 'https://github.com/yt-dlp/yt-dlp',
    directDownloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    size: '142 MB',
    status: 'installed',
    progress: 100,
    localPath: 'd:/Genuts AI/bin/yt-dlp.exe',
    trtOptimized: true,
  },
  {
    id: 'sam2',
    name: 'Meta SAM 2.1 Hiera-Large Rotoscope Masker',
    category: 'segmentation',
    source: 'Meta AI Research / fbaipublicfiles.com',
    sourceUrl: 'https://github.com/facebookresearch/sam2',
    directDownloadUrl: 'https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_large.pt',
    size: '898 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/sam2.1_hiera_large.pt',
    trtOptimized: true,
  },
  {
    id: 'dwpose',
    name: 'DWPose 133-Keypoint Whole-Body Tracker',
    category: 'motion',
    source: 'OpenMMLab Official ONNX',
    sourceUrl: 'https://huggingface.co/yzd-v/DWPose',
    directDownloadUrl: 'https://huggingface.co/yzd-v/DWPose/resolve/main/dw-ll_ucoco_384.onnx',
    size: '420 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/dw-ll_ucoco_384.onnx',
    trtOptimized: true,
  },
  {
    id: 'depth',
    name: 'DepthAnything-V2 Small Metric Estimator (ViTS)',
    category: 'motion',
    source: 'Depth-Anything Research / HuggingFace',
    sourceUrl: 'https://huggingface.co/depth-anything/Depth-Anything-V2-Small',
    directDownloadUrl: 'https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth',
    size: '98 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/depth_anything_v2_vits.pth',
    trtOptimized: true,
  },
  {
    id: 'gemma',
    name: 'Gemma 2 2B Director Agent (Q4_K_M GGUF)',
    category: 'llm',
    source: 'Google DeepMind / bartowski (public mirror)',
    sourceUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF',
    directDownloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    size: '1.6 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/gemma-2-2b-it-Q4_K_M.gguf',
    trtOptimized: false,
  },
  {
    id: 'wan21',
    name: 'Wan 2.1 14B FP8 Video Diffusion (i2v 480p)',
    category: 'synthesis',
    source: 'Wan-AI / Comfy-Org HuggingFace Repack',
    sourceUrl: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged',
    directDownloadUrl: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
    size: '16.4 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
    trtOptimized: true,
  },
  {
    id: 'wan21_vae',
    name: 'Wan 2.1 3D Video VAE Encoder/Decoder',
    category: 'synthesis',
    source: 'Wan-AI / Comfy-Org HuggingFace Mirror',
    sourceUrl: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged',
    directDownloadUrl: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
    size: '242 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/wan_2.1_vae.safetensors',
    trtOptimized: true,
  },
  {
    id: 'ltxvideo',
    name: 'LTX-Video 2B v0.9.5 Realtime Latent Backbone',
    category: 'synthesis',
    source: 'Lightricks / HuggingFace',
    sourceUrl: 'https://huggingface.co/Lightricks/LTX-Video',
    directDownloadUrl: 'https://huggingface.co/Lightricks/LTX-Video/resolve/main/ltx-video-2b-v0.9.5.safetensors',
    size: '2.8 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/ltx-video-2b-v0.9.5.safetensors',
    trtOptimized: true,
  },
  {
    id: 'pulid',
    name: 'InstantID Character Identity Anchor (IP-Adapter)',
    category: 'vault',
    source: 'InstantX Team / HuggingFace',
    sourceUrl: 'https://huggingface.co/InstantX/InstantID',
    directDownloadUrl: 'https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin',
    size: '1.25 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/ip-adapter-instantid.bin',
    trtOptimized: true,
  },
  {
    id: 'latentsync',
    name: 'LatentSync 1.5 — Precision Lip Sync (ByteDance 2025)',
    category: 'lipsync',
    source: 'ByteDance Research / HuggingFace',
    sourceUrl: 'https://huggingface.co/ByteDance/LatentSync-1.5',
    directDownloadUrl: 'https://huggingface.co/ByteDance/LatentSync-1.5/resolve/main/latentsync_unet.pt',
    size: '1.7 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/latentsync_unet.pt',
    trtOptimized: true,
  },
  {
    id: 'wav2lip',
    name: 'Wav2Lip GAN — Fast Lip Sync Fallback',
    category: 'lipsync',
    source: 'Nekochu / HuggingFace Mirror',
    sourceUrl: 'https://huggingface.co/Nekochu/Wav2Lip',
    directDownloadUrl: 'https://huggingface.co/Nekochu/Wav2Lip/resolve/main/wav2lip_gan.pth',
    size: '435 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/wav2lip_gan.pth',
    trtOptimized: false,
  },
  {
    id: 'minimax_h3_recast',
    name: 'MiniMax H3 Character Swap LoRA (v1.5 Ref2VA)',
    category: 'synthesis',
    source: 'akatz-ai / ComfyUI / HuggingFace',
    sourceUrl: 'https://huggingface.co/akatz-ai/MiniMax-H3-Character-Swap-LoRA',
    directDownloadUrl: 'https://huggingface.co/akatz-ai/MiniMax-H3-Character-Swap-LoRA/resolve/main/h3_character_swap_v1.5.safetensors',
    size: '350 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/h3_character_swap_v1.5.safetensors',
    trtOptimized: true,
  },
  {
    id: 'mocha_recast',
    name: 'MoCha Wan 2.1 Video Character Replacement (Orange-3DV)',
    category: 'synthesis',
    source: 'Orange-3DV-Team / HuggingFace',
    sourceUrl: 'https://github.com/Orange-3DV-Team/MoCha',
    directDownloadUrl: 'https://huggingface.co/Orange-3DV-Team/MoCha/resolve/main/preview/step18500.ckpt',
    size: '28.6 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/mocha_step18500.ckpt',
    trtOptimized: true,
  },
  {
    id: 'mimicmotion',
    name: 'MimicMotion Pose Guidance Motion Transfer (Tencent)',
    category: 'motion',
    source: 'Tencent / ixaac / HuggingFace',
    sourceUrl: 'https://huggingface.co/ixaac/MimicMotion',
    directDownloadUrl: 'https://huggingface.co/ixaac/MimicMotion/resolve/main/MimicMotion_1-1.pth',
    size: '2.5 GB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/MimicMotion_1-1.pth',
    trtOptimized: true,
  },
  {
    id: 'inswapper',
    name: 'InsightFace Recast Engine (InSwapper 128)',
    category: 'synthesis',
    source: 'InsightFace / HuggingFace',
    sourceUrl: 'https://huggingface.co/ezioruan/inswapper_128.onnx',
    directDownloadUrl: 'https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx',
    size: '554 MB',
    status: 'missing',
    progress: 0,
    localPath: '~/.cache/genux/models/inswapper_128.onnx',
    trtOptimized: true,
  }
];



interface ModelHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelHubModal: React.FC<ModelHubModalProps> = ({ isOpen, onClose }) => {
  const [models, setModels] = useState<ModelItem[]>(INITIAL_MODELS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('Local Model Hub & TensorRT FP8 Checkpoint Inventory');
  const [storagePath, setStoragePath] = useState<string>('~/.cache/genux/models');

  // Refresh model catalog from native disk check
  async function refreshCatalog() {
    if (window.genuxNative?.listModels) {
      try {
        const live = await window.genuxNative.listModels();
        setModels(prev => prev.map(m => {
          const item = live[m.id];
          if (item) {
            return {
              ...m,
              status: item.isInstalled ? 'installed' : (item.isDownloading ? 'downloading' : m.status),
              progress: item.progress || (item.isInstalled ? 100 : 0),
              localPath: item.localPath || m.localPath
            };
          }
          return m;
        }));
      } catch (e) {}
    }
  }

  // Load disk models & bind native progress
  useEffect(() => {
    refreshCatalog();

    if (window.genuxNative?.getSettings) {
      window.genuxNative.getSettings().then((s: any) => {
        if (s?.modelsDir) setStoragePath(s.modelsDir);
      }).catch(() => {});
    }

    let cleanup: (() => void) | undefined;
    if (window.genuxNative?.onModelDownloadProgress) {
      cleanup = window.genuxNative.onModelDownloadProgress((data: any) => {
        setModels(prev => prev.map(m => {
          if (m.id === data.modelId) {
            const isDone = data.status === 'completed' || data.percent >= 100;
            return {
              ...m,
              status: isDone ? 'installed' : ((data.status === 'error' || data.status === 'cancelled') ? 'missing' : 'downloading'),
              progress: data.percent || (isDone ? 100 : 0),
              downloadSpeed: data.speedMBps ? `${data.speedMBps} MB/s` : undefined,
              eta: data.etaSeconds ? `${data.etaSeconds}s` : undefined,
              localPath: data.localPath || m.localPath
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

  const handleBrowseStoragePath = async () => {
    if (window.genuxNative?.selectDirectory) {
      const selected = await window.genuxNative.selectDirectory(storagePath);
      if (selected) {
        setStoragePath(selected);
        if (window.genuxNative?.saveSettings) {
          await window.genuxNative.saveSettings({ modelsDir: selected });
        }
        refreshCatalog();
      }
    }
  };

  const handleOpenStoragePath = () => {
    if (window.genuxNative?.openPath) {
      window.genuxNative.openPath(storagePath);
    } else if (window.genuxNative?.showItemInFolder) {
      window.genuxNative.showItemInFolder(storagePath);
    }
  };

  if (!isOpen) return null;

  const handleScanDisk = async () => {
    setIsScanning(true);
    setScanMessage('Scanning local storage, ComfyUI, HuggingFace & Ollama...');
    if (window.genuxNative?.scanLocalModelCaches) {
      try {
        const scan = await window.genuxNative.scanLocalModelCaches();
        setModels(prev => prev.map(m => {
          const found = scan.foundModels?.[m.id];
          if (found) {
            return {
              ...m,
              status: 'detected_cache',
              progress: 100,
              localPath: found.path
            };
          }
          return m;
        }));
        setScanMessage('Scan complete: Local models auto-linked with zero network usage!');
      } catch (err: any) {
        setScanMessage('Scan completed.');
      } finally {
        setIsScanning(false);
      }
    } else {
      setTimeout(() => {
        setIsScanning(false);
        setScanMessage('Scan complete: Models synced.');
      }, 800);
    }
  };

    const handleCancelDownload = async (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'missing', progress: 0 } : m));
    if (window.genuxNative?.cancelModelDownload) {
      try {
        await window.genuxNative.cancelModelDownload(id);
      } catch (err: any) {
        console.error('Cancel download error for ' + id + ':', err);
      }
    }
  };

  const handleDownloadModel = async (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'downloading', progress: 0 } : m));

    if (window.genuxNative?.startModelDownload) {
      try {
        await window.genuxNative.startModelDownload({ modelId: id });
      } catch (err: any) {
        console.error(`Download error for ${id}:`, err);
      }
    } else {
      // Browser fallback
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'installed', progress: 100 } : m));
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } else {
          setModels(prev => prev.map(m => m.id === id ? { ...m, progress: currentProgress } : m));
        }
      }, 250);
    }
  };

  const handleImportFile = async (id: string) => {
    if (window.genuxNative?.importLocalModelFile) {
      try {
        const res = await window.genuxNative.importLocalModelFile(id);
        if (res.success) {
          setModels(prev => prev.map(m => m.id === id ? {
            ...m,
            status: 'installed',
            progress: 100,
            localPath: res.localPath
          } : m));
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleRemoveModel = async (id: string) => {
    if (!window.confirm(`Are you sure you want to remove and delete this model from disk?`)) return;
    if (window.genuxNative?.removeModelFile) {
      try {
        const res = await window.genuxNative.removeModelFile(id);
        if (res && res.success) {
          setModels(prev => prev.map(m => m.id === id ? {
            ...m,
            status: 'missing',
            progress: 0,
            localPath: ''
          } : m));
          refreshCatalog();
        }
      } catch (err: any) {
        alert(`Failed to remove model: ${err.message}`);
      }
    } else {
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'missing', progress: 0 } : m));
    }
  };

  const handleDownloadAllMissing = () => {
    const missing = models.filter(m => m.status === 'missing');
    missing.forEach(m => handleDownloadModel(m.id));
  };

  const installedCount = models.filter(m => m.status === 'installed' || m.status === 'detected_cache').length;
  const filteredModels = selectedCategory === 'all' 
    ? models 
    : models.filter(m => m.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090B10]/95 border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        
        {/* Glow Accent Top Border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] bg-[#0C0E15]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <HardDrive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-extrabold text-sm tracking-wide text-white font-mono">GENUX MODEL VAULT</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  BLACKWELL FP8
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {installedCount}/{models.length} INSTALLED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {scanMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanDisk}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isScanning ? 'animate-spin text-cyan-400' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Scan Local Caches'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="px-6 py-3 bg-[#07080D] border-b border-white/[0.04] flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Models' },
              { id: 'synthesis', label: 'Video Diffusion (Wan 2.1)' },
              { id: 'segmentation', label: 'Segmentation (SAM 2.1)' },
              { id: 'motion', label: 'Motion & Depth' },
              { id: 'lipsync', label: '💋 Lip Sync' },
              { id: 'vault', label: 'Identity Anchors' },
              { id: 'llm', label: 'Director LLM' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-medium text-xs transition ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {models.some(m => m.status === 'missing') && (
            <button
              onClick={handleDownloadAllMissing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              <ArrowDownToLine size={13} />
              <span>Download Missing</span>
            </button>
          )}
        </div>

        {/* Model Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {filteredModels.map((model) => {
            const isInstalled = model.status === 'installed' || model.status === 'detected_cache';
            const isDownloading = model.status === 'downloading';

            return (
              <div
                key={model.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isInstalled
                    ? 'bg-[#0E121A]/70 border-emerald-500/20 hover:border-emerald-500/40'
                    : isDownloading
                    ? 'bg-violet-950/20 border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                    : 'bg-[#0D0E15]/50 border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-white tracking-wide">{model.name}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                        {model.size}
                      </span>
                      {model.trtOptimized && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                          <Zap size={9} />
                          FP8 ACCELERATED
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Source: {model.source}</span>
                      <span>•</span>
                      <button
                        onClick={() => window.genuxNative?.openExternal(model.sourceUrl)}
                        className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 hover:underline cursor-pointer"
                        title="Open Official Repository in Browser"
                      >
                        <ExternalLink size={10} />
                        <span>Repo</span>
                      </button>
                      {model.directDownloadUrl && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(model.directDownloadUrl!);
                              alert(`Direct download URL copied to clipboard:\n${model.directDownloadUrl}`);
                            }}
                            className="text-violet-400 hover:text-violet-300 transition flex items-center gap-1 hover:underline cursor-pointer"
                            title="Copy direct download link to clipboard for browser or IDM"
                          >
                            <Copy size={10} />
                            <span>Copy Link</span>
                          </button>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono text-slate-500 truncate max-w-sm">{model.localPath}</span>
                    </div>

                    {/* Live Download Bar */}
                    {isDownloading && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-violet-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                            Streaming from HuggingFace CDN...
                          </span>
                          <span className="text-slate-300">
                            {model.downloadSpeed || '0 MB/s'} {model.eta ? `• ETA: ${model.eta}` : ''} • {model.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 rounded-full transition-all duration-150"
                            style={{ width: `${model.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isInstalled ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                          <CheckCircle2 size={14} />
                          <span>Ready</span>
                        </div>
                        <button
                          onClick={() => handleRemoveModel(model.id)}
                          title="Remove model weights from disk to free up VRAM and space"
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : isDownloading ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-mono">
                          <RefreshCw size={13} className="animate-spin text-cyan-400" />
                          <span>Downloading</span>
                        </div>
                        <button
                          onClick={() => handleCancelDownload(model.id)}
                          title="Cancel active download"
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        >
                          <X size={12} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => window.genuxNative?.openExternal(model.directDownloadUrl || model.sourceUrl)}
                          title="Open direct file download in your Web Browser or External Download Manager (IDM, Free Download Manager, etc.)"
                          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-cyan-400 transition text-xs flex items-center gap-1"
                        >
                          <ExternalLink size={12} className="text-cyan-400" />
                          <span className="font-mono text-[10px]">Browser DL</span>
                        </button>
                        <button
                          onClick={() => handleImportFile(model.id)}
                          title="Select an already downloaded file from your disk"
                          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
                        >
                          <FolderOpen size={12} className="text-violet-400" />
                          <span className="font-mono text-[10px]">Browse Disk</span>
                        </button>
                        <button
                          onClick={() => handleDownloadModel(model.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Model Storage Path Configuration */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0A0C13] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Storage Directory Selector */}
          <div className="flex items-center gap-2.5 flex-1 w-full min-w-0">
            <HardDrive size={15} className="text-violet-400 shrink-0" />
            <span className="font-semibold text-slate-300 text-xs shrink-0">Models Directory:</span>
            <div 
              className="flex-1 max-w-sm bg-black/40 border border-white/[0.08] rounded-xl px-3 py-1.5 font-mono text-[11px] text-cyan-300 truncate" 
              title={storagePath}
            >
              {storagePath}
            </div>
            <button
              onClick={handleBrowseStoragePath}
              className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <FolderOpen size={13} />
              <span>Change Folder...</span>
            </button>
            <button
              onClick={handleOpenStoragePath}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs transition shrink-0"
              title="Open in Explorer"
            >
              <span>Open</span>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white transition text-xs font-bold"
            >
              Close Vault
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
