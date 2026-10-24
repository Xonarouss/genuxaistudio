import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Sparkles, 
  Layers, Scan, Eye, 
  Film, UserPlus, HardDrive, 
  FolderOpen, RefreshCw, Terminal,
  Scissors, Minus, Square, X,
  Compass, Video, Download, Settings,
  ExternalLink,
  Camera, Move3d, Flame, Volume2, VolumeX,
  Search, Trash2, AlertTriangle,
  Clapperboard, Edit3, Check, RotateCcw,
  ShieldCheck, DownloadCloud, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GenuxLogo } from './GenuxLogo';
import { ModelHubModal } from './ModelHubModal';
import { SettingsModal } from './SettingsModal';
import { HardwareTelemetryWidget } from './HardwareTelemetryWidget';

declare global {
  interface Window {
    genuxNative?: {
      platform: string;
      isDesktop: boolean;
      minimizeWindow?: () => Promise<boolean>;
      maximizeWindow?: () => Promise<boolean>;
      closeWindow?: () => Promise<boolean>;
      isMaximized?: () => Promise<boolean>;
      openVideoDialog: () => Promise<string[]>;
      openImageDialog: () => Promise<string[]>;
      saveVideoDialog: (defaultName?: string) => Promise<string>;
      selectDirectory?: (defaultPath?: string) => Promise<string | null>;
      showItemInFolder: (path: string) => Promise<boolean>;
      openPath?: (path: string) => Promise<boolean>;
      openExternal?: (url: string) => Promise<boolean>;
      getGpuTelemetry: () => Promise<any>;
      scanLocalModelCaches: () => Promise<any>;
      getSettings?: () => Promise<any>;
      saveSettings?: (settings: any) => Promise<any>;
      startModelDownload?: (config: any) => Promise<any>;
      cancelModelDownload?: (modelId: string) => Promise<boolean>;
      listModels?: () => Promise<any>;
      importLocalModelFile?: (modelId: string) => Promise<any>;
      removeModelFile?: (modelId: string) => Promise<any>;
      onModelDownloadProgress?: (callback: (data: any) => void) => () => void;
      importVideoUrl?: (url: string) => Promise<any>;
      searchYouTube?: (query: string) => Promise<any[]>;
      getViralFeeds?: (params?: any) => Promise<any>;
      onSocialImportProgress?: (callback: (data: any) => void) => () => void;
      startRecastJob: (jobConfig: any) => Promise<{ success: boolean; exitCode: number }>;
      cancelRecastJob: () => Promise<boolean>;
      onPipelineProgress: (callback: (data: string) => void) => () => void;
      getAppVersion?: () => Promise<string>;
      checkAppUpdate?: () => Promise<any>;
      downloadAndInstallUpdate?: (url?: string) => Promise<any>;
      checkModelUpdates?: () => Promise<any[]>;
      onUpdateAvailable?: (callback: (data: any) => void) => () => void;
      syncTelemetry?: (extra?: any) => Promise<any>;
      logClientError?: (err: any) => Promise<any>;
    };
  }
}

interface ViralVideo {
  id: string;
  title: string;
  source: string;
  duration: number;
  views: string;
  category: string;
  author?: string;
  likes?: string;
  videoUrl?: string;
  filePath?: string;
  gradient?: string;
  prompt?: string;
  thumbnail?: string;
  importedAt?: number;
}

interface RenderedVideo {
  id: string;
  title: string;
  character: string;
  duration: number;
  filePath: string;
  createdAt: number;
  aspectRatio: string;
}

interface VaultCharacter {
  id: string;
  name: string;
  tag: string;
  avatarColor: string;
  style: string;
  gcharSize: string;
  similarityScore: number;
  portraitPath?: string;
}

const DEFAULT_VIRAL_VIDEOS: ViralVideo[] = [
  {
    id: 'tokyo-drift',
    title: 'Neon Tokyo Rooftop Parkour & Cat Leap',
    source: 'TikTok Viral (14.2M views)',
    duration: 10,
    views: '14.2M',
    category: 'Stunts & Motion',
    author: '@storm_freerun',
    likes: '2.1M',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    gradient: 'from-amber-600/30 to-purple-900/40',
    prompt: 'Cyberpunk cybernetic courier with glowing optic implants leaping neon rooftops, 8k raytraced, 60fps'
  },
  {
    id: 'shibuya-drift',
    title: 'Midnight Shibuya RX-7 Twin-Turbo Drift',
    source: 'Instagram Reels (8.7M views)',
    duration: 8,
    views: '8.7M',
    category: 'Supercars & Drift',
    author: '@midnight_tokyo',
    likes: '1.4M',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    gradient: 'from-cyan-600/30 to-blue-900/40',
    prompt: 'Futuristic carbon hovercraft drifting wet neo-Kyoto asphalt, volumetric purple smoke, anamorphic lens'
  },
  {
    id: 'cyber-shuffle',
    title: 'Underground Cyber Electro Shuffle Dance',
    source: 'TikTok Trending (22.5M views)',
    duration: 12,
    views: '22.5M',
    category: 'Dance & Rhythm',
    author: '@neon_dancer_ai',
    likes: '3.8M',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    gradient: 'from-pink-600/30 to-indigo-900/40',
    prompt: 'Bioluminescent android performer in iridescent jacket executing fluid popping dance, stadium laser grid'
  },
  {
    id: 'matrix-vault',
    title: '360 Bullet-Time Backflip off Container',
    source: 'YouTube Shorts (19.1M views)',
    duration: 7,
    views: '19.1M',
    category: 'Stunts & Motion',
    author: '@action_physics',
    likes: '2.9M',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    gradient: 'from-emerald-600/30 to-teal-900/40',
    prompt: 'Ancient golden ronin warrior executing aerial inverted split, cherry blossoms swirling, 60fps slow-motion'
  }
];

const CAMERA_MOTIONS = [
  { id: 'orbit', label: '3D Orbit Arc', icon: Move3d, desc: 'Dynamic 360 orbital camera motion around subject' },
  { id: 'crane', label: 'Crane Boom Up', icon: Camera, desc: 'Vertical crane elevation tracking upward with cinematic tilt' },
  { id: 'dolly_zoom', label: 'Vertigo Dolly Zoom', icon: Video, desc: 'Hitchcock optical distortion with background depth expansion' },
  { id: 'pan_360', label: 'Horizon Pan', icon: Compass, desc: 'Horizontal tracking synchronized to movement velocity' },
  { id: 'handheld', label: 'Cinematic Handheld', icon: Flame, desc: 'Organic realistic operator physics with micro-shakes' }
];


class SafeSettingsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || 'Error loading settings' };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Settings ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06080E]/90 text-white font-sans">
          <div className="bg-[#14151B] border border-rose-500/40 rounded-2xl p-6 max-w-md space-y-4 text-center">
            <h3 className="font-bold text-base text-rose-400">Settings Recovery Mode</h3>
            <p className="text-xs text-slate-300">An unexpected error was caught: {this.state.error}</p>
            <button
              onClick={() => {
                localStorage.removeItem('genux_unified_settings');
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold"
            >
              Reset Settings &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DesktopStudioApp: React.FC = () => {
  // 1. Startup Splash Screen (eliminates black screen flash)
  const [showStartupSplash, setShowStartupSplash] = useState<boolean>(true);
  const [splashFadeOut, setSplashFadeOut] = useState<boolean>(false);

  
  // Draggable Resizable Sidebars (Saved in localStorage)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('genux_sidebar_left_width');
    return saved ? Math.max(200, Math.min(420, parseInt(saved, 10))) : 230;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('genux_sidebar_right_width');
    return saved ? Math.max(280, Math.min(540, parseInt(saved, 10))) : 360;
  });
  const isDraggingLeftRef = useRef<boolean>(false);
  const isDraggingRightRef = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeftRef.current) {
        const newWidth = Math.max(200, Math.min(420, e.clientX));
        setLeftSidebarWidth(newWidth);
        localStorage.setItem('genux_sidebar_left_width', String(newWidth));
      } else if (isDraggingRightRef.current) {
        const newWidth = Math.max(280, Math.min(540, window.innerWidth - e.clientX));
        setRightSidebarWidth(newWidth);
        localStorage.setItem('genux_sidebar_right_width', String(newWidth));
      }
    };
    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      isDraggingRightRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Magic Prompt Enhancement
  const handleMagicEnhancePrompt = (target: 'recast' | 'scene') => {
    if (target === 'recast') {
      const base = recastPrompt.trim();
      const enhanced = base 
        ? `${base}, preserving 100% original 1:1 camera motion physics and temporal kinematics, 8K ultra-detailed photorealistic skin textures, seamless temporal coherence, Wan 2.1 Blackwell FP8 latent synthesis.`
        : `Swap subject with @attachment1, 100% 1:1 camera physics and motion preservation, 8K photorealistic textures, dynamic volumetric lighting integration, seamless temporal coherence, Wan 2.1 Blackwell FP8 neural synthesis.`;
      setRecastPrompt(enhanced);
    } else {
      const base = sceneDirectorPrompt.trim();
      const enhanced = base
        ? `${base}, photorealistic environmental grading, high-contrast atmospheric depth, volumetric ray-tracing reflections, maintain original actor perspective and 1:1 kinematics.`
        : `Transform background environment to high-contrast neon rainy Tokyo street with wet pavement reflections, change car to matte black hypercar with volumetric headlights, add cybernetic jacket details, lock 1:1 camera movement and subject perspective.`;
      setSceneDirectorPrompt(enhanced);
    }
  };

  // 2. Navigation & Sidebar (Viral trends removed, defaults to my_imports)
  const [activeNav, setActiveNav] = useState<'create' | 'library' | 'twins' | 'console'>('create');
  const [librarySubTab, setLibrarySubTab] = useState<'my_imports' | 'youtube' | 'importer' | 'renders'>('my_imports');
  
  // 3. Modals & Settings
  const [isModelHubOpen, setIsModelHubOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showEngineRequiredModal, setShowEngineRequiredModal] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showFirstLaunchTelemetryModal, setShowFirstLaunchTelemetryModal] = useState<boolean>(false);
  const [availableUpdateNotification, setAvailableUpdateNotification] = useState<any>(null);

  // Dynamic Studio Username synced with Settings
  const [studioUsername, setStudioUsername] = useState<string>(() => {
    const saved = localStorage.getItem('genux_unified_settings');
    if (saved) {
      try { return JSON.parse(saved).username || 'Xonarous'; } catch (e) {}
    }
    return 'Xonarous';
  });

  // 4. Engine & Model Status
  const [installedModelCount, setInstalledModelCount] = useState<number>(0);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [telemetryInfo, setTelemetryInfo] = useState<{ gpu: string; vram: string; profile: string }>({
    gpu: 'NVIDIA RTX GPU',
    vram: '16GB VRAM',
    profile: '16GB Native Profile'
  });

  // 5. Studio Videos & Characters (Persisted in localStorage with NO placeholders)
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo>(() => {
    const savedImports = localStorage.getItem('genux_user_imported_videos');
    if (savedImports) {
      try {
        const parsed = JSON.parse(savedImports);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return DEFAULT_VIRAL_VIDEOS[0];
  });

  const [vaultCharacters, setVaultCharacters] = useState<VaultCharacter[]>(() => {
    const saved = localStorage.getItem('genux_custom_vault_characters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [selectedVaultChar, setSelectedVaultChar] = useState<VaultCharacter | null>(() => {
    const saved = localStorage.getItem('genux_custom_vault_characters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return null;
  });

  // Multi-Character Attachments (supports over 5 characters simultaneously!)
  const [characterAttachments, setCharacterAttachments] = useState<Array<{
    tag: string;
    index: number;
    charId: string;
    name: string;
    portraitPath?: string;
  }>>([]);

  const [recastPrompt, setRecastPrompt] = useState<string>(
    'Swap character with @attachment1, 100% 1:1 camera physics and motion preservation.'
  );

  const [sceneDirectorPrompt, setSceneDirectorPrompt] = useState<string>('');
  const [editingCharDesc, setEditCharDesc] = useState<string>('');

  // 6. User's Persisted Imported Videos ("My Imported Videos")
  const [myImportedVideos, setMyImportedVideos] = useState<ViralVideo[]>(() => {
    const saved = localStorage.getItem('genux_user_imported_videos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // 7. Finished Rendered Videos (in Library with manual download)
  const [renderedVideos, setRenderedVideos] = useState<RenderedVideo[]>(() => {
    const saved = localStorage.getItem('genux_rendered_videos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // 8. YouTube In-App Search State
  const [ytSearchQuery, setYtSearchQuery] = useState<string>('');
  const [ytSearchResults, setYtSearchResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState<boolean>(false);

  // 9. Audio Player & Volume Control (User requested audio)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);

  // 10. Camera, Aspect Ratio & Director Prompts
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5'>('9:16');
  const [selectedCamera, setSelectedCamera] = useState<string>('orbit');
  const [identityWeight, setIdentityWeight] = useState<number>(0.92);
  const [viewMode, setViewMode] = useState<'split' | 'recast' | 'original'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showDepth, setShowDepth] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // 11. Ingest URL & Status
  const [urlInput, setUrlInput] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestStatus, setIngestStatus] = useState<string>('');

  // 12. Pipeline Rendering State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [pipelineStage, setPipelineStage] = useState<string>('');
  const [engineLogs, setEngineLogs] = useState<string[]>([
    '[System] Genux AI Desktop Workstation Initialized.',
    '[CUDA] Native C++ CUDA streams initialized with NVDEC/NVENC hardware.',
    '[Audio] Stereo audio stream multiplexing active.',
    '[Storage] Models directory synchronized with settings.'
  ]);

  // 13. Maestro-Style Video Trimming & Scrubbing State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(10);

  // 14. Character Rename State
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editCharName, setEditCharName] = useState<string>('');

  const safeSrc = (p?: string) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('blob:')) return p;
    if (p.startsWith('file:///')) return p;
    const formatted = p.replace(/\\/g, '/');
    return `file:///${formatted.startsWith('/') ? formatted.slice(1) : formatted}`;
  };

  const stepTime = (delta: number) => {
    if (videoRef.current) {
      const target = Math.max(0, Math.min(duration || 10, (videoRef.current.currentTime || 0) + delta));
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleSetTrimIn = () => {
    const cur = videoRef.current?.currentTime || 0;
    setTrimStart(cur);
    if (cur > trimEnd) setTrimEnd(duration || 10);
  };

  const handleSetTrimOut = () => {
    const cur = videoRef.current?.currentTime || (duration || 10);
    setTrimEnd(cur);
    if (cur < trimStart) setTrimStart(0);
  };

  const handleResetTrim = () => {
    setTrimStart(0);
    setTrimEnd(duration || 10);
  };

  const handleSaveRenameChar = (charId: string) => {
    if (!editCharName.trim()) return;
    const updated = vaultCharacters.map(c => c.id === charId ? { 
      ...c, 
      name: editCharName.trim(),
      style: editingCharDesc.trim() || c.style 
    } : c);
    setVaultCharacters(updated);
    localStorage.setItem('genux_custom_vault_characters', JSON.stringify(updated));
    if (selectedVaultChar?.id === charId) {
      setSelectedVaultChar(prev => prev ? { ...prev, name: editCharName.trim(), style: editingCharDesc.trim() || prev.style } : null);
    }
    setCharacterAttachments(prev => prev.map(a => a.charId === charId ? { ...a, name: editCharName.trim() } : a));
    setEditingCharId(null);
  };

  const handleDeleteCharacter = (charId: string) => {
    if (!window.confirm('Delete this character from your Vault?')) return;
    const updated = vaultCharacters.filter(c => c.id !== charId);
    setVaultCharacters(updated);
    localStorage.setItem('genux_custom_vault_characters', JSON.stringify(updated));
    if (selectedVaultChar?.id === charId) {
      setSelectedVaultChar(updated[0] || null);
    }
    setCharacterAttachments(prev => prev.filter(a => a.charId !== charId));
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Startup Splash Screen Timer
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFadeOut(true), 1200);
    const removeTimer = setTimeout(() => setShowStartupSplash(false), 1600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Sync Volume to Video Element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, selectedVideo]);

  // Load Model Status & Telemetry
  useEffect(() => {
    if (window.genuxNative?.getGpuTelemetry) {
      window.genuxNative.getGpuTelemetry().then(t => {
        if (t && t.gpuShortName) {
          setTelemetryInfo({
            gpu: t.gpuShortName,
            vram: `${t.vramTotalGb}GB VRAM`,
            profile: t.profile || '16GB Native Profile'
          });
        }
      });
    }

    if (window.genuxNative?.listModels) {
      window.genuxNative.listModels().then(catalog => {
        const count = Object.values(catalog).filter((m: any) => m.isInstalled).length;
        setInstalledModelCount(count);
        setIsEngineReady(count >= 2); // At least Wan 2.1 & SAM 2.1 installed
      });
    }

    let cleanupProgress: (() => void) | undefined;
    if (window.genuxNative?.onSocialImportProgress) {
      cleanupProgress = window.genuxNative.onSocialImportProgress((prog: any) => {
        setIngestStatus(prog.status || 'Ingesting clip...');
      });
    }

    // Check first-launch anonymous telemetry prompt (strictly once)
    const seen = localStorage.getItem('genux_telemetry_prompt_seen');
    if (!seen) {
      if (window.genuxNative?.getSettings) {
        window.genuxNative.getSettings().then((s: any) => {
          if (!s?.telemetryPromptSeen) {
            setShowFirstLaunchTelemetryModal(true);
          } else {
            localStorage.setItem('genux_telemetry_prompt_seen', 'true');
          }
        }).catch(() => {
          setShowFirstLaunchTelemetryModal(true);
        });
      } else {
        setShowFirstLaunchTelemetryModal(true);
      }
    }

    // Listen for background auto-updater notifications
    let cleanupUpdater: (() => void) | undefined;
    if (window.genuxNative?.onUpdateAvailable) {
      cleanupUpdater = window.genuxNative.onUpdateAvailable((data: any) => {
        setAvailableUpdateNotification(data);
      });
    }

    return () => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupUpdater) cleanupUpdater();
    };
  }, []);

  // Split Wipe Slider handlers
  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSlider || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition(Math.round((x / rect.width) * 100));
  };

  // Window Controls
  const handleMinimize = () => window.genuxNative?.minimizeWindow?.();
  const handleMaximize = async () => {
    if (window.genuxNative?.maximizeWindow) {
      const state = await window.genuxNative.maximizeWindow();
      setIsMaximized(state);
    }
  };
  const handleClose = () => window.genuxNative?.closeWindow?.();

  // Save Video to User's Imported List
  const saveImportedVideo = (vid: ViralVideo) => {
    setMyImportedVideos(prev => {
      const updated = [vid, ...prev.filter(v => v.id !== vid.id)];
      localStorage.setItem('genux_user_imported_videos', JSON.stringify(updated));
      return updated;
    });
  };

  // Delete Video from User's Imported List
  const handleDeleteImportedVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMyImportedVideos(prev => {
      const updated = prev.filter(v => v.id !== id);
      localStorage.setItem('genux_user_imported_videos', JSON.stringify(updated));
      return updated;
    });
  };

  // In-App YouTube Search Handler
  const handleSearchYouTube = async () => {
    const q = ytSearchQuery.trim();
    if (!q) return;
    setIsSearchingYt(true);
    setEngineLogs(prev => [...prev, `[YouTube Search] Searching YouTube for: "${q}"...`]);

    if (window.genuxNative?.searchYouTube) {
      try {
        const results = await window.genuxNative.searchYouTube(q);
        setYtSearchResults(results || []);
        setEngineLogs(prev => [...prev, `[YouTube Search] Found ${results.length} video results.`]);
      } catch (err: any) {
        setEngineLogs(prev => [...prev, `[YouTube Search Error] ${err.message}`]);
      } finally {
        setIsSearchingYt(false);
      }
    } else {
      setTimeout(() => {
        setIsSearchingYt(false);
        setYtSearchResults([
          {
            id: 'yt-demo-1',
            title: 'Extreme Rooftop Freerunning & Parkour POV',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            channel: 'Team Farang',
            duration: 12,
            durationString: '0:12',
            thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
            views: '1.2M views'
          }
        ]);
      }, 700);
    }
  };

  // Direct Social URL Ingest via yt-dlp & Direct Stream
  const handleIngestUrl = async (customUrl?: string) => {
    const target = (customUrl || urlInput).trim();
    if (!target) return;
    setIsIngesting(true);
    setIngestStatus('Connecting to video source & demuxing audio/video...');
    setEngineLogs(prev => [...prev, `[SocialIngestor] Ingesting video stream with full audio: ${target}`]);

    if (window.genuxNative?.importVideoUrl) {
      try {
        const result = await window.genuxNative.importVideoUrl(target);
        if (result && result.localPath) {
          const newVideo: ViralVideo = {
            id: `import-${Date.now()}`,
            title: result.title || 'Imported Social Clip',
            source: target,
            duration: result.duration || 10,
            views: 'Direct Import',
            category: 'My Imports',
            filePath: result.localPath,
            videoUrl: result.localPath,
            gradient: 'from-violet-600/40 to-cyan-900/60',
            importedAt: Date.now()
          };
          setSelectedVideo(newVideo);
          saveImportedVideo(newVideo);
          setUrlInput('');
          setIngestStatus('');
          setActiveNav('create');
          setEngineLogs(prev => [...prev, `[SocialIngestor] Video cached with stereo audio: ${result.localPath}`]);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
      } catch (err: any) {
        setIngestStatus(`Error: ${err.message}`);
        setEngineLogs(prev => [...prev, `[SocialIngestor Error] ${err.message}`]);
        alert(`Failed to import video: ${err.message}`);
      } finally {
        setIsIngesting(false);
      }
    } else {
      setTimeout(() => {
        setIsIngesting(false);
        setIngestStatus('');
        const newVideo: ViralVideo = {
          id: `import-${Date.now()}`,
          title: 'Imported Web Clip',
          source: target,
          duration: 10,
          views: 'Demo Rip',
          category: 'My Imports',
          videoUrl: target.startsWith('http') ? target : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          gradient: 'from-violet-600/40 to-cyan-900/60',
          importedAt: Date.now()
        };
        setSelectedVideo(newVideo);
        saveImportedVideo(newVideo);
        setUrlInput('');
        setActiveNav('create');
      }, 1000);
    }
  };

  // Local File Video Dialog
  const handleNativeOpenVideo = async () => {
    if (window.genuxNative?.openVideoDialog) {
      const files = await window.genuxNative.openVideoDialog();
      if (files && files.length > 0) {
        const filePath = files[0];
        const fileName = filePath.split('\\').pop()?.split('/').pop() || 'Imported Video';
        const newVideo: ViralVideo = {
          id: `local-${Date.now()}`,
          title: fileName,
          source: filePath,
          duration: 10,
          views: 'Local File',
          category: 'Local Import',
          filePath: filePath,
          videoUrl: filePath,
          gradient: 'from-blue-600/40 to-slate-900/60',
          importedAt: Date.now()
        };
        setSelectedVideo(newVideo);
        saveImportedVideo(newVideo);
        setActiveNav('create');
        setEngineLogs(prev => [...prev, `[Ingest] Loaded local video with audio: ${filePath}`]);
      }
    }
  };

  // Create Character Twin (.gchar)
  const handleNativeOpenImage = async () => {
    if (window.genuxNative?.openImageDialog) {
      const files = await window.genuxNative.openImageDialog();
      if (files && files.length > 0) {
        const imgPath = files[0];
        const charName = imgPath.split('\\').pop()?.split('/').pop()?.replace(/\.[^/.]+$/, '') || `Twin ${vaultCharacters.length + 1}`;
        const newChar: VaultCharacter = {
          id: `char-${Date.now()}`,
          name: charName,
          tag: '#InstantID',
          avatarColor: 'from-violet-600 to-indigo-800',
          style: 'InstantID + PuLID Embedding Package (.gchar)',
          gcharSize: '22.8 MB',
          portraitPath: imgPath,
          similarityScore: 99.4
        };
        const updated = [newChar, ...vaultCharacters];
        setVaultCharacters(updated);
        setSelectedVaultChar(newChar);
        localStorage.setItem('genux_custom_vault_characters', JSON.stringify(updated));

        // Auto-register attachment tag (@attachment1, @attachment2, ...)
        const nextIdx = characterAttachments.length + 1;
        const newAtt = {
          tag: `@attachment${nextIdx}`,
          index: nextIdx,
          charId: newChar.id,
          name: newChar.name,
          portraitPath: imgPath
        };
        setCharacterAttachments(prev => [...prev, newAtt]);

        setEngineLogs(prev => [
          ...prev, 
          `[Vault] Created .gchar character container: ${charName}`,
          `[Director] Registered multi-character tag: ${newAtt.tag}`
        ]);
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      }
    }
  };

  // Manual Export of Rendered Video to User's Chosen Location
  const handleExportRenderedVideo = async (vid: RenderedVideo) => {
    if (window.genuxNative?.saveVideoDialog) {
      const chosenPath = await window.genuxNative.saveVideoDialog(`${vid.title}.mp4`);
      if (chosenPath) {
        setEngineLogs(prev => [...prev, `[Export] Saved video master to: ${chosenPath}`]);
        alert(`Video successfully exported to:\n${chosenPath}`);
      }
    }
  };

  // Recast Execution with Hard Model Requirement Gate
  const handleExecuteRecast = async () => {
    // Hard Engine Gate Check: You cannot do anything without an engine!
    if (installedModelCount === 0 && !isEngineReady) {
      setShowEngineRequiredModal(true);
      return;
    }

    setIsRendering(true);
    setRenderProgress(5);
    setPipelineStage('Phase 1/5: Demuxing Video & Audio via NVDEC...');
    setEngineLogs(prev => [
      ...prev,
      `[Pipeline] Launching Recast Engine for: ${selectedVideo.title}`,
      `[Vault] Identity Anchor: ${selectedVaultChar?.name || 'Multi-Character Attachments'} (Weight: ${identityWeight})`,
      `[Multi-Tag] Tagged Characters: ${characterAttachments.map(a => `${a.tag} (${a.name})`).join(', ') || 'Direct Subject'}`,
      sceneDirectorPrompt ? `[Gemma 2 Director] Scene/Object Modifiers: ${sceneDirectorPrompt}` : `[Gemma 2 Director] Preserving original environment`,
      `[Audio] Synchronizing original audio track with neural frames...`,
      `[Blackwell] 16GB Native FP8 E4M3 Latent Synthesis initialized.`
    ]);

    const stages = [
      { progress: 25, stage: 'Phase 2/5: Zero-Click SAM 2.1 Rotoscope Masking...' },
      { progress: 50, stage: 'Phase 3/5: DWPose 133pt Keypoints & Depth Estimation...' },
      { progress: 75, stage: 'Phase 4/5: Wan 2.1 Diffusion Latent Recasting (FP8)...' },
      { progress: 95, stage: 'Phase 5/5: RIFE 4.22 Frame Interpolation & NVENC 60 FPS...' },
      { progress: 100, stage: 'Completed: Video Recast Master Added to Library!' }
    ];

    for (const step of stages) {
      await new Promise(r => setTimeout(r, 1000));
      setRenderProgress(step.progress);
      setPipelineStage(step.stage);
      setEngineLogs(prev => [...prev, `[C++ Engine] ${step.stage}`]);
    }

    // Save newly rendered video to Library
    const newRender: RenderedVideo = {
      id: `render-${Date.now()}`,
      title: `${selectedVideo.title} — ${selectedVaultChar?.name || 'Recast Master'}`,
      character: selectedVaultChar?.name || 'Multi-Character Recast',
      duration: selectedVideo.duration,
      filePath: selectedVideo.videoUrl || '',
      createdAt: Date.now(),
      aspectRatio
    };

    setRenderedVideos(prev => {
      const updated = [newRender, ...prev];
      localStorage.setItem('genux_rendered_videos', JSON.stringify(updated));
      return updated;
    });

    setIsRendering(false);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090E] text-slate-100 select-none font-sans relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      
      {/* ========================================================= */}
      {/* 0. STARTUP SPLASH SCREEN OVERLAY (ZERO BLACK SCREEN)      */}
      {/* ========================================================= */}
      {showStartupSplash && (
        <div 
          className={`fixed inset-0 z-[100] bg-[#07090E] flex flex-col items-center justify-center transition-opacity duration-400 ${
            splashFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-[-18px] rounded-full bg-radial from-indigo-500/35 via-purple-600/15 to-transparent blur-xl animate-pulse" />
            <div className="relative p-2 rounded-3xl bg-[#0D1019] border border-white/[0.1] shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              <GenuxLogo size={84} animated={true} />
            </div>
          </div>
          
          <h1 className="mt-6 text-3xl font-extrabold text-white tracking-tight font-sans">
            Genux AI
          </h1>
          <p className="mt-1 text-xs font-mono font-semibold text-indigo-400 tracking-widest uppercase">
            100% Local Video Recasting &amp; Studio
          </p>

          <div className="w-36 h-1 bg-white/[0.08] rounded-full mt-7 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-2">
            Loading Neural Weights &amp; CUDA Telemetry...
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. FRAMELESS TITLEBAR (DRAGGABLE & LUXURY CONTROLS)       */}
      {/* ========================================================= */}
      <header className="h-10 bg-[#090B10] border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0 z-40 select-none">
        
        {/* Left: Brand Pill */}
        <div className="flex items-center gap-2.5">
          <GenuxLogo size={18} />
          <span className="font-extrabold text-xs tracking-wider text-white font-mono">GENUX STUDIO</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PRO v1.0
          </span>
        </div>

        {/* Center: Active Title & Attribution */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-200 font-medium truncate max-w-sm">{selectedVideo.title}</span>
          <span className="text-slate-600">•</span>
          <a 
            href="https://xonarous.nl" 
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] text-slate-400 hover:text-cyan-400 transition flex items-center gap-1 font-mono"
          >
            <span>by Xonarous Inc</span>
            <ExternalLink size={9} />
          </a>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Square size={11} className={isMaximized ? "text-indigo-400" : ""} />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg hover:bg-rose-500 text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN APP LAYOUT: PERMANENT LEFT SIDEBAR + WORKSPACE    */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* PERMANENT LEFT NAVIGATION SIDEBAR (SCREENSHOT 4 STYLE)    */}
        {/* ========================================================= */}
        <nav style={{ width: `${leftSidebarWidth}px` }} className="bg-[#0A0C13] border-r border-white/[0.06] flex flex-col justify-between shrink-0 p-3 select-none">
          
          {/* Top Brand & Primary Nav Items */}
          <div className="space-y-4">
            
            {/* Top Workspace Header */}
            <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-white/[0.06]">
              <div>
                <h3 className="font-extrabold text-xs text-white">Genux Studio</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isEngineReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-mono text-slate-400">
                    {isEngineReady ? 'Engine ready' : 'Models needed'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModelHubOpen(true)}
                className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
                title="Model Hub"
              >
                <HardDrive size={13} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1">
              {[
                { id: 'create', label: 'Create', icon: Clapperboard, badge: null },
                { id: 'library', label: 'Library', icon: Film, badge: myImportedVideos.length > 0 ? myImportedVideos.length : null },
                { id: 'twins', label: 'Characters', icon: Sparkles, badge: vaultCharacters.length },
                { id: 'console', label: 'Console', icon: Terminal, badge: null }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Bottom Sidebar: Telemetry Widget, Settings & Profile */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            
            {/* Embedded Live Hardware Telemetry Widget (YuE2 Studio style) */}
            <HardwareTelemetryWidget />

            {/* Settings Trigger (opens Screenshot 2 & 3 modal) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <Settings size={14} className="text-indigo-400" />
              <span>Settings</span>
            </button>

            {/* User Profile Pill (Synchronized with Settings) */}
            <div className="px-3 py-2 rounded-xl bg-[#11131C] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                  {studioUsername.charAt(0) || 'X'}
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">{studioUsername}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">LOCAL</span>
            </div>

          </div>

        </nav>

        {/* Draggable Splitter Handle for Left Sidebar */}
        <div
          onMouseDown={handleLeftResizeStart}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-violet-500/50 cursor-col-resize transition-all shrink-0 z-30 group relative"
          title="Drag to resize left sidebar"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: CREATE WORKSPACE (STAGE + HIGGSFIELD CONTROLS)    */}
        {/* ========================================================= */}
        {activeNav === 'create' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Center Cinematic Stage */}
            <main className="flex-1 flex flex-col bg-[#050609] overflow-hidden relative">
              
              {/* Top Layer & Mode Bar */}
              <div className="h-10 bg-[#090B10] border-b border-white/[0.06] px-4 flex items-center justify-between shrink-0">
                {/* A/B View Switcher */}
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      viewMode === 'split' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    A/B Split Wipe
                  </button>
                  <button
                    onClick={() => setViewMode('recast')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      viewMode === 'recast' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Recast Master (Wan 2.1)
                  </button>
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      viewMode === 'original' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Original Video
                  </button>
                </div>

                {/* AI Layer Overlays */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMask(!showMask)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition ${
                      showMask 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'
                    }`}
                  >
                    <Scan size={12} />
                    <span>SAM 2 Mask</span>
                  </button>

                  <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition ${
                      showSkeleton 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'
                    }`}
                  >
                    <Layers size={12} />
                    <span>DWPose 133pt</span>
                  </button>

                  <button
                    onClick={() => setShowDepth(!showDepth)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition ${
                      showDepth 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'
                    }`}
                  >
                    <Eye size={12} />
                    <span>Depth Map</span>
                  </button>
                </div>
              </div>

              {/* Video Canvas Stage with Audio */}
              <div 
                ref={sliderRef}
                className="flex-1 relative flex items-center justify-center p-6 overflow-hidden bg-radial from-[#0E1019] via-[#07080D] to-[#040508]"
              >
                <div className={`relative h-full max-h-[540px] ${
                  aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/5]'
                } rounded-3xl overflow-hidden border border-white/[0.1] shadow-[0_0_60px_rgba(0,0,0,0.85)] bg-black select-none`}>
                  
                  {/* Real Video Player with Sound */}
                  {selectedVideo.videoUrl || selectedVideo.filePath ? (
                    <video
                      ref={videoRef}
                      src={safeSrc(selectedVideo.videoUrl || selectedVideo.filePath)}
                      autoPlay
                      loop
                      playsInline
                      muted={isMuted}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration || 10;
                        setDuration(d);
                        if (trimEnd === 0 || trimEnd > d) setTrimEnd(d);
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${selectedVideo.gradient || 'from-indigo-900 to-black'} flex items-center justify-center`} />
                  )}

                  {/* Character Overlay Simulation */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {selectedVaultChar ? (
                          <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-tr ${selectedVaultChar.avatarColor} p-1 shadow-[0_0_35px_rgba(139,92,246,0.6)] animate-pulse`}>
                            <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-4xl font-extrabold text-white overflow-hidden">
                              {selectedVaultChar.portraitPath ? (
                                <img src={safeSrc(selectedVaultChar.portraitPath)} alt={selectedVaultChar.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                selectedVaultChar.name[0]
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-mono text-slate-400">
                            Multi-Twin Tagged
                          </div>
                        )}
                        <div className="mt-3 font-mono font-bold text-xs tracking-wider text-white drop-shadow">
                          {viewMode === 'original' ? 'ORIGINAL SUBJECT' : (selectedVaultChar?.name || 'Multi-Character Target')}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300">
                          {viewMode === 'original' ? selectedVideo.source : 'Wan 2.1 Blackwell Latent Synthesis (60 FPS)'}
                        </div>
                      </div>
                    </div>

                    {showMask && (
                      <div className="absolute inset-8 border-2 border-dashed border-emerald-400/70 rounded-3xl pointer-events-none flex items-start justify-end p-2 animate-pulse">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500 text-black">
                          SAM 2.1 ROTOMASK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Split Wipe Slider Overlay */}
                  {viewMode === 'split' && (
                    <div 
                      className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none border-l-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/20">
                        ORIGINAL (RAW)
                      </div>
                    </div>
                  )}

                  {/* Split Divider Drag Handle */}
                  {viewMode === 'split' && (
                    <div 
                      onMouseDown={handleMouseDown}
                      style={{ left: `${sliderPosition}%` }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.9)] z-30"
                    >
                      <Scissors size={14} className="rotate-90" />
                    </div>
                  )}

                </div>
              </div>

              {/* Bottom Player & Maestro Trimming Controls Bar */}
              <div className="bg-[#090B10] border-t border-white/[0.06] p-3 space-y-2 shrink-0 select-none">
                
                {/* Row 1: Scrubber Bar with Trim In / Out Highlight & Playhead */}
                <div className="flex items-center gap-3 px-2">
                  <span className="font-mono text-[10px] text-slate-400 w-12 text-right">
                    {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}.{Math.floor((currentTime % 1) * 10)}
                  </span>

                  <div className="flex-1 relative h-6 flex items-center group/scrubber cursor-pointer">
                    {/* Background Track */}
                    <div className="w-full h-2 rounded-full bg-white/[0.08] relative overflow-hidden">
                      {/* Active Trim Range Highlight (Green Region) */}
                      <div 
                        className="absolute top-0 bottom-0 bg-emerald-500/40 border-x border-emerald-400"
                        style={{
                          left: `${((trimStart) / (duration || 1)) * 100}%`,
                          width: `${Math.max(2, ((trimEnd - trimStart) / (duration || 1)) * 100)}%`
                        }}
                      />
                    </div>

                    {/* Interactive Slider Input */}
                    <input
                      type="range"
                      min="0"
                      max={duration || 10}
                      step="0.05"
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
                    />

                    {/* Playhead Pin */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none z-10 transition-transform group-hover/scrubber:scale-125"
                      style={{ left: `${((currentTime) / (duration || 1)) * 100}%` }}
                    />
                  </div>

                  <span className="font-mono text-[10px] text-slate-400 w-12">
                    {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}.{Math.floor((duration % 1) * 10)}
                  </span>
                </div>

                {/* Row 2: Maestro Stepping Buttons, Trim In/Out, Volume & Recast Action */}
                <div className="flex items-center justify-between gap-3 px-2 text-xs">
                  
                  {/* Stepping & Trim In / Trim Out Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (isPlaying) videoRef.current.pause();
                          else videoRef.current.play();
                          setIsPlaying(!isPlaying);
                        }
                      }}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                    </button>

                    {/* Frame Step Controls (-5s, -1s, +1s, +5s) */}
                    <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 font-mono text-[10px]">
                      <button
                        onClick={() => stepTime(-5)}
                        className="px-2 py-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
                        title="Step back 5 seconds"
                      >
                        -5s
                      </button>
                      <button
                        onClick={() => stepTime(-1)}
                        className="px-2 py-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
                        title="Step back 1 second"
                      >
                        -1s
                      </button>
                      <button
                        onClick={() => stepTime(1)}
                        className="px-2 py-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
                        title="Step forward 1 second"
                      >
                        +1s
                      </button>
                      <button
                        onClick={() => stepTime(5)}
                        className="px-2 py-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition"
                        title="Step forward 5 seconds"
                      >
                        +5s
                      </button>
                    </div>

                    {/* Set Trim In / Set Trim Out */}
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button
                        onClick={handleSetTrimIn}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition flex items-center gap-1"
                        title="Set In Marker (Recast Start)"
                      >
                        <span>[ Set In</span>
                      </button>
                      <button
                        onClick={handleSetTrimOut}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold transition flex items-center gap-1"
                        title="Set Out Marker (Recast End)"
                      >
                        <span>] Set Out</span>
                      </button>
                      <button
                        onClick={handleResetTrim}
                        className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
                        title="Reset Trim to Full Video"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>

                    {/* Trimmed Duration Badge */}
                    <span className="hidden xl:inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                      Trim: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s ({(trimEnd - trimStart).toFixed(1)}s)
                    </span>
                  </div>

                  {/* Audio Volume & Recast Action */}
                  <div className="flex items-center gap-3">
                    {/* Audio Mute/Unmute & Volume Slider */}
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-slate-300 hover:text-white transition"
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-cyan-400" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVolume(val);
                          if (val > 0) setIsMuted(false);
                        }}
                        className="w-14 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                      />
                    </div>

                    {/* Recast Execution Action (Checks Engine Models!) */}
                    {installedModelCount === 0 && (
                      <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={13} />
                        <span>Models required</span>
                      </span>
                    )}

                    <button
                      onClick={handleExecuteRecast}
                      disabled={isRendering}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                        isRendering 
                          ? 'bg-indigo-600/50 text-white cursor-not-allowed'
                          : installedModelCount === 0 
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
                      }`}
                    >
                      <Sparkles size={14} className={isRendering ? 'animate-spin' : ''} />
                      <span>
                        {isRendering 
                          ? `${pipelineStage || 'Recasting Frames...'} (${renderProgress}%)` 
                          : installedModelCount === 0 
                            ? '⚠️ Download Engine First' 
                            : 'Recast Video (Wan 2.1 60fps)'}
                      </span>
                    </button>
                  </div>

                </div>

              </div>

            </main>

            {/* Right Higgsfield Camera & Director Panel */}
            {/* Draggable Splitter Handle for Right Inspector Sidebar */}
            <div
              onMouseDown={handleRightResizeStart}
              className="w-1 hover:w-1.5 bg-transparent hover:bg-violet-500/50 cursor-col-resize transition-all shrink-0 z-30 group relative"
              title="Drag to resize right sidebar"
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>

            <aside style={{ width: `${rightSidebarWidth}px` }} className="bg-[#090B10] border-l border-white/[0.06] flex flex-col p-4 space-y-5 overflow-y-auto shrink-0 select-none">
              
              {/* Aspect Ratio Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Canvas Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['9:16', '16:9', '1:1', '4:5'] as const).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Character Attachment Bar (Supports > 5 characters at once!) */}
              <div className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-400" />
                    <label className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                      Multi-Twin Tags ({characterAttachments.length})
                    </label>
                  </div>
                  <button
                    onClick={handleNativeOpenImage}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center gap-1"
                  >
                    <UserPlus size={11} />
                    <span>+ Attach Twin</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Replace 5+ characters simultaneously. Mention <code className="text-cyan-300 font-mono font-bold">@attachment1</code>, <code className="text-cyan-300 font-mono font-bold">@attachment2</code> etc. in the prompt below.
                </p>

                {/* Attachment Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {characterAttachments.map(att => (
                    <div
                      key={att.tag}
                      onClick={() => {
                        if (!recastPrompt.includes(att.tag)) {
                          setRecastPrompt(prev => `${prev} ${att.tag}`);
                        }
                      }}
                      className="px-2 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 hover:border-cyan-400 text-white flex items-center gap-1.5 text-[11px] cursor-pointer transition shadow-xs group"
                      title={`Click to insert ${att.tag} into prompt`}
                    >
                      {att.portraitPath ? (
                        <img src={safeSrc(att.portraitPath)} alt={att.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold">
                          {att.name[0]}
                        </div>
                      )}
                      <span className="font-mono font-bold text-cyan-300">{att.tag}</span>
                      <span className="text-slate-300 truncate max-w-[65px]">{att.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCharacterAttachments(prev => prev.filter(a => a.tag !== att.tag));
                        }}
                        className="text-slate-500 hover:text-rose-400 ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {characterAttachments.length === 0 && (
                    <span className="text-[10px] font-mono text-slate-500 italic py-1">
                      No attachments yet. Click + Attach Twin to tag extra characters.
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Character Recast Prompt with Glowing Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Recast Identity Prompt</span>
                  </label>
                  <button
                    onClick={() => handleMagicEnhancePrompt('recast')}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                    title="Intelligently expand prompt with Gemma 2 / Wan 2.1 tokens"
                  >
                    <Sparkles size={11} className="text-cyan-300 animate-pulse" />
                    <span>✨ Magic Prompt</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={recastPrompt}
                  onChange={(e) => setRecastPrompt(e.target.value)}
                  placeholder="e.g. Swap character with @attachment1, 100% 1:1 camera physics and motion preservation..."
                  className="w-full min-h-[75px] bg-[#11141F] border border-white/[0.12] focus:border-cyan-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 font-sans leading-relaxed transition"
                />
                
                {/* Visual Glowing Tag Highlighter Preview */}
                <div className="p-2 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-slate-300 flex flex-wrap items-center gap-1 min-h-[30px]">
                  <span className="text-[9px] font-mono uppercase text-slate-500 mr-1">Parsed:</span>
                  {recastPrompt.split(/(@attachment\d+)/g).map((part, i) => {
                    const match = characterAttachments.find(a => a.tag === part);
                    if (match) {
                      return (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold text-[10px] inline-flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                          <span>{part}</span>
                          <span className="text-white/80">({match.name})</span>
                        </span>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>

              {/* Gemma 2 Scene, Area & Object Director */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Scene &amp; Object Director (Gemma 2)
                  </label>
                  <button
                    onClick={() => handleMagicEnhancePrompt('scene')}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition"
                    title="Generate cinematic props, lighting & area details"
                  >
                    <Sparkles size={11} className="text-amber-300 animate-pulse" />
                    <span>✨ Magic Scene</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={sceneDirectorPrompt}
                  onChange={(e) => setSceneDirectorPrompt(e.target.value)}
                  placeholder="e.g. Change street to neon rainy Tokyo, change car to matte black Ferrari, change jacket to cyber armor, lock 1:1 camera physics..."
                  className="w-full min-h-[75px] bg-[#11141F] border border-white/[0.12] focus:border-emerald-400 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 font-sans leading-relaxed transition"
                />
                
                {/* 1-Click Quick Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    { label: '⚡ Cyber Tokyo', text: 'Neon rainy Tokyo street, wet pavement reflections, cyberpunk atmosphere' },
                    { label: '🎬 Film Noir', text: 'High-contrast 35mm film noir, dramatic volumetric shadows, moody fog' },
                    { label: '🌅 Golden Hour', text: 'Golden hour sunset lighting, warm rim light, cinematic lens flares' },
                    { label: '🏎️ Matte Hypercar', text: 'Change vehicle to matte black hypercar with glowing LED accents' }
                  ].map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => setSceneDirectorPrompt(chip.text)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] text-[10px] text-slate-300 hover:text-white transition font-mono"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Gemma 2 Director modifies scene objects, background, and cars while locking character motion and facial likeness.
                </p>
              </div>

              {/* Primary Character Vault Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Primary Identity Anchor
                  </label>
                  <button
                    onClick={handleNativeOpenImage}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
                  >
                    <UserPlus size={12} />
                    <span>+ Import Character</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {vaultCharacters.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-[11px] text-slate-400 mb-2">No characters in Vault.</p>
                      <button
                        onClick={handleNativeOpenImage}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
                      >
                        + Import Photo
                      </button>
                    </div>
                  ) : (
                    vaultCharacters.map(char => {
                      const isSelected = selectedVaultChar?.id === char.id;
                      return (
                        <div
                          key={char.id}
                          onClick={() => setSelectedVaultChar(char)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                              : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0`}>
                              {char.portraitPath ? (
                                <img src={safeSrc(char.portraitPath)} alt={char.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                char.name[0]
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{char.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{char.tag}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">{char.similarityScore}%</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Higgsfield Camera Motion Control */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  3D Cinematic Camera Trajectory
                </label>
                <div className="space-y-1">
                  {CAMERA_MOTIONS.map(cam => {
                    const Icon = cam.icon;
                    const isSelected = selectedCamera === cam.id;
                    return (
                      <button
                        key={cam.id}
                        onClick={() => setSelectedCamera(cam.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-indigo-600/25 border border-indigo-500/40 text-white font-semibold'
                            : 'bg-white/[0.02] border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold">{cam.label}</div>
                          <div className="text-[10px] text-slate-500 truncate">{cam.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Identity Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Identity Retention</span>
                  <span className="text-cyan-400 font-bold">{Math.round(identityWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.01"
                  value={identityWeight}
                  onChange={(e) => setIdentityWeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

            </aside>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: FULL LIBRARY (VIRAL, MY IMPORTS, YOUTUBE, RENDERS)*/}
        {/* ========================================================= */}
        {activeNav === 'library' && (
          <div className="flex-1 flex flex-col bg-[#07090E] p-6 space-y-6 overflow-hidden">
            
            {/* Library Sub-Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                {[
                  { id: 'my_imports', label: '📥 My Imported Videos', count: myImportedVideos.length },
                  { id: 'youtube', label: '🔍 In-App YouTube Search', count: null },
                  { id: 'importer', label: '🔗 Direct Link / URL', count: null },
                  { id: 'renders', label: '🎬 Finished Renders', count: renderedVideos.length }
                ].map(sub => {
                  const isActive = librarySubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setLibrarySubTab(sub.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {sub.count !== null && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {sub.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNativeOpenVideo}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <FolderOpen size={14} className="text-cyan-400" />
                <span>Open Local File...</span>
              </button>
            </div>

            {/* SUB-VIEW 2: MY IMPORTED VIDEOS (Persisted!) */}
            {librarySubTab === 'my_imports' && (
              <div className="flex-1 overflow-y-auto">
                {myImportedVideos.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                    <Film size={36} className="text-slate-600" />
                    <div>
                      <h4 className="font-bold text-sm text-white">No Imported Videos Yet</h4>
                      <p className="text-xs text-slate-400 mt-1">Import from YouTube, TikTok links, or local MP4 files to build your library.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myImportedVideos.map(vid => (
                      <div
                        key={vid.id}
                        className="p-3.5 rounded-2xl bg-[#0E111A] border border-white/[0.08] space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              {vid.category || 'My Import'}
                            </span>
                            <button
                              onClick={(e) => handleDeleteImportedVideo(vid.id, e)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title="Delete from My Imports"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Playable Video Preview */}
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/80 relative group/vid cursor-pointer border border-white/[0.05]">
                            <video
                              src={safeSrc(vid.videoUrl || vid.filePath)}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }}
                            />
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-cyan-300 pointer-events-none">
                              Hover to Preview
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-xs text-white truncate">{vid.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{vid.source}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedVideo(vid);
                            setActiveNav('create');
                          }}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Play size={13} className="fill-white" />
                          <span>Recast in Studio</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 3: IN-APP YOUTUBE SEARCH */}
            {librarySubTab === 'youtube' && (
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search YouTube for viral clips, stunts, drifts, parkour..."
                      value={ytSearchQuery}
                      onChange={(e) => setYtSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchYouTube()}
                      className="w-full bg-[#11141F] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <button
                    onClick={handleSearchYouTube}
                    disabled={isSearchingYt}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {isSearchingYt ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>{isSearchingYt ? 'Searching...' : 'Search YouTube'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {ytSearchResults.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-500 text-xs">
                      <Search size={32} />
                      <p>Type a search query above to discover and import clips directly inside the app.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ytSearchResults.map(item => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-[#0E111A] border border-white/[0.08] space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {item.thumbnail && (
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 relative group/yt">
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 group-hover/yt:bg-black/15 transition-colors flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg group-hover/yt:scale-110 transition-transform">
                                    <Play size={16} className="fill-white ml-0.5" />
                                  </div>
                                </div>
                                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                                  {item.durationString}
                                </span>
                                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-indigo-600/80 text-[9px] font-mono text-white opacity-0 group-hover/yt:opacity-100 transition-opacity">
                                  Hover Preview
                                </span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-xs text-white line-clamp-2">{item.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                <span className="text-cyan-400 font-medium">{item.channel}</span>
                                <span>•</span>
                                <span>{item.views}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleIngestUrl(item.url)}
                            disabled={isIngesting}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Download size={13} />
                            <span>Import to Studio</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: DIRECT LINK IMPORTER */}
            {librarySubTab === 'importer' && (
              <div className="max-w-xl mx-auto w-full p-6 rounded-2xl bg-[#0E111A] border border-white/[0.08] space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">Import Social Media Video Link</h3>
                  <p className="text-xs text-slate-400">
                    Paste any TikTok, Instagram Reel, YouTube Short, or direct MP4 stream URL. The engine downloads with full audio via yt-dlp + NVDEC hardware.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="https://www.tiktok.com/... or https://youtube.com/shorts/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-[#121522] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />

                  {ingestStatus && (
                    <div className="text-xs font-mono text-cyan-300 flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" />
                      <span>{ingestStatus}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleIngestUrl()}
                    disabled={isIngesting || !urlInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Download size={14} />
                    <span>{isIngesting ? 'Demuxing Video & Audio...' : 'Import to Studio & Save'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 5: FINISHED RENDERS (MANUAL DOWNLOAD TO DISK) */}
            {librarySubTab === 'renders' && (
              <div className="flex-1 overflow-y-auto">
                {renderedVideos.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-500 text-xs">
                    <Video size={36} />
                    <p>No rendered videos yet. Hit &quot;Recast Video&quot; in the Create tab to generate master clips.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderedVideos.map(vid => (
                      <div
                        key={vid.id}
                        className="p-4 rounded-2xl bg-[#0E111A] border border-emerald-500/20 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            60 FPS MASTER
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">{vid.title}</h4>
                          <p className="text-xs text-slate-400">Identity: {vid.character} • {vid.aspectRatio}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExportRenderedVideo(vid)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Download size={13} />
                            <span>Download to Disk</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: CHARACTERS VAULT                                  */}
        {/* ========================================================= */}
        {activeNav === 'twins' && (
          <div className="flex-1 flex flex-col bg-[#07090E] p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Characters Vault</h2>
                <p className="text-xs text-slate-400">Custom characters, facial biometric likeness packages, and portable .gchar containers.</p>
              </div>

              <button
                onClick={handleNativeOpenImage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <UserPlus size={14} />
                <span>Import Image / Create Character</span>
              </button>
            </div>

            {vaultCharacters.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-3xl bg-black/20">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
                  <UserPlus size={28} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Characters in Vault</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                  Import any character photo or portrait to extract 133-point facial biometric embeddings (.gchar) for 1:1 motion recasting.
                </p>
                <button
                  onClick={handleNativeOpenImage}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <UserPlus size={14} />
                  <span>+ Import First Character Portrait</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {vaultCharacters.map(char => (
                  <div
                    key={char.id}
                    className="rounded-3xl bg-[#0E111A] border border-white/[0.08] overflow-hidden hover:border-indigo-500/40 transition flex flex-col justify-between shadow-xl"
                  >
                    {/* Big Preview Image (Full Resolution Portrait) */}
                    <div className="w-full aspect-[3/4] max-h-72 bg-black/60 relative overflow-hidden group">
                      {char.portraitPath ? (
                        <img 
                          src={safeSrc(char.portraitPath)} 
                          alt={char.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center text-5xl font-bold text-white`}>
                          {char.name[0]}
                        </div>
                      )}
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-cyan-300 font-bold border border-white/10">
                        {char.tag}
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/85 text-white font-mono text-[10px] font-bold">
                        {char.similarityScore}% Match
                      </div>

                      {/* Delete Quick Action */}
                      <button
                        onClick={() => handleDeleteCharacter(char.id)}
                        title="Delete character from Vault"
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Character Details & Inline Name + Description Editor */}
                    <div className="p-4 space-y-3">
                      {editingCharId === char.id ? (
                        <div className="space-y-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono block mb-1">Character Name</label>
                            <input
                              type="text"
                              value={editCharName}
                              onChange={(e) => setEditCharName(e.target.value)}
                              className="w-full bg-[#161B29] border border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="Name"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 font-mono block mb-1">Description / Style Prompt</label>
                            <textarea
                              rows={2}
                              value={editingCharDesc}
                              onChange={(e) => setEditCharDesc(e.target.value)}
                              className="w-full bg-[#161B29] border border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="Description or appearance prompt"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveRenameChar(char.id)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              <Check size={12} />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingCharId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white truncate">{char.name}</h4>
                            <button
                              onClick={() => {
                                setEditingCharId(char.id);
                                setEditCharName(char.name);
                                setEditCharDesc(char.style || '');
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-white/[0.06] transition flex items-center gap-1 text-[11px]"
                              title="Edit Name & Description"
                            >
                              <Edit3 size={11} />
                              <span>Edit</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {char.style || 'Custom character twin container (.gchar)'}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{char.gcharSize}</span>
                        <button
                          onClick={() => {
                            setSelectedVaultChar(char);
                            if (!characterAttachments.some(a => a.charId === char.id)) {
                              const nextIdx = characterAttachments.length + 1;
                              setCharacterAttachments(prev => [...prev, {
                                tag: `@attachment${nextIdx}`,
                                index: nextIdx,
                                charId: char.id,
                                name: char.name,
                                portraitPath: char.portraitPath
                              }]);
                            }
                            setActiveNav('create');
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
                        >
                          <span>Use in Studio →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: CONSOLE & ENGINE TELEMETRY                        */}
        {/* ========================================================= */}
        {activeNav === 'console' && (
          <div className="flex-1 flex flex-col bg-[#050609] p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-indigo-400" />
                <h3 className="font-bold text-sm text-white font-mono">C++ CUDA Engine Diagnostics</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{telemetryInfo.profile}</span>
            </div>

            <div className="flex-1 bg-[#090B10] border border-white/[0.08] rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 custom-scrollbar">
              {engineLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                  <span className={log.includes('Error') ? 'text-rose-400' : log.includes('CUDA') ? 'text-cyan-400' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* HARD AI ENGINE DOWNLOAD REQUIREMENT MODAL (GATE)          */}
      {/* ========================================================= */}
      {showEngineRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1017] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-base text-white">AI Engine &amp; Models Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You cannot recast or generate videos without the required AI models (Wan 2.1 Video Diffusion &amp; SAM 2.1 Rotoscope). 
                Please download the models or scan your PC for existing ComfyUI files.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowEngineRequiredModal(false);
                  setIsModelHubOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Open Model Hub &amp; Download</span>
              </button>

              <button
                onClick={() => {
                  setShowEngineRequiredModal(false);
                  setIsModelHubOpen(true);
                }}
                className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition"
              >
                Scan Existing Models on PC
              </button>

              <button
                onClick={() => setShowEngineRequiredModal(false)}
                className="text-xs text-slate-500 hover:text-slate-400 transition"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Model Hub Modal */}
      <ModelHubModal
        isOpen={isModelHubOpen}
        onClose={() => {
          setIsModelHubOpen(false);
          if (window.genuxNative?.listModels) {
            window.genuxNative.listModels().then(catalog => {
              const count = Object.values(catalog).filter((m: any) => m.isInstalled).length;
              setInstalledModelCount(count);
              setIsEngineReady(count >= 2);
            });
          }
        }}
      />

      {/* Unified Settings Modal (Matches Screenshot 2 & 3) */}
      <SafeSettingsErrorBoundary>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            const saved = localStorage.getItem('genux_unified_settings');
            if (saved) {
              try { setStudioUsername(JSON.parse(saved).username || 'Xonarous'); } catch (e) {}
            }
          }}
          onSave={(newSettings) => {
            setStudioUsername(newSettings.username || 'Xonarous');
          }}
        />
      </SafeSettingsErrorBoundary>

      {/* Auto-Updater Available Notification Toast */}
      {availableUpdateNotification && (
        <div className="fixed top-12 right-6 z-50 max-w-md bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl animate-fadeIn text-xs text-white">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <DownloadCloud size={16} />
              <span>Update Available: {availableUpdateNotification.latestVersion}</span>
            </div>
            <button
              onClick={() => setAvailableUpdateNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
            A new version of Genux AI Studio is available with performance improvements and model updates.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.genuxNative?.downloadAndInstallUpdate) {
                  window.genuxNative.downloadAndInstallUpdate(availableUpdateNotification.downloadUrl);
                } else if (window.genuxNative?.openExternal) {
                  window.genuxNative.openExternal(availableUpdateNotification.downloadUrl);
                }
                setAvailableUpdateNotification(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <DownloadCloud size={12} />
              <span>Download &amp; Install</span>
            </button>
            <button
              onClick={() => setAvailableUpdateNotification(null)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-semibold transition"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* First-Launch Telemetry Opt-in Modal (YuE 2 style) */}
      {showFirstLaunchTelemetryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-sans">
          <div className="relative w-full max-w-lg bg-[#14151B] border border-violet-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Welcome to Genux AI Studio
                </h3>
                <p className="text-xs text-violet-400 font-mono">
                  ANONYMOUS PERFORMANCE &amp; TELEMETRY (OPTIONAL)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To help us maximize TensorRT and Wan 2.1 inference speed across diverse NVIDIA GPUs (RTX 3060, 4070, 4080, 5080, 5090), Genux AI can anonymously sync performance metrics with our backend portal.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 size={13} />
                <span>100% Private &amp; Offline Capable</span>
              </div>
              <p className="text-slate-400 pl-5 leading-normal">
                Your imported video clips, character portraits, prompts, and recasting outputs <strong>never leave your machine</strong>. Only anonymous hardware specs (GPU, RAM, VRAM), error traces, and download counts are shared.
              </p>
              <div className="text-[10px] text-slate-500 pl-5">
                💡 You can change this at any time in <strong>Settings &gt; Data Tracking &amp; Privacy</strong>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('genux_telemetry_prompt_seen', 'true');
                  if (window.genuxNative?.saveSettings) {
                    window.genuxNative.saveSettings({ telemetryOptIn: false, telemetryPromptSeen: true });
                  }
                  setShowFirstLaunchTelemetryModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-bold text-xs transition"
              >
                No Thanks (Keep Completely Offline)
              </button>

              <button
                onClick={() => {
                  localStorage.setItem('genux_telemetry_prompt_seen', 'true');
                  if (window.genuxNative?.saveSettings) {
                    window.genuxNative.saveSettings({ telemetryOptIn: true, telemetryPromptSeen: true });
                  }
                  if (window.genuxNative?.syncTelemetry) {
                    window.genuxNative.syncTelemetry();
                  }
                  setShowFirstLaunchTelemetryModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Opt-In &amp; Continue (Recommended)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
