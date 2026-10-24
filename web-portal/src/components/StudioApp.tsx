import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, Sparkles, 
  Layers, Scan, Eye, Cpu, Sliders, ArrowLeft, Download, 
  Check, Film, Link as LinkIcon, UserPlus, HardDrive, 
  Activity, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Key, Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GenuxLogo } from './GenuxLogo';
import { ModelHubModal } from './ModelHubModal';
import { ApiKeysModal } from './ApiKeysModal';
import type { ApiConfig } from './ApiKeysModal';

interface ViralVideo {
  id: string;
  title: string;
  source: string;
  duration: number;
  views: string;
  category: string;
  gradient: string;
}

const VIRAL_TEMPLATES: ViralVideo[] = [
  {
    id: 'tokyo-drift',
    title: 'Neon Tokyo Rooftop Parkour',
    source: 'TikTok Viral (14.2M views)',
    duration: 10,
    views: '14.2M',
    category: 'Stunts & Motion',
    gradient: 'from-amber-600/30 to-purple-900/40'
  },
  {
    id: 'kpop-dance',
    title: 'K-Pop High-Speed Choreography',
    source: 'YouTube Shorts (28.4M views)',
    duration: 15,
    views: '28.4M',
    category: 'Dance & Micro-moves',
    gradient: 'from-pink-600/30 to-indigo-900/40'
  },
  {
    id: 'cyber-fight',
    title: 'Martial Arts Flip Sequence',
    source: 'Instagram Reels (9.8M views)',
    duration: 8,
    views: '9.8M',
    category: 'Combat & Physics',
    gradient: 'from-cyan-600/30 to-slate-900/50'
  },
  {
    id: 'street-strut',
    title: 'Paris Fashion Week Slow-Walk',
    source: 'TikTok Viral (19.1M views)',
    duration: 12,
    views: '19.1M',
    category: 'Lighting & Draping',
    gradient: 'from-emerald-600/30 to-blue-900/40'
  }
];

interface VaultCharacter {
  id: string;
  name: string;
  tag: string;
  avatarColor: string;
  style: string;
  gcharSize: string;
}

const INITIAL_VAULT: VaultCharacter[] = [
  {
    id: 'char-1',
    name: 'Obsidian Ronin',
    tag: '#CyberSamurai',
    avatarColor: 'from-violet-600 to-indigo-800',
    style: 'Carbon-fiber armor & glowing katana',
    gcharSize: '24.2 MB'
  },
  {
    id: 'char-2',
    name: 'Elena Vance',
    tag: '#TechwearRunway',
    avatarColor: 'from-rose-500 to-amber-700',
    style: 'Matte black tactical coat & neon accents',
    gcharSize: '19.8 MB'
  },
  {
    id: 'char-3',
    name: 'Marcus Thorne',
    tag: '#NoirDetective',
    avatarColor: 'from-slate-700 to-slate-900',
    style: 'Vintage trenchcoat & fedora silhouette',
    gcharSize: '22.1 MB'
  },
  {
    id: 'char-4',
    name: 'Valkyrie Mech',
    tag: '#SciFiArmor',
    avatarColor: 'from-cyan-500 to-blue-800',
    style: 'Titanium plating with optical dispersion',
    gcharSize: '28.5 MB'
  }
];

interface StudioAppProps {
  onBackToPortal: () => void;
}

