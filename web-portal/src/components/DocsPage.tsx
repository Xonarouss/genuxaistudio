import React, { useState } from 'react';
import { 
  Cpu, HardDrive, Sparkles, 
  ExternalLink, ChevronRight, Search, ShieldCheck, 
  Layers, Video, Zap, CheckCircle2, AlertTriangle, 
  Download, ArrowLeft, Scissors, Globe, Trash2,
  Menu, X, FileText
} from 'lucide-react';
import { GenuxLogo } from './GenuxLogo';

interface DocsPageProps {
  onBackToPortal: () => void;
  onDownloadExe?: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ 
  onBackToPortal, 
  onDownloadExe 
}) => {
  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const navCategories = [
    {
      title: 'Getting Started',
      items: [
        { id: 'quickstart', label: '1. Step-by-Step Quickstart', icon: Zap },
        { id: 'installation', label: '2. Installation & Setup', icon: Download },
        { id: 'hardware', label: '3. Hardware & VRAM (12GB+)', icon: Cpu }
      ]
    },
    {
      title: 'Features & Workflow',
      items: [
        { id: 'characters', label: '4. Characters & Likeness (.gchar)', icon: Sparkles },
        { id: 'maestro', label: '5. Maestro Video Trimming', icon: Scissors },
        { id: 'social', label: '6. Social Importer & Viral Trends', icon: Video }
      ]
    },
    {
      title: 'Neural Architecture',
      items: [
        { id: 'models', label: '7. The 6 Local AI Models', icon: HardDrive },
        { id: 'pipeline', label: '8. 5-Stage C++ Engine Pipeline', icon: Layers },
        { id: 'storage', label: '9. Model Storage & Clean Uninstall', icon: ShieldCheck }
      ]
    },
    {
      title: 'Support & Infrastructure',
      items: [
        { id: 'troubleshooting', label: '10. FAQ & Troubleshooting', icon: AlertTriangle },
        { id: 'hosting', label: '11. VPS Deployment & Domain', icon: Globe },
        { id: 'license', label: '12. AGPL-3.0 License', icon: FileText }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 h-16 bg-[#0B0E17]/95 border-b border-white/[0.08] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white transition"
            title="Toggle Docs Navigation Menu"
          >
            {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <button
            onClick={onBackToPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Website Portal</span>
            <span className="sm:hidden">Portal</span>
          </button>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <GenuxLogo size={26} animated={true} />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white font-mono">GENUX AI</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                OFFICIAL DOCS
              </span>
            </div>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="hidden lg:flex items-center w-72 xl:w-80 relative">
          <Search size={14} className="absolute left-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search documentation (e.g. VRAM, FP8, yt-dlp)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111522] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://github.com/Xonarouss/genuxaistudio"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex text-xs text-slate-400 hover:text-white font-mono transition items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="https://xonarous.nl"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex text-xs text-slate-400 hover:text-cyan-400 font-mono transition items-center gap-1"
          >
            <span>Xonarous Inc</span>
            <ExternalLink size={12} />
          </a>
          {onDownloadExe && (
            <button
              onClick={onDownloadExe}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Get Installer</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-[#0A0D15] border-b border-white/[0.1] px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto z-30">
          <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-2">
            Documentation Index
          </div>
          {navCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {cat.title}
              </div>
              {cat.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileNavOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2.5 ${
                      isActive 
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Main Documentation Layout: Left Sticky Sidebar + Right Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-white/[0.08] p-5 space-y-6 hidden md:block shrink-0">
          <div className="space-y-4">
            {navCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {cat.title}
                </div>
                {cat.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2.5 ${
                        isActive 
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-xs' 
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <div className="p-3.5 rounded-2xl bg-[#0F121C] border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck size={14} />
                <span>100% Offline Capable</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero telemetry, zero remote video uploads. Your facial embeddings and video latents stay strictly on your local GPU.
              </p>
            </div>
          </div>
        </aside>

        {/* Center Content Area */}
        <main className="flex-1 p-8 lg:p-12 max-w-4xl space-y-12 overflow-y-auto custom-scrollbar">
          
          {/* ========================================================= */}
          {/* SECTION 1: QUICKSTART GUIDE                               */}
          {/* ========================================================= */}
          {activeSection === 'quickstart' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
                  <span>GETTING STARTED</span>
                  <ChevronRight size={12} />
                  <span>STEP-BY-STEP QUICKSTART</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Genux AI Studio Quickstart Guide
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Welcome to Genux AI — the state-of-the-art Windows desktop workstation for local AI video character recasting. Follow this comprehensive step-by-step guide to recast your first video in minutes.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-[#0F131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">1</span>
                  <h3 className="text-base font-bold text-white">Download AI Models in the Vault</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upon launching Genux AI, click <strong>Model Hub / Vault</strong> in the top header. You will see the 6 core models. You can either:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-2">
                  <li>Click <strong>Scan Local Caches</strong> to automatically link existing ComfyUI, HuggingFace, or Ollama checkpoints with zero network usage.</li>
                  <li>Click <strong>Download Missing</strong> to download the official FP8 weights directly to your chosen hard drive.</li>
                  <li>At the bottom of the Vault, click <strong>Change Folder...</strong> to choose exactly where weights are saved (e.g. <code>D:\AI_Models</code>).</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-[#0F131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">2</span>
                  <h3 className="text-base font-bold text-white">Import Your Original Video</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Navigate to the <strong>Original Video</strong> tab in the studio. You have 3 easy ways to load content:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-2">
                  <li><strong>Local Files:</strong> Click <em>Open Video File</em> to load any MP4, MKV, MOV, or WebM from your PC.</li>
                  <li><strong>Link Importer:</strong> Paste any direct YouTube, TikTok, or Instagram URL into the link box. The built-in yt-dlp pipeline will download the clip with stereo audio.</li>
                  <li><strong>In-App YouTube Search:</strong> Type any search term into the search box to browse live results with hover video previews and 1-click import.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-[#0F131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">3</span>
                  <h3 className="text-base font-bold text-white">Trim & Scrub with Maestro Controls</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Use the Pinokio Maestro-style scrubbing bar right beneath the video canvas:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-2">
                  <li>Use the <strong>-5s</strong>, <strong>-1s</strong>, <strong>+1s</strong>, and <strong>+5s</strong> buttons for surgical frame precision.</li>
                  <li>Press <strong>[ Set In</strong> to mark where your recasting begins.</li>
                  <li>Press <strong>] Set Out</strong> to mark where your recasting ends.</li>
                  <li>The active trim range will be highlighted on the green timeline track. Only the selected interval will be processed, saving valuable GPU time.</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-[#0F131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">4</span>
                  <h3 className="text-base font-bold text-white">Select or Create a Character</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In the <strong>Characters</strong> tab (or right panel), choose who will replace the subject in the video:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-2">
                  <li>Click <strong>Import Image / Create Character</strong> and pick any sharp portrait photo (PNG/JPG).</li>
                  <li>Genux extracts 512-dimension InsightFace biometric embeddings and packs them into a lightweight <code>.gchar</code> container.</li>
                  <li>You can rename any character at any time by clicking the rename pencil icon.</li>
                  <li>Your uploaded character image is displayed in the Vault card and preview thumbnail.</li>
                </ul>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-[#0F131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center font-mono">5</span>
                  <h3 className="text-base font-bold text-white">Run Recast Video & Export</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the prominent purple <strong>Recast Video</strong> button. Watch the live C++ CUDA engine telemetry, VRAM utilization, and progress log. Once complete:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-2">
                  <li>Compare the original and recasted clip side-by-side using the interactive Split-Wipe slider.</li>
                  <li>Go to <strong>My Library</strong> to see all rendered outputs.</li>
                  <li>Click <strong>Save As...</strong> on any video to export it to any custom folder on your system.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: INSTALLATION & CLEAN UNINSTALL                 */}
          {/* ========================================================= */}
          {activeSection === 'installation' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
                  <span>INSTALLATION</span>
                  <ChevronRight size={12} />
                  <span>SETUP & UNINSTALLATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Installation, Setup & Uninstaller Policy
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Genux AI is packaged as a standalone Windows installer (<code>Genux_AI_Setup_1.0.0.exe</code>) with zero external dependency requirements.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Setup Wizard Steps</h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-slate-300">
                  <p>1. Double-click <strong>Genux_AI_Setup_1.0.0.exe</strong>.</p>
                  <p>2. Choose whether to install for <em>Current User</em> (recommended, no admin elevation required) or <em>All Users</em>.</p>
                  <p>3. Select the installation folder (defaults to <code>%LOCALAPPDATA%\Programs\GenuxAI</code>).</p>
                  <p>4. On the finish page, check <strong>Open README & Documentation</strong> to automatically launch this manual upon completion.</p>
                </div>
              </div>

              {/* Clean Uninstall Guarantee */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <Trash2 size={16} />
                  <span>100% Clean Uninstallation Guarantee</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike traditional Python and ComfyUI setups that leave gigabytes of orphaned checkpoints buried in hidden folders, Genux AI includes an automated NSIS cleanup routine:
                </p>
                <div className="p-3 rounded-xl bg-black/40 font-mono text-xs text-rose-300 space-y-1">
                  <div>RMDir /r "$PROFILE\.cache\genux"</div>
                  <div>RMDir /r "$LOCALAPPDATA\GenuxAI"</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When you uninstall Genux AI via Windows <em>Settings → Installed Apps</em>, all downloaded AI models, temporary video frames, and cache files installed via Genux are completely deleted from your computer.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: HARDWARE & VRAM TIERS                          */}
          {/* ========================================================= */}
          {activeSection === 'hardware' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold">
                  <span>HARDWARE GUIDE</span>
                  <ChevronRight size={12} />
                  <span>VRAM PROFILES & NORMALIZATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Hardware Requirements & VRAM Profiles
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Genux AI is engineered to run on any modern NVIDIA GPU with at least 12GB VRAM. It features automatic hardware detection, nominal memory normalization, and dynamic model profile selection.
                </p>
              </div>

              {/* 15.9 GB to 16 GB Nominal Normalization explanation */}
              <div className="p-4 rounded-2xl bg-[#0E1726] border border-cyan-500/30 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>15.9 GB to 16 GB Nominal Normalization</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Windows display drivers and DirectX reserve ~100–300 MB of physical video memory, causing 16GB GPUs (such as RTX 5080, RTX 4080, RTX 4070 Ti Super) to report ~15.9 GB. Genux AI automatically rounds nominal VRAM so these cards default to the <strong>16GB Native Profile</strong> with zero manual configuration.
                </p>
              </div>

              {/* Profile Table */}
              <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.04] border-b border-white/[0.08] text-slate-300 font-mono">
                      <th className="p-3">GPU Profile</th>
                      <th className="p-3">VRAM Threshold</th>
                      <th className="p-3">Diffusion Precision</th>
                      <th className="p-3">Example Hardware</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-amber-400">12GB Profile</td>
                      <td className="p-3 font-mono">11.8 GB – 14 GB</td>
                      <td className="p-3 font-mono text-cyan-300">FP8 Scaled + Dynamic Layer Offload</td>
                      <td className="p-3">RTX 3060 12GB, RTX 4070 12GB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-indigo-400">16GB Native Profile</td>
                      <td className="p-3 font-mono">15.5 GB – 20 GB</td>
                      <td className="p-3 font-mono text-cyan-300">Native FP8 E4M3 Blackwell / BF16</td>
                      <td className="p-3">RTX 5080 16GB, RTX 4080 16GB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-400">24GB Ultra Studio</td>
                      <td className="p-3 font-mono">&gt;= 23.5 GB</td>
                      <td className="p-3 font-mono text-cyan-300">Uncompressed BF16 Full Latent</td>
                      <td className="p-3">RTX 5090 32GB, RTX 4090 24GB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: CHARACTERS & LIKENESS                          */}
          {/* ========================================================= */}
          {activeSection === 'characters' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-pink-400 font-semibold">
                  <span>CHARACTERS</span>
                  <ChevronRight size={12} />
                  <span>IDENTITY CONTAINERS (.GCHAR)</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Characters & Biometric Likeness Containers
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Characters in Genux AI are encapsulated into portable <code>.gchar</code> containers. They bundle 512-dimension InsightFace biometric embeddings, InstantID projection matrices, and PuLID appearance adapters.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">How Character Replacement Works</h3>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
                  <li><strong>Upload Portrait:</strong> Import any sharp, well-lit photo of a character or real person.</li>
                  <li><strong>Facial Landmark Alignment:</strong> The engine locates 5 key facial points (pupils, nose tip, mouth corners) and crops a normalized 512x512 alignment tensor.</li>
                  <li><strong>Biometric Extraction:</strong> The InsightFace model calculates a 512-D normalized vector representing unique facial geometry and bone structure.</li>
                  <li><strong>InstantID Latent Injection:</strong> During Wan 2.1 video diffusion, the character embeddings are injected through multi-head cross-attention into every frame mask.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
                <h4 className="font-bold text-white">Renaming Characters & Viewing Uploads</h4>
                <p className="text-slate-400">
                  In the <strong>Characters</strong> tab, each card displays your actual uploaded portrait. Click the pencil icon on any card to edit the character's name to anything you like (e.g. "Cyberpunk Protagonist" or "Neo Tokyo").
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 5: MAESTRO VIDEO TRIMMING                         */}
          {/* ========================================================= */}
          {activeSection === 'maestro' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <span>VIDEO CONTROLS</span>
                  <ChevronRight size={12} />
                  <span>MAESTRO TRIMMING & SCRUBBING</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Pinokio Maestro Video Trimming & Scrubbing
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Inspired by the popular Pinokio Maestro video suite, Genux AI includes surgical frame-accurate playback and trimming controls built directly into the video canvas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-cyan-300">-5s / -1s</span>
                    <span>Step Backward</span>
                  </div>
                  <p className="text-slate-400">
                    Jump backward by 5 seconds or exactly 1 second to find the exact starting pose.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-cyan-300">+1s / +5s</span>
                    <span>Step Forward</span>
                  </div>
                  <p className="text-slate-400">
                    Jump forward by 1 second or 5 seconds to navigate lengthy viral clips quickly.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-emerald-300">[ Set In</span>
                    <span>Trim In Marker</span>
                  </div>
                  <p className="text-slate-400">
                    Sets the active recasting start marker at the current playhead position.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-indigo-300">] Set Out</span>
                    <span>Trim Out Marker</span>
                  </div>
                  <p className="text-slate-400">
                    Sets the active recasting end marker. The green highlighted track shows your selected duration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 6: SOCIAL IMPORTER & VIRAL TRENDS                 */}
          {/* ========================================================= */}
          {activeSection === 'social' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-semibold">
                  <span>SOCIAL INGESTOR</span>
                  <ChevronRight size={12} />
                  <span>VIRAL FEEDS & YOUTUBE SEARCH</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Social Video Ingestor & Live Viral Trends
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Import trending content from TikTok, Instagram Reels, YouTube Shorts, or Reddit with full stereo audio multiplexing.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <h3 className="text-base font-bold text-white">Live Viral Trends API</h3>
                <p className="leading-relaxed">
                  The Viral Trends tab connects to public trending video endpoints (including Reddit video feeds from <code>r/TikTokCringe</code>, <code>r/viral</code>, and <code>r/nextfuckinglevel</code>). Each card features live view metrics, author attribution, and instant 1-click import into the studio canvas.
                </p>

                <h3 className="text-base font-bold text-white">YouTube Search with Hover Previews</h3>
                <p className="leading-relaxed">
                  Search YouTube directly inside Genux AI without leaving the application. When you hover over any video result in the search tray, an animated preview plays automatically so you can preview the action before importing.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 7: THE 6 LOCAL AI MODELS                          */}
          {/* ========================================================= */}
          {activeSection === 'models' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
                  <span>CHECKPOINTS</span>
                  <ChevronRight size={12} />
                  <span>THE 6 AI MODELS</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  The 6 Core Local AI Models
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Genux AI orchestrates 6 distinct deep neural network models locally without requiring any cloud API tokens.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">1. Wan 2.1 Video Diffusion 14B (FP8 E4M3)</strong>
                    <span className="font-mono text-indigo-400">9.4 GB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Video generation & inpainting foundation model delivering cinematic motion and photorealistic texture synthesis.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">2. SAM 2.1 Video Large + Clean-Plate Tracking</strong>
                    <span className="font-mono text-indigo-400">2.2 GB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Meta AI's video predictor tracking subject masks through rapid movement and occlusion.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">3. DWPose 133-Keypoint Tracker</strong>
                    <span className="font-mono text-indigo-400">420 MB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    OpenMMLab skeletal, facial, and hand keypoint estimation for anatomical integrity.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">4. DepthAnything-V2 Metric Depth</strong>
                    <span className="font-mono text-indigo-400">850 MB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Continuous 3D spatial geometry mapping to ensure natural shadow casting and perspective.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">5. Gemma 2 9B Director Agent (Q4_K_M)</strong>
                    <span className="font-mono text-indigo-400">2.1 GB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Autonomous local LLM director generating cinematography prompts and motion guidance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">6. InstantID / PuLID Character Anchor</strong>
                    <span className="font-mono text-indigo-400">1.2 GB</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Zero-shot facial likeness embedding ensuring 99%+ biometric preservation across all frames.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 8: 5-STAGE C++ ENGINE PIPELINE                    */}
          {/* ========================================================= */}
          {activeSection === 'pipeline' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
                  <span>C++ RUNTIME</span>
                  <ChevronRight size={12} />
                  <span>5-STAGE PIPELINE</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  The 5-Stage Native C++ Pipeline
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  GenuxEngine executes via an optimized C++20 runtime linking NVIDIA TensorRT 10.x, cuDNN, and FFmpeg NVENC/NVDEC hardware blocks.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-white block mb-1">Stage 1: Hardware Ingestion & Demuxing</strong>
                  <span>Direct NVDEC hardware decode decompresses the input video into pinned CUDA buffers with zero CPU copying. Audio is demuxed into high-fidelity stereo PCM.</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-white block mb-1">Stage 2: SAM 2.1 Video Temporal Masking</strong>
                  <span>A memory bank stores spatio-temporal features across all frames to maintain sub-pixel mask edges even during violent camera motion.</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-white block mb-1">Stage 3: DWPose + Metric Depth Estimation</strong>
                  <span>Extracts 133-point skeletal rigs and metric z-depth to establish exact 3D spatial coordinates.</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-white block mb-1">Stage 4: Wan 2.1 FP8 Blackwell Diffusion</strong>
                  <span>The latent diffusion pipeline synthesizes new photorealistic character pixels conditioned on the character embedding vectors.</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <strong className="text-white block mb-1">Stage 5: NVENC 60 FPS Export & Audio Remux</strong>
                  <span>NVIDIA NVENC hardware encoding re-encodes the final frames at up to 60 FPS while remuxing the original audio with zero sync drift.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 9: MODEL STORAGE & CLEAN UNINSTALL                */}
          {/* ========================================================= */}
          {activeSection === 'storage' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold">
                  <span>STORAGE</span>
                  <ChevronRight size={12} />
                  <span>PATHS & CLEANUP</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Model Storage Configuration & Uninstall Routine
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Configure custom model locations on secondary drives and guarantee zero residual junk files upon uninstallation.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <h4 className="font-bold text-white">Custom Storage Directories</h4>
                <p className="leading-relaxed">
                  By default, models are stored in <code>%USERPROFILE%\.cache\genux\models</code>. You can change this directly in <em>Settings → Storage & Paths</em> or at the bottom of the Model Vault to any partition or external NVMe SSD.
                </p>

                <h4 className="font-bold text-white">Auto-Scanner</h4>
                <p className="leading-relaxed">
                  If you already use ComfyUI, HuggingFace Hub, or Ollama, click <strong>Scan Local Caches</strong>. The C++ ModelScanner will find existing weights and symlink or read them directly, saving gigabytes of disk space and download time.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 10: FAQ & TROUBLESHOOTING                         */}
          {/* ========================================================= */}
          {activeSection === 'troubleshooting' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold">
                  <span>TROUBLESHOOTING</span>
                  <ChevronRight size={12} />
                  <span>FAQ & ERROR RESOLUTION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Frequently Asked Questions & Troubleshooting
                </h1>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <strong className="text-white block">Q: Does Genux AI upload my videos to the cloud?</strong>
                  <p className="text-slate-400">
                    No. Genux AI is 100% on-device local software. All facial embeddings, mask calculations, and video diffusion runs entirely on your local NVIDIA GPU.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <strong className="text-white block">Q: Why does my 16GB GPU report 15.9 GB?</strong>
                  <p className="text-slate-400">
                    Windows reserves ~100 MB of VRAM for desktop rendering. Genux AI automatically normalizes 15.9 GB to 16 GB, activating the full native profile.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <strong className="text-white block">Q: What NVIDIA drivers are required?</strong>
                  <p className="text-slate-400">
                    NVIDIA Game Ready or Studio Driver v570.xx or newer (supporting CUDA 12.8+).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 11: HOSTING & VPS DOMAIN                          */}
          {/* ========================================================= */}
          {activeSection === 'hosting' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
                  <span>HOSTING</span>
                  <ChevronRight size={12} />
                  <span>COOLIFY VPS & SUBDOMAIN CONFIGURATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  VPS Deployment & Domain Routing
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Architecture for hosting Genux AI portal and documentation on Coolify VPS under the <code>genuxai.io</code> domain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-slate-400">Main Portal Domain:</span>
                  <span className="font-mono text-cyan-300 font-bold">https://genuxai.io</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-slate-400">Documentation Subdomain:</span>
                  <span className="font-mono text-indigo-300 font-bold">https://docs.genuxai.io</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-slate-400">Hosting Platform:</span>
                  <span className="font-bold text-white">Coolify Self-Hosted VPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Publisher:</span>
                  <span className="font-bold text-white">Xonarous Inc (xonarous.nl)</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 12: AGPL-3.0 OPEN SOURCE LICENSE                  */}
          {/* ========================================================= */}
          {activeSection === 'license' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <span>LEGAL &amp; LICENSING</span>
                  <ChevronRight size={12} />
                  <span>FREE SOFTWARE FOUNDATION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  GNU Affero General Public License v3.0 (AGPL-3.0)
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  Genux AI is free, copyleft open-source software licensed under the <strong>GNU AGPLv3</strong>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#111522] border border-white/[0.08] space-y-4 text-xs leading-relaxed text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>Freedom, Transparency &amp; Local Privacy</span>
                </div>
                <p>
                  Genux AI gives you the complete freedom to run the software locally, inspect every line of C++ and TypeScript source code, study the neural inference pipelines, and modify or adapt the codebase for your personal or commercial production workflows.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <strong className="text-white block">Permissions:</strong>
                    <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
                      <li>Commercial use without licensing royalties</li>
                      <li>Modification &amp; private adaptation</li>
                      <li>Distribution of binaries and source code</li>
                      <li>Patent grant protection</li>
                    </ul>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <strong className="text-white block">Conditions:</strong>
                    <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
                      <li>Source code disclosure for network deployments</li>
                      <li>Preservation of copyright and license notices</li>
                      <li>Same copyleft license (AGPL-3.0) on modified versions</li>
                      <li>Attribution to original author: Xonarous Inc</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 font-mono">
                  Full License Text: <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">https://www.gnu.org/licenses/agpl-3.0.html</a> • Copyright &copy; 2026 Xonarous Inc.
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
