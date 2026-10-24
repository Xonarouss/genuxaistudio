<div align="center">

# 🎬 GENUX AI STUDIO
### Local AI Video Character Recasting Workstation • 100% On-Device GPU Inference
**Built & Maintained by [Xonarous Inc](https://xonarous.nl)**

[![Windows](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-blue.svg?style=for-the-badge&logo=windows)](https://genuxai.io)
[![CUDA](https://img.shields.io/badge/CUDA-12.8%2B%20%7C%20TensorRT%2010.x-green.svg?style=for-the-badge&logo=nvidia)](https://genuxai.io)
[![Architecture](https://img.shields.io/badge/Architecture-Blackwell%20FP8%20%2F%20BF16-purple.svg?style=for-the-badge)](https://genuxai.io)
[![Buy me a beer](https://img.shields.io/badge/🍺%20Buy%20me%20a%20beer-buymeacoffee.com%2Fxonarous-amber.svg?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/xonarous)
[![License](https://img.shields.io/badge/License-Proprietary%20Commercial-red.svg?style=for-the-badge)](https://xonarous.nl)

[**🍺 Buy Me a Beer**](https://buymeacoffee.com/xonarous) • [**Website (genuxai.io)**](https://genuxai.io) • [**Documentation (docs.genuxai.io)**](https://docs.genuxai.io) • [**Releases (.exe)**](https://github.com/Xonarouss/genuxaistudio/releases) • [**Company (xonarous.nl)**](https://xonarous.nl)

</div>

---

## 🌟 Overview

**Genux AI** is a professional desktop workstation engineered for **100% local video character recasting, identity replacement, and autonomous cinematography**.

Unlike cloud-dependent platforms with monthly subscriptions, privacy leaks, and wait queues, Genux AI runs entirely on your local NVIDIA GPU. Import any viral TikTok, Instagram Reel, YouTube video, or local clip, select any person or object with sub-pixel SAM 2.1 rotoscoping, and recast them with Wan 2.1 14B diffusion — preserving full original motion kinematics, lighting, and stereo audio.

---

## ✨ Key Features

- **🔒 100% Local & Private:** Zero cloud telemetry, zero remote video uploads. Your facial embeddings, models, and video latents stay strictly on your local PC.
- **⚡ Blackwell FP8 TensorRT Acceleration:** Powered by a native C++20 engine with cuDNN and TensorRT 10.x, delivering sub-second inference speeds on RTX 5080, 5090, 4080, and 4090 GPUs.
- **🎭 Characters (.gchar) Identity Vault:** Replace characters using portable `.gchar` containers. Includes InsightFace 512-dimension vectors, InstantID projection matrices, and 99%+ biometric preservation. Easily rename characters and view uploaded portraits.
- **✂️ Pinokio Maestro-Style Video Trimming:** Frame-accurate stepping (`-5s`, `-1s`, `+1s`, `+5s`), interactive scrubbers, and surgical `[ Set In` and `] Set Out` trimming markers.
- **📺 In-App YouTube Search & Hover Previews:** Search YouTube directly inside the app with animated hover previews and 1-click video/audio demuxing.
- **🔥 Live Viral Trends Feeds:** Browse trending clips and memes from TikTok, Instagram Reels, and YouTube Shorts with live metrics.
- **💾 Automated Model Vault & Clean Uninstall:** Configurable model storage directory (secondary SSD support), automated cache scanner for ComfyUI/HuggingFace checkpoints, and a **100% Clean Uninstall Guarantee** (all models wiped upon uninstallation).

---

## 🧠 Neural Architecture & The 6 Local AI Models

Genux AI orchestrates 6 state-of-the-art open research foundation models:

| Model | Checkpoint File | Size | Role | Precision |
| :--- | :--- | :--- | :--- | :--- |
| **Wan 2.1 14B** | `wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors` | 9.4 GB | Latent Video Inpainting & Synthesis | Blackwell FP8 E4M3 |
| **Meta SAM 2.1 Large** | `sam2.1_hiera_large.pt` | 2.2 GB | Video Temporal Rotoscope Masking | BF16 / FP16 |
| **DWPose 133-Keypoint** | `dw-ll_ucoco_384.onnx` | 420 MB | Whole-Body, Face & Hand Kinematics | ONNX Runtime |
| **DepthAnything-V2** | `depth_anything_v2_vitl.pth` | 850 MB | 3D Spatial Geometry & Metric Depth | Metric ViT-L |
| **Gemma 2 Director (9B)** | `gemma-2-9b-it.Q4_K_M.gguf` | 2.1 GB | Autonomous LLM Cinematography Director | Q4_K_M GGUF |
| **InstantID / PuLID** | `ip-adapter-instantid.bin` | 1.2 GB | Biometric Likeness & Identity Lock | InsightFace FP8 |

---

## 💻 Hardware Requirements & VRAM Profiles

Genux AI automatically analyzes your GPU hardware and normalizes display-driver memory overhead (e.g. 15.9 GB $\rightarrow$ 16 GB Native Profile):

```
+---------------------------------------------------------------------------------------+
|  Tier               | Target GPU                       | VRAM        | Mode           |
+---------------------+----------------------------------+-------------+----------------+
|  Minimum            | RTX 3060 12GB / RTX 4070 12GB    | 12 GB       | FP8 Scaled     |
|  Recommended Studio | RTX 4080 16GB / RTX 4070Ti Super | 16 GB       | Native FP8     |
|  Blackwell Flagship | RTX 5080 16GB / RTX 5090 32GB    | 16 - 32 GB  | Blackwell FP8  |
+---------------------------------------------------------------------------------------+
```

- **System RAM:** 32 GB DDR4 / DDR5 (64 GB recommended for 4K).
- **Storage:** 50 GB free NVMe PCIe SSD (customizable to secondary drives).
- **OS:** Windows 10 / 11 64-bit.
- **NVIDIA Driver:** v570.xx or newer (CUDA 12.8+).

---

## 🚀 Quickstart & Installation

1. Download **`Genux_AI_Setup_1.0.0.exe`** from [Releases](https://github.com/Xonarouss/genuxaistudio/releases).
2. Run the installer wizard and complete installation.
3. On the finish page, check **Open README & Documentation** to launch the comprehensive guide.
4. Launch Genux AI from the Desktop shortcut.
5. In the **Model Hub / Vault**, click **Download Missing** or **Scan Local Caches** to auto-link existing ComfyUI models.
6. Import your video, select or upload a character, trim the scene, and click **Recast Video**.

---

## ⚖️ License & Attribution

- **Publisher & Creator:** Genux AI is owned and built by **[Xonarous Inc](https://xonarous.nl)**.
- **Official Website:** [https://genuxai.io](https://genuxai.io)
- **Documentation:** [https://docs.genuxai.io](https://docs.genuxai.io)
- **Copyright:** © 2026 Xonarous Inc. All rights reserved. Open-source models (Wan 2.1, SAM 2.1, DWPose, Gemma 2, DepthAnything) are governed by their respective research licenses.
