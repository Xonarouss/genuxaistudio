import React from 'react';
import { Cpu, Layers, CheckCircle2 } from 'lucide-react';

interface ModelDetail {
  id: string;
  name: string;
  role: string;
  size: string;
  vramUsage: string;
  architecture: string;
  description: string;
  tags: string[];
}

const MODELS_CATALOG: ModelDetail[] = [
  {
    id: 'wan21',
    name: 'Wan 2.1 Video Diffusion 14B',
    role: 'Neural Video Inpainting & Motion Diffusion',
    size: '9.4 GB (FP8 E4M3)',
    vramUsage: '~7.8 GB VRAM',
    architecture: 'Blackwell FP8 TensorRT Accelerated',
    description: 'High-parameter video generation model delivering photorealistic motion consistency, cinematic lighting preservation, and fine temporal detail with zero cloud latency.',
    tags: ['Wan-AI', '14B Parameters', 'Blackwell FP8', '60 FPS']
  },
  {
    id: 'sam2',
    name: 'SAM 2.1 Video Large',
    role: 'Real-Time Rotoscope & Subject Segmentation',
    size: '2.2 GB (BF16)',
    vramUsage: '~2.1 GB VRAM',
    architecture: 'Hierarchical Vision Transformer (Hiera-L)',
    description: "Meta AI's foundation model for temporal object tracking. Tracks full human anatomy, moving apparel, and intricate props across fast panning and sudden occlusions.",
    tags: ['Meta AI', 'Sub-pixel Masks', 'Zero-shot', 'Clean Plate']
  },
  {
    id: 'dwpose',
    name: 'DWPose 133-Keypoint Tracker',
    role: 'Skeletal & Facial Landmark Estimation',
    size: '420 MB (ONNX)',
    vramUsage: '~400 MB VRAM',
    architecture: 'OpenMMLab Two-Stage Pose Estimator',
    description: 'Tracks whole-body kinematics including 68 facial points, 42 hand finger joints, and 23 body skeletal joints to ensure anatomically perfect character warping.',
    tags: ['OpenMMLab', '133 Keypoints', 'Hand & Face', 'Real-time']
  },
  {
    id: 'depth',
    name: 'DepthAnything-V2 Metric',
    role: '3D Spatial Geometry & Depth Mapping',
    size: '850 MB (ViT-L)',
    vramUsage: '~800 MB VRAM',
    architecture: 'Vision Transformer Metric Depth',
    description: 'Calculates continuous metric depth maps per video frame, allowing the diffusion pipeline to cast accurate shadows and maintain true foreground-background perspective.',
    tags: ['DepthAnything', 'Metric 3D', 'Volumetric', 'Shadows']
  },
  {
    id: 'gemma',
    name: 'Gemma 2 Director Agent (9B)',
    role: 'Autonomous LLM Scene Director',
    size: '2.1 GB (Q4_K_M)',
    vramUsage: '~2.2 GB System/VRAM',
    architecture: 'Google DeepMind 9B Instruction Tuned',
    description: 'Translates high-level director commands into frame-by-frame guidance, lighting parameters, character personality cues, and cinematography adjustments.',
    tags: ['Google DeepMind', 'Autonomous Director', 'Local LLM', 'llama.cpp']
  },
  {
    id: 'pulid',
    name: 'InstantID / PuLID Character Anchor',
    role: 'Facial Biometric & Likeness Lock',
    size: '1.2 GB (FP8)',
    vramUsage: '~1.1 GB VRAM',
    architecture: 'InsightFace + Multi-Scale IP-Adapter',
    description: 'Guarantees 99%+ biometric similarity with your custom uploaded character photos without requiring fine-tuning or LoRA training weights.',
    tags: ['InsightFace', 'InstantID', 'Zero Fine-tuning', '.gchar']
  }
];

export const ModelsSection: React.FC = () => {
  return (
    <section id="models" className="py-24 bg-slate-50/70 border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Layers size={14} />
            <span>AI Architecture & Checkpoints</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            The 6 Models Powering Genux AI
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            All AI models run 100% locally on your PC with zero cloud telemetry. Download weights securely inside the desktop app or auto-link existing ComfyUI and HuggingFace directories.
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODELS_CATALOG.map((model) => (
            <div 
              key={model.id}
              className="group p-7 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header with Badges */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                    <Cpu size={22} />
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                      {model.size}
                    </span>
                    <div className="text-[11px] font-mono text-indigo-600 font-semibold mt-1">
                      {model.vramUsage}
                    </div>
                  </div>
                </div>

                {/* Model Title & Role */}
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {model.name}
                </h3>
                <div className="text-xs font-semibold text-indigo-600 mb-3">
                  {model.role}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {model.description}
                </p>
              </div>

              {/* Tags & Architecture */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-mono text-slate-500 mb-3 truncate flex items-center gap-1">
                  <span className="text-indigo-500 font-bold">⚡</span> {model.architecture}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {model.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Feature Highlights Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Zero Cloud Subscriptions & No Hidden Queues</div>
              <div className="text-xs text-slate-500">Every single tensor operation executes locally on your GPU cores.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local TensorRT 10.x C++20 Runtime</span>
          </div>
        </div>

      </div>
    </section>
  );
};
