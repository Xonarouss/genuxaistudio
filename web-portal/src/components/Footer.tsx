import React from 'react';
import { GenuxLogo } from './GenuxLogo';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenModelHub: () => void;
  onDownloadExe: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenModelHub, 
  onDownloadExe 
}) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-16 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <GenuxLogo size={28} />
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                GENUX AI <span className="text-indigo-600 font-mono text-xs">(GENUTS ENGINE)</span>
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-sm">
              The professional 100% local Windows desktop workstation for video recasting, motion extraction, and viral content production. Powered by C++20, TensorRT 10, Wan 2.1 14B, and Meta SAM 2.1.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Windows 10/11 x64 • GPU Target: NVIDIA 12GB - 24GB VRAM
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
                  Features & Workflow
                </a>
              </li>
              <li>
                <button onClick={onOpenModelHub} className="hover:text-indigo-600 transition-colors text-left">
                  Model Vault Catalog
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Resources & Docs
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
            </ul>
          </div>

          {/* Column 3: System Target */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Hardware Target
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li><strong className="text-slate-900">Minimum:</strong> RTX 3060 12GB</li>
              <li><strong className="text-slate-900">Optimal:</strong> RTX 4080 / RTX 5080</li>
              <li><strong className="text-slate-900">Flagship:</strong> RTX 5090 Blackwell</li>
              <li><strong className="text-slate-900">RAM:</strong> 32 GB DDR4 / DDR5</li>
              <li><strong className="text-slate-900">Storage:</strong> 50+ GB NVMe</li>
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
            <span>CUDA 12.8 / TensorRT 10.x</span>
            <span>•</span>
            <a href="https://genuxai.io" className="hover:text-indigo-600 transition">genuxai.io</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
