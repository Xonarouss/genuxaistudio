import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ModelsSection } from './components/ModelsSection';
import { RequirementsSection } from './components/RequirementsSection';
import { FeatureBento } from './components/FeatureBento';
import { ArchitectureSection } from './components/ArchitectureSection';
import { Footer } from './components/Footer';
import { DocsPage } from './components/DocsPage';
import { Download, X, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);

  // Check URL hash or query param for ?docs
  useEffect(() => {
    if (window.location.search.includes('docs') || window.location.hash.includes('docs')) {
      setIsDocsOpen(true);
    }
  }, []);

  const handleDownloadExe = () => {
    setDownloadModalOpen(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  // If Docs view is active, render the extensive documentation portal on localhost
  if (isDocsOpen) {
    return (
      <DocsPage 
        onBackToPortal={() => {
          setIsDocsOpen(false);
          window.history.pushState(null, '', window.location.pathname);
        }}
        onDownloadExe={handleDownloadExe}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      {/* Top Sticky Navbar */}
      <Navbar 
        onDownloadExe={handleDownloadExe}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Informational Product Page */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection 
          onDownloadExe={handleDownloadExe}
          onOpenDocs={() => setIsDocsOpen(true)}
        />

        {/* The 6 AI Models Specs & Architecture */}
        <ModelsSection />

        {/* Hardware & System Requirements Tier Matrix */}
        <RequirementsSection />

        {/* Features & Video Workflow */}
        <FeatureBento 
          onOpenStudio={handleDownloadExe}
        />

        {/* Performance & VRAM Benchmarks */}
        <ArchitectureSection />
      </main>

      {/* Footer */}
      <Footer 
        onDownloadExe={handleDownloadExe}
      />

      {/* Download Windows App Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button 
              onClick={() => setDownloadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Download Genux AI Workstation (.exe)
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Official Windows installer with native C++20 engine, TensorRT 10.x runtime, Wan 2.1 FP8, and automated model manager.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5 text-slate-600 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Package:</span>
                <span className="text-slate-800 font-semibold">Genux_AI_Setup_1.0.0.exe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Installer Size:</span>
                <span className="text-slate-800">105.2 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target VRAM:</span>
                <span className="text-indigo-600 font-bold">12 GB - 24 GB (RTX 3060 to RTX 5090)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uninstall Policy:</span>
                <span className="text-emerald-600 font-semibold">100% Clean Disk Wipe</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="https://github.com/Xonarouss/genuxaistudio/releases"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md"
              >
                <Download size={14} />
                <span>Download Genux_AI_Setup_1.0.0.exe</span>
              </a>

              <button
                onClick={() => {
                  setDownloadModalOpen(false);
                  setIsDocsOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                <BookOpen size={14} className="text-indigo-600" />
                <span>Read Full Step-by-Step Documentation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
