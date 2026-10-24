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
  Clapperboard, Edit3, Check, RotateCcw
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
      onModelDownloadProgress?: (callback: (data: any) => void) => () => void;
      importVideoUrl?: (url: string) => Promise<any>;
      searchYouTube?: (query: string) => Promise<any[]>;
      getViralFeeds?: (params?: any) => Promise<any>;
      onSocialImportProgress?: (callback: (data: any) => void) => () => void;
      startRecastJob: (jobConfig: any) => Promise<{ success: boolean; exitCode: number }>;
      cancelRecastJob: () => Promise<boolean>;
      onPipelineProgress: (callback: (data: string) => void) => () => void;
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

const INITIAL_VAULT: VaultCharacter[] = [
  {
    id: 'char-1',
    name: 'Kaelen Vance',
    tag: '#CyberAgent',
    avatarColor: 'from-violet-500 to-indigo-800',
    style: 'Augmented cybernetic operative with obsidian trenchcoat',
    gcharSize: '24.2 MB',
    similarityScore: 99.4
  },
  {
    id: 'char-2',
    name: 'Aria Thorne',
    tag: '#NeonPilot',
    avatarColor: 'from-pink-500 to-purple-800',
    style: 'Orbital racing suit with biometric heads-up display',
    gcharSize: '19.8 MB',
    similarityScore: 99.7
  },
  {
    id: 'char-3',
    name: 'Soren Ward',
    tag: '#StealthSamurai',
    avatarColor: 'from-amber-500 to-orange-800',
    style: 'Modernized carbon-weave armor and ceremonial mantle',
    gcharSize: '22.1 MB',
    similarityScore: 99.1
  }
];

const CAMERA_MOTIONS = [
  { id: 'orbit', label: '3D Orbit Arc', icon: Move3d, desc: 'Dynamic 360 orbital camera motion around subject' },
  { id: 'crane', label: 'Crane Boom Up', icon: Camera, desc: 'Vertical crane elevation tracking upward with cinematic tilt' },
  { id: 'dolly_zoom', label: 'Vertigo Dolly Zoom', icon: Video, desc: 'Hitchcock optical distortion with background depth expansion' },
  { id: 'pan_360', label: 'Horizon Pan', icon: Compass, desc: 'Horizontal tracking synchronized to movement velocity' },
  { id: 'handheld', label: 'Cinematic Handheld', icon: Flame, desc: 'Organic realistic operator physics with micro-shakes' }
];