export const StudioApp: React.FC<StudioAppProps> = ({ onBackToPortal }) => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'library' | 'ingest' | 'vault'>('library');
  const [isModelHubOpen, setIsModelHubOpen] = useState<boolean>(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState<boolean>(false);

  // API Director Configuration (Gemma 4 / Gemini / ChatGPT)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('genux_api_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      activeProvider: 'local_gemma',
      geminiKey: '',
      geminiModel: 'gemini-2.0-flash',
      openaiKey: '',
      openaiModel: 'gpt-4o'
    };
  });

  const handleSaveApiConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem('genux_api_config', JSON.stringify(newConfig));
  };

  // Studio State
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo>(VIRAL_TEMPLATES[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [selectedVaultChar, setSelectedVaultChar] = useState<VaultCharacter>(INITIAL_VAULT[0]);
  const [vaultCharacters, setVaultCharacters] = useState<VaultCharacter[]>(INITIAL_VAULT);
  
  // Viewport overlays & toggles
  const [viewMode, setViewMode] = useState<'split' | 'recast' | 'original'>('split');
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showDepth, setShowDepth] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const currentTime = 3.2;

  // Ingest URL State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestSuccess, setIngestSuccess] = useState<boolean>(false);

  // Director Prompt
  const [directorPrompt, setDirectorPrompt] = useState<string>(
    'Harmonize scene illumination to match high-contrast wet asphalt reflections. Transfer LivePortrait micro-expressions with 100% eyelid & lip temporal synchronization.'
  );
  const [isGemmaThinking, setIsGemmaThinking] = useState<boolean>(false);

  // Pipeline Execution State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [pipelineStage, setPipelineStage] = useState<string>('');
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  const [renderComplete, setRenderComplete] = useState<boolean>(false);

  // VRAM calculation based on duration & settings
  const vramUsage = selectedDuration <= 15 ? 12.8 : 14.1;

  // Video Duration Options with time estimates
  const durationOptions = [
    { sec: 5, label: '5s', badge: '⚡ ~30s' },
    { sec: 10, label: '10s', badge: '🔥 ~65s' },
    { sec: 15, label: '15s', badge: '🎯 ~95s' },
    { sec: 30, label: '30s', badge: '🎬 ~3.5m' },
    { sec: 60, label: '60s', badge: '⏳ ~6.8m' }
  ];

  // Ingest Social URL simulation
  const handleIngestUrl = () => {
    if (!urlInput.trim()) return;
    setIsIngesting(true);
    setIngestSuccess(false);

    setTimeout(() => {
      setIsIngesting(false);
      setIngestSuccess(true);
      const newVideo: ViralVideo = {
        id: `custom-${Date.now()}`,
        title: 'Ingested Clip: TikTok Trend #DanceChallenge',
        source: urlInput,
        duration: 12,
        views: 'Direct Stream',
        category: 'Custom Ingest',
        gradient: 'from-violet-600/40 to-slate-900/60'
      };
      setSelectedVideo(newVideo);
      setUrlInput('');
    }, 1800);
  };

  // Gemma / Gemini / ChatGPT Director Re-condition execution
  const handleGemmaDirectorPrompt = () => {
    setIsGemmaThinking(true);
    setTimeout(() => {
      setIsGemmaThinking(false);

      if (apiConfig.activeProvider === 'google_gemini') {
        const geminiPrompts = [
          `[Gemini 2.0 Flash] Volumetric anamorphic cyan rim light. LivePortrait eyelid and lip synchronization locked at 100%. Shutter angle 180 degrees.`,
          `[Gemini 2.0 Pro] High-dynamic-range twilight lighting with wet asphalt reflections. ProPainter clean-plate inpainting behind ${selectedVaultChar.name}.`,
          `[Gemini 2.0 Flash] Precision depth occlusion map via DepthAnything-V2. 60 FPS ultra-smooth frame interpolation enabled.`
        ];
        setDirectorPrompt(geminiPrompts[Math.floor(Math.random() * geminiPrompts.length)]);
      } else if (apiConfig.activeProvider === 'openai_chatgpt') {
        const openaiPrompts = [
          `[ChatGPT ${apiConfig.openaiModel}] Photorealistic dusk lighting with deep ambient contrast. Preserve 100% of camera velocity, motion blur and physics.`,
          `[ChatGPT ${apiConfig.openaiModel}] Recast target with ${selectedVaultChar.name} styling: seamless material physics, specular highlights and zero identity drift.`,
          `[ChatGPT ${apiConfig.openaiModel}] Hyper-coherent action framing: DWPose bone tracking with Wan 2.1 FP8 and RIFE 60fps temporal blending.`
        ];
        setDirectorPrompt(openaiPrompts[Math.floor(Math.random() * openaiPrompts.length)]);
      } else {
        const localPrompts = [
          'Cinematic anamorphic flare with cold tungsten backlight. Transfer micro-expressions with DWPose 133 bones alignment and RIFE 60fps frame interpolation.',
          'High-energy urban twilight lighting. Reconstruct depth map via DepthAnything-V2 to project clean shadow occlusion behind character.',
          'Preserve 100% of the original camera shake and lens distortion. Seamless clean-plate reconstruction via ProPainter.'
        ];
        setDirectorPrompt(localPrompts[Math.floor(Math.random() * localPrompts.length)]);
      }
    }, 850);
  };

  // Add new character to vault
  const handleAddCharacter = () => {
    const names = ['Cyber Kitsune', 'Phantom Operator', 'Aero Glider', 'Solstice Mage'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newChar: VaultCharacter = {
      id: `char-${Date.now()}`,
      name: randomName,
      tag: '#CustomVault',
      avatarColor: 'from-emerald-600 to-teal-800',
      style: 'Custom InstantID + PuLID embedding container',
      gcharSize: '21.4 MB'
    };
    setVaultCharacters([newChar, ...vaultCharacters]);
    setSelectedVaultChar(newChar);
  };

  // Start 5-Stage Render Pipeline Simulation
  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderLogs([]);
    setRenderComplete(false);

    const stages = [
      { progress: 15, name: 'Stage 1: SAM 2.1 Interactive Segmentation & ProPainter Inpainting', log: '[NVDEC] Ingested 1080p frame buffer into CUDA memory. SAM 2 tracked 450 frames.' },
      { progress: 35, name: 'Stage 2: DWPose 133 Keypoint Extraction & DepthAnything-V2', log: '[MotionExtractor] Skeletons & temporal depth synthesized. LivePortrait lip-sync locked.' },
      { progress: 55, name: 'Stage 3: Gemma 4 Director Agent Conditioning via llama.cpp', log: '[GemmaDirector] Structured JSON generated. Lighting & camera weights calculated.' },
      { progress: 85, name: 'Stage 4: Wan 2.1 FP8 TensorRT Diffusion Synthesis', log: '[SynthesisEngine] Wan 2.1 FP8 (E4M3) synthesis running on Blackwell Tensor Cores.' },
      { progress: 100, name: 'Stage 5: RIFE v4.22 60 FPS Interpolation & Color Harmonization', log: '[RIFE] 16fps -> 60fps frame interpolation complete. Zero flicker detected.' }
    ];

    let currentStageIndex = 0;

    const interval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        const stage = stages[currentStageIndex];
        setRenderProgress(stage.progress);
        setPipelineStage(stage.name);
        setRenderLogs(prev => [...prev, stage.log]);
        currentStageIndex++;
      } else {
        clearInterval(interval);
        setIsRendering(false);
        setRenderComplete(true);
        setViewMode('recast');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 select-none">
      {/* Top Header / Workspace Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToPortal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <GenuxLogo size={24} />
            <span className="font-bold text-sm tracking-tight text-slate-900">GENUX AI STUDIO</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              DESKTOP v1.0.4
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-600 font-medium">C++20 Engine: TensorRT 10.x Active</span>
          </div>
        </div>

        {/* Center: Duration & Quality Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Duration:</span>
          {durationOptions.map(opt => (
            <button
              key={opt.sec}
              onClick={() => setSelectedDuration(opt.sec)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedDuration === opt.sec
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-[10px] ${selectedDuration === opt.sec ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                {opt.badge}
              </span>
            </button>
          ))}
        </div>

          {/* Right: VRAM Telemetry, API Keys & Model Hub Trigger */}
        <div className="flex items-center gap-2.5">
          {/* AI Director Selector Button */}
          <button
            onClick={() => setIsApiKeysModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
            title="Configure Gemini & ChatGPT API Keys"
          >
            {apiConfig.activeProvider === 'local_gemma' && <Zap className="w-3.5 h-3.5 text-indigo-600" />}
            {apiConfig.activeProvider === 'google_gemini' && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
            {apiConfig.activeProvider === 'openai_chatgpt' && <Bot className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="hidden md:inline">
              {apiConfig.activeProvider === 'local_gemma' && 'Gemma 4 (Local)'}
              {apiConfig.activeProvider === 'google_gemini' && 'Gemini API'}
              {apiConfig.activeProvider === 'openai_chatgpt' && 'ChatGPT API'}
            </span>
          </button>

          {/* RTX 5080 VRAM Telemetry Gauge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <div className="text-left">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <span>VRAM:</span>
                <span className="font-bold text-slate-800">{vramUsage} GB / 16.0 GB</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    vramUsage > 14.5 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${(vramUsage / 16) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModelHubOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Model Hub</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
        </div>
      </header>

      {/* Main Studio Body Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Drawer / Asset Panel */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xs z-10">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'library'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Viral Library</span>
            </button>
            <button
              onClick={() => setActiveTab('ingest')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ingest'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>URL Ingest</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Vault ({vaultCharacters.length})</span>
            </button>
          </div>

          {/* Tab 1: Viral Library Content */}
          {activeTab === 'library' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Curated Viral Templates
              </div>
              {VIRAL_TEMPLATES.map(video => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedVideo.id === video.id
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`h-20 rounded-lg bg-gradient-to-r ${video.gradient} mb-2 relative flex items-end p-2 border border-slate-200/50 overflow-hidden`}>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                      {video.duration}s
                    </span>
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                      {video.views}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-0.5">{video.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{video.category}</span>
                    <span className="text-indigo-600 font-semibold">1-Click Load</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: URL Ingestor Content */}
          {activeTab === 'ingest' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Direct Social Stream Ingestion</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Powered by <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">yt-dlp</code> with automatic watermark removal & scene-cut split.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste TikTok, YouTube Shorts, or Reels link..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    onClick={handleIngestUrl}
                    disabled={isIngesting || !urlInput.trim()}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isIngesting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Demuxing NVDEC Stream...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Rip Video & Load Viewport</span>
                      </>
                    )}
                  </button>
                </div>

                {ingestSuccess && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Stream Ingested Successfully!</div>
                      <div className="text-[11px] text-emerald-700">Decoded 1080p stream into CUDA device pointers. Zero CPU copies.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-800">Supported Ingestion Sources:</div>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>TikTok (Direct watermark-free MP4)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Instagram Reels (Audio + 1080x1920)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>YouTube Shorts (VP9 / AV1 demux)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Character Vault Content */}
          {activeTab === 'vault' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Saved .gchar Records
                </span>
                <button
                  onClick={handleAddCharacter}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ New</span>
                </button>
              </div>

              {vaultCharacters.map(char => (
                <div
                  key={char.id}
                  onClick={() => setSelectedVaultChar(char)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedVaultChar.id === char.id
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${char.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}>
                      {char.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{char.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{char.gcharSize}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{char.style}</p>
                      <span className="text-[10px] font-semibold text-indigo-600">{char.tag}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center Canvas / Interactive Recast Viewport */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {/* Canvas Sub-Header: Overlays & View Modes */}
          <div className="h-10 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-white z-20">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Viewport:</span>
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setViewMode('recast')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    viewMode === 'recast' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Recast Synthesis
                </button>
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    viewMode === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original Source
                </button>
              </div>
            </div>

            {/* AI Layer Overlays */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMask(!showMask)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                  showMask 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Scan className="w-3 h-3" />
                <span>SAM 2 Mask</span>
              </button>

              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                  showSkeleton 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>DWPose Bones</span>
              </button>

              <button
                onClick={() => setShowDepth(!showDepth)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                  showDepth 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Depth Map</span>
              </button>
            </div>
          </div>

          {/* Canvas Display View */}
          <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Studio Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Split Screen / Single Screen Container */}
            <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative flex">
              {/* LEFT: Original Source with SAM 2 Click Target */}
              {(viewMode === 'split' || viewMode === 'original') && (
                <div className={`relative flex-1 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 border-r border-slate-800 ${viewMode === 'original' ? 'w-full' : ''}`}>
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-slate-300 border border-slate-800 text-[10px] font-mono">
                    ORIGINAL CLIP: {selectedVideo.title}
                  </div>

                  {/* SAM 2 Interactive Tracking Target Visual */}
                  <div className="relative group cursor-crosshair">
                    {showMask && (
                      <div className="w-48 h-72 border-2 border-emerald-400 rounded-3xl bg-emerald-500/10 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                        <span className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold">
                          TARGET #1: PERSON (SAM 2)
                        </span>

                        {showSkeleton && (
                          <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full border border-cyan-400 bg-cyan-400/20 flex items-center justify-center mb-4">
                              <div className="w-2 h-2 rounded-full bg-cyan-300" />
                            </div>
                            <div className="w-0.5 h-20 bg-cyan-400 relative">
                              <div className="absolute top-3 -left-8 w-16 h-0.5 bg-cyan-400" />
                            </div>
                            <div className="flex gap-8">
                              <div className="w-0.5 h-16 bg-cyan-400" />
                              <div className="w-0.5 h-16 bg-cyan-400" />
                            </div>
                          </div>
                        )}

                        <span className="absolute bottom-2 text-[10px] font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded">
                          Click to Re-Target
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RIGHT: Recast Output with Wan 2.1 & Character Vault */}
              {(viewMode === 'split' || viewMode === 'recast') && (
                <div className={`relative flex-1 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 flex flex-col items-center justify-center p-6 ${viewMode === 'recast' ? 'w-full' : ''}`}>
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-indigo-900/70 text-indigo-200 border border-indigo-700/60 text-[10px] font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>WAN 2.1 FP8 RECAST (60 FPS RIFE)</span>
                  </div>

                  {/* Character Recast Visual Preview */}
                  <div className="relative text-center max-w-sm p-6 rounded-2xl bg-slate-900/80 border border-indigo-500/40 shadow-xl backdrop-blur-md">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-2xl shadow-lg mb-3">
                      {selectedVaultChar.name.charAt(0)}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{selectedVaultChar.name}</h3>
                    <p className="text-xs text-slate-300 mb-3">{selectedVaultChar.style}</p>
                    
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero Identity Drift Guaranteed</span>
                    </div>
                  </div>

                  {/* Render Complete Overlay */}
                  {renderComplete && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recast Render Complete! (60 FPS Ready)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rendering Progress Modal Overlay */}
            {isRendering && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-white animate-fadeIn">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="font-bold text-sm">Executing 5-Stage Recast Engine</span>
                    </div>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{renderProgress}%</span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium mb-2">{pipelineStage}</div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>

                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 max-h-24 overflow-y-auto space-y-1 border border-slate-800">
                    {renderLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400">›</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Timeline Bar */}
          <div className="h-16 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex items-center gap-1">
                <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="font-mono text-xs text-slate-300">
                <span>00:0{currentTime.toFixed(2)}</span>
                <span className="text-slate-500"> / 00:{selectedDuration < 10 ? `0${selectedDuration}` : selectedDuration}.00</span>
              </div>
            </div>

            {/* Timeline Scrubbing Track */}
            <div className="flex-1 max-w-xl mx-6">
              <div className="w-full h-3 bg-slate-800 rounded-full relative cursor-pointer overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(currentTime / selectedDuration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0s (SAM 2 Track)</span>
                <span>{selectedDuration / 2}s (Motion Locked)</span>
                <span>{selectedDuration}s (RIFE 60fps)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-1 rounded">
                60 FPS Native
              </span>
            </div>
          </div>
        </div>

        {/* Right Inspector & Director Panel */}
        <div className="w-84 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xs z-10">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recast Inspector</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
              FP8 Blackwell
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active Character Assignment Card */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Character Swapped To:
              </label>
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/30 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${selectedVaultChar.avatarColor} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}>
                  {selectedVaultChar.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{selectedVaultChar.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{selectedVaultChar.style}</div>
                </div>
              </div>
            </div>

            {/* AI Scene Director Prompt with Provider Switcher */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    {apiConfig.activeProvider === 'local_gemma' && <Zap className="w-3 h-3 text-indigo-600" />}
                    {apiConfig.activeProvider === 'google_gemini' && <Sparkles className="w-3 h-3 text-purple-600" />}
                    {apiConfig.activeProvider === 'openai_chatgpt' && <Bot className="w-3 h-3 text-emerald-600" />}
                    <span>Director</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {apiConfig.activeProvider === 'local_gemma' && 'Gemma 4 (Local)'}
                    {apiConfig.activeProvider === 'google_gemini' && `Gemini (${apiConfig.geminiModel.replace('gemini-', '')})`}
                    {apiConfig.activeProvider === 'openai_chatgpt' && `ChatGPT (${apiConfig.openaiModel})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsApiKeysModalOpen(true)}
                    className="text-[10px] text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-0.5"
                    title="Connect API Keys"
                  >
                    <Key className="w-2.5 h-2.5" />
                    <span>Keys</span>
                  </button>
                  <button
                    onClick={handleGemmaDirectorPrompt}
                    disabled={isGemmaThinking}
                    className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isGemmaThinking ? 'animate-spin' : ''}`} />
                    <span>{isGemmaThinking ? 'Thinking...' : 'Regen'}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={directorPrompt}
                onChange={(e) => setDirectorPrompt(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none font-sans"
              />
            </div>

            {/* Pipeline Configuration Parameters */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">TensorRT FP8 Precision</span>
                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Enabled (E4M3)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">RIFE Frame Interpolation</span>
                <span className="text-indigo-700 font-bold text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  60 FPS Ultra-Smooth
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Tiled Spatio-Temporal VAE</span>
                <span className="text-slate-700 font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                  OOM Guard Active
                </span>
              </div>

              {selectedDuration > 15 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold">Long Video Chunking Active:</span> Processing in 5-second overlapping latent slices to protect the 14.5 GB VRAM budget.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>START RECAST ({selectedDuration}S @ 60 FPS)</span>
            </button>
            <div className="text-center text-[10px] text-slate-400 font-mono">
              Est. Wall Clock: ~{selectedDuration <= 5 ? '30s' : selectedDuration <= 15 ? '95s' : '4.5m'} • 100% Local GPU
            </div>
          </div>
        </div>
      </div>

      {/* Model Hub Modal */}
      <ModelHubModal 
        isOpen={isModelHubOpen}
        onClose={() => setIsModelHubOpen(false)}
      />

      {/* AI Director API Keys Modal (Gemini & ChatGPT) */}
      <ApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />
    </div>
  );
};
