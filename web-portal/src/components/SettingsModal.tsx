import React, { useState, useEffect } from 'react';
import { 
  X, User, HardDrive, Cpu, Cloud, 
  Palette, Info, ExternalLink,
  FolderOpen, AlertTriangle, HelpCircle,
  RefreshCw, ShieldCheck, CheckCircle2, DownloadCloud, Activity,
  Download, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { type ModelItem, INITIAL_MODELS } from './ModelHubModal';

export interface StudioSettings {
  username: string;
  modelProfile: 'auto' | '12gb_fp8' | '16gb_native' | '24gb_ultra' | 'manual_override';
  wanPrecision: 'fp8_e4m3' | 'fp8_e5m2' | 'bf16' | 'int4';
  sam2Precision: 'fp16' | 'fp32';
  vramCapGb: number;
  cudaDevice: number;
  enableNvenc60fps: boolean;
  activeProvider: 'local_gemma' | 'google_gemini' | 'openai_chatgpt' | 'openrouter';
  geminiKey: string;
  geminiModel: string;
  openaiKey: string;
  openaiModel: string;
  openrouterKey: string;
  openrouterModel: string;
  storagePath: string;
  exportPath: string;
  appearanceTheme: 'obsidian_dark' | 'midnight_purple' | 'cyber_cyan';
  telemetryOptIn: boolean;
}

const DEFAULT_SETTINGS: StudioSettings = {
  username: 'Xonarous',
  modelProfile: 'auto',
  wanPrecision: 'fp8_e4m3',
  sam2Precision: 'fp16',
  vramCapGb: 15.5,
  cudaDevice: 0,
  enableNvenc60fps: true,
  activeProvider: 'local_gemma',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  openaiKey: '',
  openaiModel: 'gpt-4o',
  openrouterKey: '',
  openrouterModel: 'anthropic/claude-3.5-sonnet',
  storagePath: '~/.cache/genux/models',
  exportPath: 'Videos/Genux AI',
  appearanceTheme: 'obsidian_dark',
  telemetryOptIn: false
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: StudioSettings) => void;
  initialTab?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTab = 'account'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [settings, setSettings] = useState<StudioSettings>(() => {
    const saved = localStorage.getItem('genux_unified_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>('v1.0.4');
  const [checkingAppUpdate, setCheckingAppUpdate] = useState<boolean>(false);
  const [appUpdateResult, setAppUpdateResult] = useState<any>(null);
  const [checkingModelUpdates, setCheckingModelUpdates] = useState<boolean>(false);
  const [modelUpdatesList, setModelUpdatesList] = useState<any[]>([]);
  const [syncingTelemetry, setSyncingTelemetry] = useState<boolean>(false);
  const [telemetrySyncMsg, setTelemetrySyncMsg] = useState<string>('');

  // Embedded Model Hub Catalog State
  const [hubModels, setHubModels] = useState<ModelItem[]>(INITIAL_MODELS);
  const [modelCategoryFilter, setModelCategoryFilter] = useState<string>('all');
  const [isScanningModels, setIsScanningModels] = useState<boolean>(false);
  const [modelScanMessage, setModelScanMessage] = useState<string>('');

  const isGemmaInstalled = hubModels.some(m => m.id === 'gemma' && (m.status === 'installed' || m.status === 'detected_cache'));

  const refreshHubModels = async () => {
    if (window.genuxNative?.listModels) {
      try {
        const live = await window.genuxNative.listModels();
        setHubModels(prev => prev.map(m => {
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
  };

  const handleDownloadModel = async (id: string) => {
    setHubModels(prev => prev.map(m => m.id === id ? { ...m, status: 'downloading', progress: 0 } : m));
    if (window.genuxNative?.startModelDownload) {
      try {
        await window.genuxNative.startModelDownload({ modelId: id });
      } catch (err: any) {
        console.error(`Download error for ${id}:`, err);
      }
    } else {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 25;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setHubModels(prev => prev.map(m => m.id === id ? { ...m, status: 'installed', progress: 100 } : m));
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } else {
          setHubModels(prev => prev.map(m => m.id === id ? { ...m, progress: currentProgress } : m));
        }
      }, 250);
    }
  };

  const handleCancelDownload = async (id: string) => {
    setHubModels(prev => prev.map(m => m.id === id ? { ...m, status: 'missing', progress: 0 } : m));
    if (window.genuxNative?.cancelModelDownload) {
      try {
        await window.genuxNative.cancelModelDownload(id);
      } catch (err: any) {
        console.error('Cancel download error for ' + id + ':', err);
      }
    }
  };

  const handleRemoveModel = async (id: string) => {
    if (!window.confirm(`Are you sure you want to remove and delete this model from disk?`)) return;
    if (window.genuxNative?.removeModelFile) {
      try {
        const res = await window.genuxNative.removeModelFile(id);
        if (res && res.success) {
          setHubModels(prev => prev.map(m => m.id === id ? {
            ...m,
            status: 'missing',
            progress: 0,
            localPath: ''
          } : m));
          refreshHubModels();
        }
      } catch (err: any) {
        alert(`Failed to remove model: ${err.message}`);
      }
    } else {
      setHubModels(prev => prev.map(m => m.id === id ? { ...m, status: 'missing', progress: 0 } : m));
    }
  };

  const handleScanDisk = async () => {
    setIsScanningModels(true);
    setModelScanMessage('Scanning local storage, ComfyUI & Ollama caches...');
    if (window.genuxNative?.scanLocalModelCaches) {
      try {
        const scan = await window.genuxNative.scanLocalModelCaches();
        setHubModels(prev => prev.map(m => {
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
        setModelScanMessage('Scan complete: Local models auto-linked with zero network usage!');
      } catch (err: any) {
        setModelScanMessage('Scan completed.');
      } finally {
        setIsScanningModels(false);
      }
    } else {
      setTimeout(() => {
        setIsScanningModels(false);
        setModelScanMessage('Scan complete: Models synced.');
      }, 800);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      refreshHubModels();
    }
    let cleanup: (() => void) | undefined;
    if (window.genuxNative?.onModelDownloadProgress) {
      cleanup = window.genuxNative.onModelDownloadProgress((data: any) => {
        setHubModels(prev => prev.map(m => {
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
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (window.genuxNative?.getSettings) {
      window.genuxNative.getSettings()
        .then((s: any) => {
          if (s) {
            setSettings(prev => ({
              ...prev,
              storagePath: s.modelsDir || prev.storagePath,
              exportPath: s.exportDir || prev.exportPath,
              modelProfile: s.modelProfile || prev.modelProfile,
              telemetryOptIn: !!s.telemetryOptIn
            }));
            if (s.appVersion) setAppVersion(`v${s.appVersion}`);
          }
        })
        .catch((err: any) => {
          console.warn('Could not read native settings:', err);
        });
    }
    if (window.genuxNative?.getAppVersion) {
      window.genuxNative.getAppVersion().then((v: string) => {
        if (v) setAppVersion(`v${v}`);
      });
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('genux_unified_settings', JSON.stringify(settings));
    // Also sync API config for backwards compatibility
    localStorage.setItem('genux_api_config', JSON.stringify({
      activeProvider: settings.activeProvider,
      geminiKey: settings.geminiKey,
      geminiModel: settings.geminiModel,
      openaiKey: settings.openaiKey,
      openaiModel: settings.openaiModel
    }));

    if (window.genuxNative?.saveSettings) {
      window.genuxNative.saveSettings({
        modelsDir: settings.storagePath,
        exportDir: settings.exportPath,
        modelProfile: settings.modelProfile,
        telemetryOptIn: settings.telemetryOptIn
      });
    }

    if (onSave) onSave(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 300);
  };

  const handleBrowseStorageFolder = async () => {
    if (window.genuxNative?.selectDirectory) {
      const selected = await window.genuxNative.selectDirectory(settings.storagePath);
      if (selected) {
        setSettings(prev => ({ ...prev, storagePath: selected }));
      }
    }
  };

  const handleBrowseExportFolder = async () => {
    if (window.genuxNative?.selectDirectory) {
      const selected = await window.genuxNative.selectDirectory(settings.exportPath);
      if (selected) {
        setSettings(prev => ({ ...prev, exportPath: selected }));
      }
    }
  };

  const handleOpenStorageFolder = () => {
    if (window.genuxNative?.openPath) {
      window.genuxNative.openPath(settings.storagePath);
    } else if (window.genuxNative?.showItemInFolder) {
      window.genuxNative.showItemInFolder(settings.storagePath);
    }
  };

  const handleOpenExportFolder = () => {
    if (window.genuxNative?.openPath) {
      window.genuxNative.openPath(settings.exportPath);
    } else if (window.genuxNative?.showItemInFolder) {
      window.genuxNative.showItemInFolder(settings.exportPath);
    }
  };

  const navItems = [
    { id: 'account', label: 'Account', subtext: 'The name that signs this studio', icon: User },
    { id: 'updates', label: 'Updates & Version', subtext: 'Check repo & model weights', icon: RefreshCw },
    { id: 'telemetry', label: 'Data Tracking & Privacy', subtext: 'Anonymous performance sync', icon: ShieldCheck },
    { id: 'models', label: 'Models', subtext: 'Which quantisation each role runs...', icon: HardDrive },
    { id: 'engine', label: 'Local engine', subtext: 'Launch flags and diagnostics of the...', icon: Cpu },
    { id: 'providers', label: 'Providers', subtext: 'OpenRouter, OpenAI, Gemini & Gemma 2', icon: Cloud },
    { id: 'storage', label: 'Storage & Paths', subtext: 'Model caches and video exports', icon: FolderOpen },
    { id: 'appearance', label: 'Appearance', subtext: 'Theme, scale and visual effects', icon: Palette },
    { id: 'about', label: 'About', subtext: 'Version, author, and how to help', icon: Info }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06080E]/90 animate-fadeIn select-none font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[740px] max-h-[94vh] bg-[#14151B] border border-white/[0.08] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-slate-100"
      >
        
        {/* Top Accent Gradient Border */}
        <div className="h-[2px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 shrink-0" />

        {/* Modal Body: Left Sidebar + Right Content (Exact YuE2 Screenshot 2 layout) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========================================================= */}
          {/* LEFT SETTINGS SIDEBAR                                     */}
          {/* ========================================================= */}
          <aside className="w-64 bg-[#0F1017] border-r border-white/[0.06] flex flex-col p-3 shrink-0">
            <div className="px-3 py-2 text-base font-extrabold text-white tracking-tight">
              Settings
            </div>

            <nav className="flex-1 space-y-1 mt-1 overflow-y-auto custom-scrollbar">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-2.5 rounded-2xl transition flex items-start gap-3 ${
                      isActive 
                        ? 'bg-[#1E202B] text-white shadow-xs' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">{item.subtext}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Need Help? Card linking to docs.genuxai.io */}
            <div className="mt-auto pt-3 border-t border-white/[0.06]">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-950/40 to-indigo-950/20 border border-violet-500/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                  <HelpCircle size={13} className="text-violet-400 shrink-0" />
                  <span>Need help?</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Read documentation, benchmarks, and model guides.
                </p>
                <button
                  onClick={() => {
                    const url = 'https://docs.genuxai.io';
                    if (window.genuxNative?.openExternal) {
                      window.genuxNative.openExternal(url);
                    } else {
                      window.open(url, '_blank');
                    }
                  }}
                  className="mt-2.5 w-full py-1.5 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <span>docs.genuxai.io</span>
                  <ExternalLink size={10} />
                </button>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* RIGHT SETTINGS CONTENT                                    */}
          {/* ========================================================= */}
          <main className="flex-1 flex flex-col bg-[#14151B] overflow-hidden">
            
            {/* Header with Title & Close X */}
            <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-white tracking-tight capitalize">
                  {navItems.find(n => n.id === activeTab)?.label}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {navItems.find(n => n.id === activeTab)?.subtext}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
              
              {/* 1. ACCOUNT (Screenshot 2 exact match) */}
              {activeTab === 'account' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Username
                    </label>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                      placeholder="Xonarous"
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      This name is stored on this machine and is only used to label the studio.
                    </p>
                  </div>
                </div>
              )}

              {/* UPDATES TAB */}
              {activeTab === 'updates' && (
                <div className="space-y-5">
                  {/* Current App Version Card */}
                  <div className="p-4 rounded-2xl bg-[#1B1D26] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">Genux AI Studio</span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono text-[10px] font-bold">
                            {appVersion}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Windows x64 Native Workstation (TensorRT Blackwell FP8 Edition)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setCheckingAppUpdate(true);
                        setAppUpdateResult(null);
                        try {
                          if (window.genuxNative?.checkAppUpdate) {
                            const res = await window.genuxNative.checkAppUpdate();
                            setAppUpdateResult(res);
                          } else {
                            setAppUpdateResult({ hasUpdate: false, message: 'You are on the latest version.' });
                          }
                        } catch (e: any) {
                          setAppUpdateResult({ hasUpdate: false, message: e.message || 'Error checking updates' });
                        } finally {
                          setCheckingAppUpdate(false);
                        }
                      }}
                      disabled={checkingAppUpdate}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 shadow-md shadow-violet-600/20"
                    >
                      <RefreshCw size={13} className={checkingAppUpdate ? 'animate-spin' : ''} />
                      <span>{checkingAppUpdate ? 'Checking Repository...' : 'Check for Updates'}</span>
                    </button>
                  </div>

                  {/* App Update Result Banner */}
                  {appUpdateResult && (
                    <div className={`p-4 rounded-2xl border ${appUpdateResult.hasUpdate ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-900 border-white/[0.08]'}`}>
                      {appUpdateResult.hasUpdate ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <CheckCircle2 size={16} />
                              <span>New Update Available: {appUpdateResult.latestVersion}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Release: {appUpdateResult.releaseName}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {appUpdateResult.releaseNotes}
                          </p>
                          <button
                            onClick={() => {
                              if (window.genuxNative?.downloadAndInstallUpdate) {
                                window.genuxNative.downloadAndInstallUpdate(appUpdateResult.downloadUrl);
                              } else if (window.genuxNative?.openExternal) {
                                window.genuxNative.openExternal(appUpdateResult.downloadUrl);
                              }
                            }}
                            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                          >
                            <DownloadCloud size={14} />
                            <span>Download &amp; Install Update</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 text-xs">
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          <span>{appUpdateResult.message || `You are on the latest version (${appVersion}).`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Model Updates Section */}
                  <div className="p-4 rounded-2xl bg-[#1B1D26] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-white">AI Model Weight Revisions</h5>
                        <p className="text-[11px] text-slate-400">Verify local Wan 2.1, SAM 2.1, and Gemma checkpoints against upstream</p>
                      </div>
                      <button
                        onClick={async () => {
                          setCheckingModelUpdates(true);
                          try {
                            if (window.genuxNative?.checkModelUpdates) {
                              const list = await window.genuxNative.checkModelUpdates();
                              setModelUpdatesList(list);
                            }
                          } finally {
                            setCheckingModelUpdates(false);
                          }
                        }}
                        disabled={checkingModelUpdates}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <RefreshCw size={12} className={checkingModelUpdates ? 'animate-spin' : ''} />
                        <span>Check Model Weights</span>
                      </button>
                    </div>

                    {modelUpdatesList.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                        {modelUpdatesList.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-black/30">
                            <span className="text-slate-300 font-semibold">{m.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400">{m.currentRev}</span>
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Automatic Background Info */}
                  <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-[11px] text-slate-400 flex items-start gap-2.5">
                    <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Genux AI automatically checks for releases and model updates in the background on every launch. If an update is detected, you will be notified automatically with zero manual effort required.
                    </span>
                  </div>
                </div>
              )}

              {/* TELEMETRY & PRIVACY TAB */}
              {activeTab === 'telemetry' && (
                <div className="space-y-5">
                  {/* Opt-In Switch Card */}
                  <div className="p-4 rounded-2xl bg-[#1B1D26] border border-white/[0.08] flex items-center justify-between">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className={settings.telemetryOptIn ? 'text-emerald-400' : 'text-slate-500'} />
                        <span className="font-bold text-xs text-white">Anonymous Performance &amp; Error Telemetry</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Sync anonymous GPU hardware specs, crash reports, and downloads count with the backend portal to help optimize local inference across NVIDIA GPUs.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.telemetryOptIn}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setSettings({ ...settings, telemetryOptIn: next });
                          if (window.genuxNative?.saveSettings) {
                            window.genuxNative.saveSettings({ telemetryOptIn: next });
                          }
                          if (next && window.genuxNative?.syncTelemetry) {
                            window.genuxNative.syncTelemetry();
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Connection Status Badge */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${settings.telemetryOptIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span className="text-slate-300">
                        {settings.telemetryOptIn ? 'Status: Connected to Genux Cloud Telemetry Network (genuxai.io)' : 'Status: 100% Offline (Local Only)'}
                      </span>
                    </div>
                    {settings.telemetryOptIn && (
                      <button
                        onClick={async () => {
                          setSyncingTelemetry(true);
                          setTelemetrySyncMsg('');
                          try {
                            if (window.genuxNative?.syncTelemetry) {
                              await window.genuxNative.syncTelemetry();
                              setTelemetrySyncMsg('Telemetry synced successfully!');
                              setTimeout(() => setTelemetrySyncMsg(''), 3000);
                            }
                          } catch (e: any) {
                            setTelemetrySyncMsg('Sync failed: Offline or unreachable');
                          } finally {
                            setSyncingTelemetry(false);
                          }
                        }}
                        disabled={syncingTelemetry}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-[11px] border border-emerald-500/30 transition flex items-center gap-1"
                      >
                        <RefreshCw size={10} className={syncingTelemetry ? 'animate-spin' : ''} />
                        <span>{syncingTelemetry ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                    )}
                  </div>

                  {telemetrySyncMsg && (
                    <div className="text-[11px] text-emerald-400 font-mono px-2">
                      ✓ {telemetrySyncMsg}
                    </div>
                  )}

                  {/* Privacy Transparency Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                      <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>What is shared (Anonymous)</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                        <li>GPU Card model &amp; VRAM (e.g. RTX 4080 16GB)</li>
                        <li>System Memory &amp; CPU architecture</li>
                        <li>Uncaught crash logs &amp; stack traces</li>
                        <li>Video downloads &amp; model count</li>
                        <li>General country / IP (resolved on backend)</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20">
                      <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
                        <X size={12} />
                        <span>What is NEVER shared</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                        <li>Your imported videos &amp; TikTok clips</li>
                        <li>Uploaded character faces &amp; digital twins</li>
                        <li>Recasting prompts or generated video outputs</li>
                        <li>Personal file paths, names, or accounts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MODELS & QUANTISATION (Allow choosing higher model profiles) */}
              {activeTab === 'models' && (
                <div className="space-y-5">
                  
                  {/* Model Profile & Hardware Compatibility */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Hardware Execution Profile
                    </label>
                    <select
                      value={settings.modelProfile}
                      onChange={(e) => setSettings({ ...settings, modelProfile: e.target.value as any })}
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="auto">Auto-Detect from GPU (Recommended)</option>
                      <option value="12gb_fp8">12GB Profile: FP8 Scaled + Dynamic Chunking</option>
                      <option value="16gb_native">16GB Profile: Full Native BF16 / FP8 (RTX 5080, 4080)</option>
                      <option value="24gb_ultra">24GB Profile: Ultra Uncompressed Studio (RTX 4090, 3090, 5090)</option>
                      <option value="manual_override">Manual Override: Force High-Precision Engine</option>
                    </select>

                    {settings.modelProfile === 'manual_override' && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2 mt-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong>Warning: Manual Override Active.</strong> Selecting a model profile exceeding your physical VRAM may trigger Windows DDR5 system RAM paging (slight slowdown during scene transitions).
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wan 2.1 Diffusion Precision */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Wan 2.1 Video Latent Precision
                    </label>
                    <select
                      value={settings.wanPrecision}
                      onChange={(e) => setSettings({ ...settings, wanPrecision: e.target.value as any })}
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="fp8_e4m3">FP8 E4M3 (Optimal Blackwell / Ada TensorRT)</option>
                      <option value="fp8_e5m2">FP8 E5M2 (High Dynamic Range Latents)</option>
                      <option value="bf16">BF16 Full Native (Requires 16GB+ VRAM)</option>
                      <option value="int4">INT4 Scaled (Low VRAM mode for 8-12GB)</option>
                    </select>
                  </div>

                  {/* SAM 2.1 Video Predictor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      SAM 2.1 Rotoscope Masker Precision
                    </label>
                    <select
                      value={settings.sam2Precision}
                      onChange={(e) => setSettings({ ...settings, sam2Precision: e.target.value as any })}
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="fp16">FP16 Half-Precision (Recommended)</option>
                      <option value="fp32">FP32 Single-Precision</option>
                    </select>
                  </div>

                  {/* Model Management Catalog Section (Embedded ModelHub) */}
                  <div className="pt-4 border-t border-white/[0.08] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <HardDrive size={16} className="text-cyan-400" />
                          <span>Local AI Models &amp; Weights Catalog</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {hubModels.filter(m => m.status === 'installed' || m.status === 'detected_cache').length} of {hubModels.length} models installed on this machine
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleScanDisk}
                          disabled={isScanningModels}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5"
                          title="Scan ComfyUI, HuggingFace &amp; Ollama folders for existing models"
                        >
                          <RefreshCw size={12} className={isScanningModels ? 'animate-spin text-cyan-400' : ''} />
                          <span>{isScanningModels ? 'Scanning...' : 'Scan Existing Models'}</span>
                        </button>
                      </div>
                    </div>

                    {modelScanMessage && (
                      <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                        {modelScanMessage}
                      </div>
                    )}

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {(['all', 'core', 'synthesis', 'segmentation', 'motion', 'llm', 'vault'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setModelCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold capitalize transition shrink-0 ${
                            modelCategoryFilter === cat
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Models Grid */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {hubModels
                        .filter(m => modelCategoryFilter === 'all' || m.category === modelCategoryFilter)
                        .map(m => {
                          const isInstalled = m.status === 'installed' || m.status === 'detected_cache';
                          const isDownloading = m.status === 'downloading';
                          return (
                            <div key={m.id} className="p-3 rounded-xl bg-[#1B1D26] border border-white/[0.06] space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-white">{m.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.06] text-slate-400 uppercase">
                                      {m.category}
                                    </span>
                                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{m.size}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                                    {m.source}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isInstalled ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                        <CheckCircle2 size={11} />
                                        <span>Installed</span>
                                      </span>
                                      <button
                                        onClick={() => handleRemoveModel(m.id)}
                                        className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                                        title="Delete model from disk"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ) : isDownloading ? (
                                    <button
                                      onClick={() => handleCancelDownload(m.id)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-[11px] transition"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleDownloadModel(m.id)}
                                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                                    >
                                      <Download size={12} />
                                      <span>Download</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isDownloading && (
                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                    <span className="text-cyan-300 font-bold">{m.progress}% downloaded</span>
                                    <span>{m.downloadSpeed || 'Streaming...'} {m.eta ? `• ETA ${m.eta}` : ''}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
                                      style={{ width: `${m.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                </div>
              )}

              {/* 3. LOCAL ENGINE & CUDA */}
              {activeTab === 'engine' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      VRAM Safety Headroom Cap (GB)
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={8}
                      max={32}
                      value={settings.vramCapGb}
                      onChange={(e) => setSettings({ ...settings, vramCapGb: Number(e.target.value) })}
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-500">
                      Reserve at least 1.0 GB for Windows DWM and display compositor.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="nvenc"
                      checked={settings.enableNvenc60fps}
                      onChange={(e) => setSettings({ ...settings, enableNvenc60fps: e.target.checked })}
                      className="w-4 h-4 rounded accent-violet-600"
                    />
                    <label htmlFor="nvenc" className="text-xs text-slate-300 cursor-pointer">
                      Enable Hardware NVENC 60 FPS Export & RIFE 4.22 neural motion interpolation
                    </label>
                  </div>
                </div>
              )}

              {/* 4. PROVIDERS (Gemini, ChatGPT, OpenRouter, Gemma) */}
              {activeTab === 'providers' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Active Director Agent Provider
                    </label>
                    <select
                      value={settings.activeProvider}
                      onChange={(e) => setSettings({ ...settings, activeProvider: e.target.value as any })}
                      className="w-full max-w-md bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="local_gemma" disabled={!isGemmaInstalled}>
                        {isGemmaInstalled 
                          ? '100% Offline: Local Gemma 2 2B Director (Q4_K_M GGUF — Ready)' 
                          : '100% Offline: Local Gemma 2 2B Director (Not downloaded — install in Models tab)'}
                      </option>
                      <option value="google_gemini">Cloud API: Google Gemini 2.0 (Flash / Pro)</option>
                      <option value="openai_chatgpt">Cloud API: OpenAI ChatGPT (GPT-4o)</option>
                      <option value="openrouter">Cloud API: OpenRouter (Claude 3.5, Llama 3)</option>
                    </select>

                    {settings.activeProvider === 'local_gemma' && !isGemmaInstalled && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 mt-2">
                        <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <strong>Gemma 2 2B Not Downloaded:</strong> Local AI Director requires downloading the 1.6 GB model weights (Gemma 2 2B Q4_K_M GGUF — free, no login needed).
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('models');
                                handleDownloadModel('gemma');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition"
                            >
                              Install Gemma 2 Now
                            </button>
                            <span className="text-slate-400 text-[11px]">or configure a Google Gemini or OpenAI API key below</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {settings.activeProvider === 'google_gemini' && (
                    <div className="p-3.5 rounded-2xl bg-[#1B1D26] border border-cyan-500/20 space-y-2">
                      <label className="text-xs font-semibold text-cyan-300 block">Google Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={settings.geminiKey}
                        onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                        className="w-full bg-[#12131A] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  )}

                  {settings.activeProvider === 'openai_chatgpt' && (
                    <div className="p-3.5 rounded-2xl bg-[#1B1D26] border border-emerald-500/20 space-y-2">
                      <label className="text-xs font-semibold text-emerald-300 block">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-proj-..."
                        value={settings.openaiKey}
                        onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                        className="w-full bg-[#12131A] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>
                  )}

                  {settings.activeProvider === 'openrouter' && (
                    <div className="p-3.5 rounded-2xl bg-[#1B1D26] border border-violet-500/20 space-y-2">
                      <label className="text-xs font-semibold text-violet-300 block">OpenRouter API Key</label>
                      <input
                        type="password"
                        placeholder="sk-or-..."
                        value={settings.openrouterKey}
                        onChange={(e) => setSettings({ ...settings, openrouterKey: e.target.value })}
                        className="w-full bg-[#12131A] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 5. STORAGE & PATHS */}
              {activeTab === 'storage' && (
                <div className="space-y-6">
                  {/* AI Engine & Models Directory */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      AI Engine & Models Storage Directory
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={settings.storagePath}
                        className="flex-1 bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
                      />
                      <button
                        onClick={handleBrowseStorageFolder}
                        className="px-3 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-xs font-semibold text-violet-200 transition flex items-center gap-1.5"
                      >
                        <FolderOpen size={14} />
                        <span>Change...</span>
                      </button>
                      <button
                        onClick={handleOpenStorageFolder}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-cyan-300 transition flex items-center gap-1.5"
                      >
                        <span>Open</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Where Wan 2.1, SAM 2.1, DWPose and Gemma weights are downloaded. You can point this to an existing ComfyUI drive (e.g. <code className="text-slate-400">D:\AI_Models</code>).
                    </p>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* Rendered Videos Export Directory */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Rendered Videos Export Directory
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={settings.exportPath}
                        className="flex-1 bg-[#1B1D26] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
                      />
                      <button
                        onClick={handleBrowseExportFolder}
                        className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-xs font-semibold text-emerald-200 transition flex items-center gap-1.5"
                      >
                        <FolderOpen size={14} />
                        <span>Change...</span>
                      </button>
                      <button
                        onClick={handleOpenExportFolder}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-emerald-300 transition flex items-center gap-1.5"
                      >
                        <span>Open</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      When you click &quot;Download to Disk&quot; on finished videos in your in-app Library, videos are exported to this directory.
                    </p>
                  </div>
                </div>
              )}

              {/* 6. APPEARANCE */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Studio Color Palette
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'obsidian_dark', label: 'Obsidian Black', border: 'border-violet-500' },
                        { id: 'midnight_purple', label: 'Midnight Neon', border: 'border-fuchsia-500' },
                        { id: 'cyber_cyan', label: 'Cyber Matrix', border: 'border-cyan-500' }
                      ].map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSettings({ ...settings, appearanceTheme: t.id as any })}
                          className={`p-3 rounded-2xl bg-[#1B1D26] border cursor-pointer transition text-center ${
                            settings.appearanceTheme === t.id ? `${t.border} bg-violet-950/20 font-bold text-white` : 'border-white/[0.06] text-slate-400'
                          }`}
                        >
                          {t.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. ABOUT (Exact Screenshot 3 layout) */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  
                  {/* Top Version & Description */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-white">
                      Genux AI Studio • Version 1.0.0
                    </h4>
                    <p className="text-xs text-slate-300 font-medium">
                      100% Local Video Recasting & Viral Studio
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Built for local Wan 2.1, SAM 2.1 & Blackwell recasting with optional cloud director tools.
                    </p>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* Owner & Research Credits (Xonarous Inc) */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-white">
                      Xonarous Inc
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Genux AI is owned and built by Xonarous Inc. Open research and portable builds of state-of-the-art generative video neural networks.
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <a
                        href="https://xonarous.nl"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition flex items-center gap-1.5"
                      >
                        <span>Website • xonarous.nl</span>
                        <ExternalLink size={11} />
                      </a>

                      <a
                        href="https://github.com/Xonarouss/genuxaistudio"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-[11px] transition flex items-center gap-1.5"
                      >
                        <span>GitHub Repository</span>
                        <ExternalLink size={11} />
                      </a>

                      <a
                        href="https://buymeacoffee.com/xonarous"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = 'https://buymeacoffee.com/xonarous';
                          if (window.genuxNative?.openExternal) window.genuxNative.openExternal(url);
                          else window.open(url, '_blank');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-[11px] transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      >
                        <span className="text-sm">🍺</span>
                        <span>Buy me a beer</span>
                      </a>

                      <button
                        onClick={() => {
                          const url = 'https://docs.genuxai.io';
                          if (window.genuxNative?.openExternal) {
                            window.genuxNative.openExternal(url);
                          } else {
                            window.open(url, '_blank');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-semibold transition"
                      >
                        Documentation
                      </button>

                      <a
                        href="https://genuxai.io/privacy"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = 'https://genuxai.io/privacy';
                          if (window.genuxNative?.openExternal) window.genuxNative.openExternal(url);
                          else window.open(url, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-semibold transition"
                      >
                        Privacy Policy
                      </a>

                      <a
                        href="https://genuxai.io/terms"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = 'https://genuxai.io/terms';
                          if (window.genuxNative?.openExternal) window.genuxNative.openExternal(url);
                          else window.open(url, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] font-semibold transition"
                      >
                        Terms of Service
                      </a>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

                  {/* The Studio Family */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-xs text-white">
                      The studio family
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Local AI generation studios built with modern frameless native UI and zero cloud lock-in.
                    </p>

                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-[#1B1D26] border border-violet-500/40 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-2">
                            <span>Genux AI Studio</span>
                            <span className="text-[9px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded">this one</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Full viral video recasting with Wan 2.1 & SAM 2.1</div>
                        </div>
                        <ExternalLink size={13} className="text-slate-500" />
                      </div>

                      <div className="p-3 rounded-2xl bg-[#181A22] border border-white/[0.05] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">YuE2 Studio</div>
                          <div className="text-[10px] text-slate-400">Full songs with editable score & local neural audio</div>
                        </div>
                        <ExternalLink size={13} className="text-slate-500" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Done Button (Exact Screenshot 2 placement) */}
            <div className="p-4 border-t border-white/[0.06] bg-[#111218] flex items-center justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-md hover:bg-slate-200 transition"
              >
                {savedSuccess ? 'Saved!' : 'Done'}
              </button>
            </div>

          </main>

        </div>

      </div>
    </div>
  );
};
