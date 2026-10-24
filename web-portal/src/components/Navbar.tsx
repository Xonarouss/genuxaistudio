import React from 'react';
import { Download, Cpu, HardDrive, BookOpen, ExternalLink } from 'lucide-react';
import { GenuxLogo } from './GenuxLogo';

interface NavbarProps {
  onOpenModelHub: () => void;
  onDownloadExe: () => void;
  onOpenDocs?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenModelHub, 
  onDownloadExe,
  onOpenDocs
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <GenuxLogo size={32} animated={true} />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              GENUX<span className="text-indigo-600">.AI</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold">
              LOCAL WORKSTATION
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>12GB - 24GB VRAM • Blackwell FP8</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
          <a href="#models" className="hover:text-indigo-600 transition-colors">AI Models</a>
          <a href="#requirements" className="hover:text-indigo-600 transition-colors">Requirements</a>
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#pipeline" className="hover:text-indigo-600 transition-colors">Pipeline</a>
          
          <button 
            onClick={onOpenModelHub}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
            <span>Model Hub</span>
          </button>

          {onOpenDocs ? (
            <button
              onClick={onOpenDocs}
              className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>
          ) : (
            <a
              href="https://docs.genuxai.io"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
              <ExternalLink className="w-3 h-3 text-indigo-400" />
            </a>
          )}
        </nav>

        {/* Action CTA */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Xonarouss/genuxaistudio"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <span>GitHub</span>
          </a>

          <button
            onClick={onDownloadExe}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .exe</span>
          </button>
        </div>

      </div>
    </header>
  );
};
