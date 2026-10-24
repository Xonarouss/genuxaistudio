import React from 'react';
import { GenuxLogo } from './GenuxLogo';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onDownloadExe: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onDownloadExe,
  onOpenPrivacy,
  onOpenTerms
}) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-16 text-xs text-slate-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <GenuxLogo size={28} />
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                GENUX AI
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-sm">
              The professional 100% local Windows desktop workstation for video recasting, motion extraction, and viral content production. Powered by C++20, TensorRT 10, Wan 2.1 14B, and Meta SAM 2.1.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Windows 10/11 x64 • GPU Target: NVIDIA 12GB - 24GB VRAM
            </div>

            {/* Buy Me a Beer Button */}
            <div className="pt-2">
              <a 
                href="https://buymeacoffee.com/xonarous" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] transition transform duration-200"
              >
                <span className="text-sm">🍺</span>
                <span>Buy me a beer</span>
              </a>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#models" className="hover:text-indigo-600 transition-colors">
                  AI Models Specs
                </a>
              </li>
              <li>
                <a href="#requirements" className="hover:text-indigo-600 transition-colors">
                  System Requirements
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-600 transition-colors">
                  Features &amp; Workflow
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-indigo-600 transition-colors">
                  Blackwell Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Resources &amp; Docs
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="https://docs.genuxai.io" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-semibold text-slate-800"
                >
                  <span>Online Documentation</span>
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Xonarouss/genuxaistudio" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a 
                  href="https://xonarous.nl" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <span>Xonarous Inc Website</span>
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <button 
                  onClick={onDownloadExe}
                  className="hover:text-indigo-600 transition-colors font-bold text-indigo-600"
                >
                  Download Installer (.exe)
                </button>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 select-none text-xs">
                <span>Android App</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                  Coming soon
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Privacy */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Privacy &amp; Terms
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={onOpenPrivacy}
                  className="hover:text-indigo-600 transition-colors text-left font-medium"
                >
                  Privacy Policy (100% Offline)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenTerms}
                  className="hover:text-indigo-600 transition-colors text-left font-medium"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenPrivacy}
                  className="text-slate-400 hover:text-indigo-600 transition-colors text-left flex items-center gap-1 text-[11px]"
                >
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>Telemetry &amp; Opt-In Info</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            Genux is owned and built by{' '}
            <a 
              href="https://xonarous.nl" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-slate-700 hover:text-indigo-600 underline transition-colors"
            >
              Xonarous Inc
            </a>
            . All rights reserved. 100% On-Device Local Processing.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenPrivacy} className="hover:text-indigo-600 transition">Privacy</button>
            <span>•</span>
            <button onClick={onOpenTerms} className="hover:text-indigo-600 transition">Terms</button>
            <span>•</span>
            <span>CUDA 12.8 / TensorRT 10.x</span>
            <span>•</span>
            <a href="https://genuxai.io" className="hover:text-indigo-600 transition">genuxai.io</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