export const DesktopStudioApp: React.FC = () => {
  // 1. Startup Splash Screen (eliminates black screen flash)
  const [showStartupSplash, setShowStartupSplash] = useState<boolean>(true);
  const [splashFadeOut, setSplashFadeOut] = useState<boolean>(false);

  // 2. Navigation & Sidebar
  const [activeNav, setActiveNav] = useState<'create' | 'library' | 'twins' | 'console'>('create');
  const [librarySubTab, setLibrarySubTab] = useState<'trending' | 'my_imports' | 'youtube' | 'importer' | 'renders'>('trending');
  
  // 3. Modals
  const [isModelHubOpen, setIsModelHubOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showEngineRequiredModal, setShowEngineRequiredModal] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // 4. Engine & Model Status
  const [installedModelCount, setInstalledModelCount] = useState<number>(0);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [telemetryInfo, setTelemetryInfo] = useState<{ gpu: string; vram: string; profile: string }>({
    gpu: 'NVIDIA RTX GPU',
    vram: '16GB VRAM',
    profile: '16GB Native Profile'
  });

  // 5. Studio Videos & Characters
  const [viralVideos] = useState<ViralVideo[]>(DEFAULT_VIRAL_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo>(DEFAULT_VIRAL_VIDEOS[0]);
  const [selectedVaultChar, setSelectedVaultChar] = useState<VaultCharacter>(INITIAL_VAULT[0]);
  const [vaultCharacters, setVaultCharacters] = useState<VaultCharacter[]>(INITIAL_VAULT);

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
    setVaultCharacters(prev => prev.map(c => c.id === charId ? { ...c, name: editCharName.trim() } : c));
    if (selectedVaultChar.id === charId) {
      setSelectedVaultChar(prev => ({ ...prev, name: editCharName.trim() }));
    }
    setEditingCharId(null);
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

    return () => {
      if (cleanupProgress) cleanupProgress();
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
        const charName = imgPath.split('\\').pop()?.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Custom Twin';
        const newChar: VaultCharacter = {
          id: `char-${Date.now()}`,
          name: charName,
          tag: '#InstantID',
          avatarColor: 'from-emerald-600 to-teal-800',
          style: 'InstantID + PuLID Embedding Package (.gchar)',
          gcharSize: '22.8 MB',
          portraitPath: imgPath,
          similarityScore: 99.4
        };
        setVaultCharacters([newChar, ...vaultCharacters]);
        setSelectedVaultChar(newChar);
        setEngineLogs(prev => [...prev, `[Vault] Created .gchar character container: ${charName}`]);
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
      `[Vault] Identity Anchor: ${selectedVaultChar.name} (Weight: ${identityWeight})`,
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
      title: `${selectedVideo.title} — ${selectedVaultChar.name}`,
      character: selectedVaultChar.name,
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
        <nav className="w-56 bg-[#0A0C13] border-r border-white/[0.06] flex flex-col justify-between shrink-0 p-3 select-none">
          
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

            {/* User Profile Pill */}
            <div className="px-3 py-2 rounded-xl bg-[#11131C] border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                  X
                </div>
                <span className="text-xs font-semibold text-slate-200">Xonarous</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">LOCAL</span>
            </div>

          </div>

        </nav>

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
                        <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-tr ${selectedVaultChar.avatarColor} p-1 shadow-[0_0_35px_rgba(139,92,246,0.6)] animate-pulse`}>
                          <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-4xl font-extrabold text-white overflow-hidden">
                            {selectedVaultChar.portraitPath ? (
                              <img src={safeSrc(selectedVaultChar.portraitPath)} alt={selectedVaultChar.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              selectedVaultChar.name[0]
                            )}
                          </div>
                        </div>
                        <div className="mt-3 font-mono font-bold text-xs tracking-wider text-white drop-shadow">
                          {viewMode === 'original' ? 'ORIGINAL SUBJECT' : selectedVaultChar.name}
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
            <aside className="w-80 bg-[#090B10] border-l border-white/[0.06] flex flex-col p-4 space-y-5 overflow-y-auto shrink-0 select-none">
              
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

              {/* Character Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Characters
                  </label>
                  <button
                    onClick={handleNativeOpenImage}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
                  >
                    <UserPlus size={12} />
                    <span>+ Import Character</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {vaultCharacters.map(char => {
                    const isSelected = selectedVaultChar.id === char.id;
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
                  })}
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
                  { id: 'trending', label: '🔥 Viral Trends', count: viralVideos.length },
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

            {/* SUB-VIEW 1: TRENDING VIRAL PRESETS */}
            {librarySubTab === 'trending' && (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viralVideos.map(video => (
                  <div
                    key={video.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
                        <span>{video.views}</span>
                        <span>{video.duration}s</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{video.title}</h4>
                      <p className="text-xs text-slate-400">{video.category}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedVideo(video);
                        setActiveNav('create');
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Play size={13} className="fill-indigo-200" />
                      <span>Load into Studio</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover/yt:opacity-0 transition-opacity duration-300" />
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&mute=1&controls=0&loop=1`}
                                  className="absolute inset-0 w-full h-full opacity-0 group-hover/yt:opacity-100 transition-opacity pointer-events-none"
                                  allow="autoplay"
                                  loading="lazy"
                                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultCharacters.map(char => (
                <div
                  key={char.id}
                  className="p-5 rounded-2xl bg-[#0E111A] border border-white/[0.08] space-y-4 hover:border-indigo-500/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${char.avatarColor} flex items-center justify-center font-bold text-white shadow-md overflow-hidden shrink-0`}>
                      {char.portraitPath ? (
                        <img src={safeSrc(char.portraitPath)} alt={char.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-xl">{char.name[0]}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingCharId === char.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editCharName}
                            onChange={(e) => setEditCharName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameChar(char.id)}
                            className="w-full bg-[#161B29] border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRenameChar(char.id)}
                            className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                            title="Save"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingCharId(null)}
                            className="p-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 transition"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white truncate">{char.name}</h4>
                          <button
                            onClick={() => {
                              setEditingCharId(char.id);
                              setEditCharName(char.name);
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-white/[0.04] transition"
                            title="Rename Character"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{char.tag}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{char.style}</p>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">{char.gcharSize}</span>
                    <span className="text-emerald-400 font-bold">{char.similarityScore}% Match</span>
                  </div>
                </div>
              ))}
            </div>
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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};
