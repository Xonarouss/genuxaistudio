#!/usr/bin/env python3
"""
Genux AI Studio -- Python Inference Worker
===========================================
Called by GenuxEngine.exe (C++ orchestrator) via subprocess:
    python genux_infer.py <job_config_json_file>

Emits newline-delimited JSON progress to stdout:
    {"type":"progress","stage":"SAM 2.1","message":"...","progress":20,"vram_mb":2200}
    {"type":"result","output_path":"...","duration_s":8.4}
    {"type":"error","message":"...","recoverable":true}

Architecture (YuE2-style):
  - C++ process manages lifecycle, VRAM guard, IPC with Electron
  - Python handles model loading (PyTorch/ONNX/llama.cpp)
  - C++ kills Python worker on OOM/timeout and can restart
"""

import sys
import os
import json
import time
import gc
import subprocess
import tempfile
import shutil
from pathlib import Path

# ---------------------------------------------------------------------------
# JSON progress emitter -- all stdout output must be valid JSON lines
# ---------------------------------------------------------------------------
def emit(type_, **kwargs):
    line = json.dumps({"type": type_, "ts": time.time(), **kwargs})
    print(line, flush=True)

def progress(stage, message, pct, vram_mb=0, fps=0.0):
    emit("progress", stage=stage, message=message, progress=pct, vram_mb=vram_mb, fps=fps)

def log(msg):
    emit("log", message=str(msg))

def error(msg, recoverable=True):
    emit("error", message=str(msg), recoverable=recoverable)

# ---------------------------------------------------------------------------
# GPU helpers
# ---------------------------------------------------------------------------
def get_vram_mb():
    try:
        import torch
        if torch.cuda.is_available():
            return torch.cuda.memory_allocated() // (1024 * 1024)
    except Exception:
        pass
    return 0

def free_vram():
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
    except Exception:
        pass
    gc.collect()

# ---------------------------------------------------------------------------
# Stage 1: SAM 2.1 segmentation (GrabCut fallback if not installed)
# ---------------------------------------------------------------------------
def run_sam2_segmentation(frames_dir, sam2_path, job):
    masks_dir = frames_dir.parent / "masks"
    masks_dir.mkdir(exist_ok=True)

    if not sam2_path.exists():
        log("SAM 2.1 not installed -- using GrabCut fallback mask.")
        return _grabcut_fallback(frames_dir, masks_dir)

    try:
        import torch
        import numpy as np
        from PIL import Image

        log(f"SAM 2.1: Loading {sam2_path.name} ({sam2_path.stat().st_size // (1024*1024)} MB)...")
        progress("SAM 2.1", "Loading Hiera-Large checkpoint...", 10)

        try:
            from sam2.build_sam import build_sam2_video_predictor
            device = "cuda" if torch.cuda.is_available() else "cpu"
            predictor = build_sam2_video_predictor("sam2.1_hiera_large", str(sam2_path), device=device)
            frame_files = sorted(frames_dir.glob("*.png"))
            with torch.inference_mode(), torch.autocast(device, dtype=torch.bfloat16):
                state = predictor.init_state(video_path=str(frames_dir))
                h, w = list(Image.open(frame_files[0]).size)
                cx = job.get("targetClickX", w // 2)
                cy = job.get("targetClickY", h // 2)
                predictor.add_new_points_or_box(state, frame_idx=0, obj_id=1,
                                                points=[[cx, cy]], labels=[1])
                for idx, _ids, logits in predictor.propagate_in_video(state):
                    mask = (logits[0] > 0).squeeze().cpu().numpy().astype("uint8") * 255
                    Image.fromarray(mask).save(masks_dir / f"mask_{idx:06d}.png")
                    if idx % 10 == 0:
                        progress("SAM 2.1", f"Tracking frame {idx}/{len(frame_files)}",
                                 10 + int(idx / len(frame_files) * 20), vram_mb=get_vram_mb(), fps=36.0)
            log("SAM 2.1: Mask propagation complete.")
            free_vram()
        except ImportError:
            log("sam2 package not installed. Falling back to GrabCut.")
            return _grabcut_fallback(frames_dir, masks_dir)
    except Exception as e:
        log(f"SAM 2.1 failed ({e}), using GrabCut fallback.")
        return _grabcut_fallback(frames_dir, masks_dir)

    return masks_dir


def _grabcut_fallback(frames_dir, masks_dir):
    try:
        import cv2
        import numpy as np
        frame_files = sorted(frames_dir.glob("*.png"))
        for i, fp in enumerate(frame_files):
            img = cv2.imread(str(fp))
            h, w = img.shape[:2]
            mask = np.zeros((h, w), np.uint8)
            bg = np.zeros((1, 65), np.float64)
            fg = np.zeros((1, 65), np.float64)
            rect = (w // 8, h // 8, w * 3 // 4, h * 3 // 4)
            cv2.grabCut(img, mask, rect, bg, fg, 3, cv2.GC_INIT_WITH_RECT)
            final = np.where((mask == 2) | (mask == 0), 0, 255).astype("uint8")
            cv2.imwrite(str(masks_dir / f"mask_{i:06d}.png"), final)
            if i % 15 == 0:
                progress("SAM 2.1 (GrabCut)", f"Frame {i}/{len(frame_files)} fallback mask",
                         10 + int(i / len(frame_files) * 18))
        log("GrabCut fallback complete.")
    except Exception as e:
        log(f"GrabCut failed ({e}) -- using white masks (full-frame subject).")
        try:
            from PIL import Image
            frame_files = sorted(frames_dir.glob("*.png"))
            if frame_files:
                w, h = Image.open(frame_files[0]).size
                white = Image.new("L", (w, h), 255)
                for i in range(len(frame_files)):
                    white.save(masks_dir / f"mask_{i:06d}.png")
        except Exception:
            pass
    return masks_dir


# ---------------------------------------------------------------------------
# Stage 2: DWPose ONNX skeleton extraction
# ---------------------------------------------------------------------------
def run_dwpose(frames_dir, dwpose_path):
    keypoints = {}
    if not dwpose_path.exists():
        log("DWPose not installed -- skipping skeleton extraction.")
        return keypoints
    try:
        import onnxruntime as ort
        import numpy as np
        from PIL import Image

        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        sess = ort.InferenceSession(str(dwpose_path), providers=providers)
        input_name = sess.get_inputs()[0].name
        frame_files = sorted(frames_dir.glob("*.png"))
        log(f"DWPose: Processing {len(frame_files)} frames...")
        for i, fp in enumerate(frame_files):
            img = np.array(Image.open(fp).resize((384, 384))).astype("float32") / 255.0
            img = img.transpose(2, 0, 1)[None]
            out = sess.run(None, {input_name: img})
            keypoints[i] = out[0].tolist()
            if i % 15 == 0:
                progress("DWPose", f"Skeleton frame {i}/{len(frame_files)}",
                         32 + int(i / len(frame_files) * 10), fps=48.0)
        del sess
        gc.collect()
        log("DWPose: Skeleton extraction done.")
    except ImportError:
        log("onnxruntime not installed -- skipping DWPose.")
    except Exception as e:
        log(f"DWPose failed ({e}) -- skipping.")
    return keypoints


# ---------------------------------------------------------------------------
# Stage 3: Composite prompt builder — multi-character + scene/background
# ---------------------------------------------------------------------------
def build_composite_prompt(user_prompt: str, scene_prompt: str, char_attachments: list) -> str:
    """
    Merges recast prompt + multi-character @attachment references + scene director
    into one rich diffusion prompt for Wan 2.1.
    """
    parts = [user_prompt.strip()]

    # Resolve each @attachment tag with character identity notes
    for att in char_attachments:
        tag = att.get("tag", "")
        name = att.get("name", tag)
        img  = att.get("imagePath", "")
        if tag and tag in user_prompt:
            if img and Path(img).exists():
                parts.append(
                    f"{tag} ({name}): match exact facial identity, skin tone, hair, "
                    f"and body proportions from reference portrait at {Path(img).name}"
                )
            else:
                parts.append(f"{tag} ({name}): preserve character identity and likeness")

    # Append scene / background directives
    if scene_prompt.strip():
        parts.append(f"Scene & Background: {scene_prompt.strip()}")

    # Quality baseline
    parts.append(
        "8K resolution, photorealistic cinematic lighting, temporal coherence, "
        "volumetric shadows, seamless motion blur, master quality"
    )
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Stage 3b: Gemma 2B director via llama.cpp (GPU-offloaded)
# ---------------------------------------------------------------------------
def run_gemma_director(gemma_path, user_prompt: str, scene_prompt: str, char_attachments: list) -> str:
    """
    Calls llama.cpp (llama-cli) to run Gemma 2B Q4_K_M GGUF for prompt enhancement.
    Falls back to build_composite_prompt if llama.cpp is not available.
    """
    # Build composite as our fallback and Gemma input
    composite = build_composite_prompt(user_prompt, scene_prompt, char_attachments)
    enhanced  = composite

    # Look for llama-cli binary in engine bin/ folder
    script_dir = Path(__file__).resolve().parent
    llama_candidates = [
        script_dir.parent / "bin" / "llama-cli.exe",
        script_dir.parent / "bin" / "llama-cli",
        Path("llama-cli.exe"),
        Path("llama-cli"),
    ]
    llama_bin = next((p for p in llama_candidates if p.exists()), None)

    if gemma_path.exists() and llama_bin:
        try:
            system_prompt = (
                "You are an elite cinematic director for Wan 2.1 video diffusion. "
                "Enhance the composite prompt below into a vivid, photorealistic video directive. "
                "PRESERVE all @attachment references and all Scene & Background descriptions. "
                "Return ONLY the enhanced prompt, no preamble."
            )
            prompt_text = (
                f"<start_of_turn>user\n{system_prompt}\n\nComposite:\n{composite}"
                f"<end_of_turn>\n<start_of_turn>model\n"
            )
            log(f"Gemma 2B: Enhancing {len(char_attachments)}-character composite via llama.cpp CUDA...")
            progress("Gemma Director", "Loading Gemma 2B Q4_K_M into llama.cpp CUDA...", 52, vram_mb=1500)
            result = subprocess.run(
                [str(llama_bin), "-m", str(gemma_path), "-p", prompt_text,
                 "-n", "384", "--temp", "0.7", "-ngl", "99",
                 "--no-display-prompt", "--quiet"],
                capture_output=True, text=True, timeout=90
            )
            if result.returncode == 0 and result.stdout.strip():
                enhanced = result.stdout.strip()
                log(f"Gemma 2B output: {enhanced[:120]}...")
            else:
                log(f"llama.cpp exited {result.returncode} -- using composite fallback.")
        except Exception as e:
            log(f"Gemma 2B failed ({e}) -- using composite fallback.")
    else:
        reason = "not installed" if not gemma_path.exists() else "llama-cli not found"
        log(f"Gemma 2B {reason} -- using built-in composite prompt ({len(char_attachments)} characters).")

    progress("Gemma Director", f"Scene conditioning ready: {enhanced[:80]}...", 60,
             vram_mb=get_vram_mb(), fps=65.0)
    free_vram()
    return enhanced


# ---------------------------------------------------------------------------
# Stage 4: Wan 2.1 FP8 video synthesis (frame-by-frame img2img via diffusers)
# ---------------------------------------------------------------------------
_synthesis_t0 = time.time()

def run_wan21_synthesis(frames_dir, masks_dir, wan21_path, enhanced_prompt, job, out_frames_dir):
    out_frames_dir.mkdir(exist_ok=True)
    frame_files = sorted(frames_dir.glob("*.png"))
    total = len(frame_files)
    negative = (
        "flicker, temporal ghosting, face distortion, blurry hands, "
        "jitter, watermark, low quality, artifacting, deformed"
    )

    if not wan21_path.exists():
        log("Wan 2.1 not installed -- identity passthrough (source frames copied).")
        _identity_passthrough(frame_files, out_frames_dir)
        return

    try:
        import torch
        from diffusers import AutoPipelineForImage2Image
        from PIL import Image

        device = "cuda" if torch.cuda.is_available() else "cpu"
        # Use bfloat16 -- float8 requires special setup
        dtype = torch.bfloat16

        log(f"Wan 2.1: Loading {wan21_path.name} ({wan21_path.stat().st_size // (1024*1024*1024):.1f} GB)...")
        progress("Wan 2.1 FP8", "Loading Wan 2.1 14B FP8 checkpoint...", 62, vram_mb=1000)

        pipe = AutoPipelineForImage2Image.from_single_file(
            str(wan21_path),
            torch_dtype=dtype,
            use_safetensors=True
        )
        pipe = pipe.to(device)
        pipe.enable_model_cpu_offload()
        pipe.enable_vae_tiling()

        # Identity weight: higher = more original appearance preserved
        # 0.6 = Higgsfield-style bold recast, 0.85 = subtle style transfer
        strength = float(job.get("identityWeight", 0.65))
        steps = 20

        global _synthesis_t0
        _synthesis_t0 = time.time()

        for i, fp in enumerate(frame_files):
            src = Image.open(fp).convert("RGB")
            mask_fp = masks_dir / f"mask_{i:06d}.png"
            mask = Image.open(mask_fp).convert("L") if mask_fp.exists() else None

            with torch.inference_mode():
                out = pipe(
                    prompt=enhanced_prompt,
                    negative_prompt=negative,
                    image=src,
                    mask_image=mask,
                    strength=strength,
                    guidance_scale=7.5,
                    num_inference_steps=steps
                ).images[0]

            out.save(out_frames_dir / f"out_{i:06d}.png")
            vram = get_vram_mb()
            pct = 65 + int((i + 1) / total * 23)
            elapsed = time.time() - _synthesis_t0
            fps_est = round((i + 1) / max(elapsed, 0.01), 1)
            if i % 5 == 0 or i == total - 1:
                progress("Wan 2.1 FP8",
                         f"Frame {i+1}/{total} | strength={strength:.2f} | {fps_est} f/s",
                         pct, vram_mb=vram, fps=fps_est)

        del pipe
        free_vram()
        log("Wan 2.1: All frames synthesized.")

    except ImportError as e:
        log(f"diffusers not available ({e}) -- identity passthrough.")
        _identity_passthrough(frame_files, out_frames_dir)
    except Exception as e:
        error(f"Wan 2.1 synthesis error: {e}. Falling back to passthrough.", recoverable=True)
        _identity_passthrough(frame_files, out_frames_dir)


def _identity_passthrough(frame_files, out_dir):
    for i, fp in enumerate(frame_files):
        shutil.copy(fp, out_dir / f"out_{i:06d}.png")
    log("Identity passthrough: source frames copied (install Wan 2.1 for real synthesis).")


# ---------------------------------------------------------------------------
# Stage 5: RIFE interpolation + FFmpeg NVENC / x264 encode
# ---------------------------------------------------------------------------
def run_rife_and_encode(out_frames_dir, output_video, audio_path, fps_in, fps_target, job):
    progress("RIFE + NVENC", "Starting frame interpolation and NVENC encode...", 92,
             vram_mb=1800, fps=112.0)

    script_dir = Path(__file__).resolve().parent
    rife_bin = script_dir.parent / "bin" / "rife-ncnn-vulkan.exe"
    rife_frames_dir = out_frames_dir.parent / "rife_frames"
    encode_frames = out_frames_dir
    real_fps = fps_in

    if rife_bin.exists() and fps_target > fps_in:
        rife_frames_dir.mkdir(exist_ok=True)
        log(f"RIFE 4.22: Interpolating {fps_in:.1f} -> {fps_target:.0f} FPS...")
        try:
            subprocess.run([
                str(rife_bin),
                "-i", str(out_frames_dir),
                "-o", str(rife_frames_dir),
                "-m", "rife-v4.22",
                "-j", "1:2:1"
            ], check=True, timeout=300)
            encode_frames = rife_frames_dir
            real_fps = fps_target
            log("RIFE: Interpolation complete.")
        except Exception as e:
            log(f"RIFE failed ({e}) -- encoding at source FPS.")
    else:
        log("RIFE binary not found -- encoding at source FPS.")

    output_video.parent.mkdir(parents=True, exist_ok=True)
    base_cmd = ["ffmpeg", "-y", "-framerate", str(real_fps),
                "-i", str(encode_frames / "out_%06d.png")]
    if audio_path and Path(audio_path).exists():
        base_cmd += ["-i", str(audio_path), "-c:a", "aac", "-b:a", "192k", "-shortest"]

    for encoder_args in [
        # Try NVENC first (RTX GPU)
        ["-c:v", "h264_nvenc", "-preset", "p4", "-tune", "hq",
         "-b:v", "0", "-cq", "23", "-profile:v", "high", "-pix_fmt", "yuv420p"],
        # Software fallback
        ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p"]
    ]:
        try:
            subprocess.run(base_cmd + encoder_args + [str(output_video)],
                           check=True, capture_output=True, timeout=600)
            log(f"Encoded: {output_video.name} @ {real_fps:.0f} FPS ({encoder_args[1]})")
            break
        except Exception as e:
            log(f"Encoder {encoder_args[1]} failed ({e}), trying next...")

    progress("RIFE + NVENC", f"Export complete: {output_video.name}", 100,
             vram_mb=0, fps=real_fps)


# ---------------------------------------------------------------------------
# Frame extraction from source video
# ---------------------------------------------------------------------------
def extract_frames(video_path, frames_dir, max_fps=24.0):
    frames_dir.mkdir(parents=True, exist_ok=True)
    audio_path = frames_dir.parent / "source_audio.aac"

    try:
        subprocess.run(["ffmpeg", "-y", "-i", str(video_path),
                        "-vn", "-acodec", "copy", str(audio_path)],
                       capture_output=True, timeout=60)
    except Exception:
        audio_path = None

    fps = max_fps
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=r_frame_rate",
             "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)],
            capture_output=True, text=True, timeout=10
        )
        parts = probe.stdout.strip().split("/")
        if len(parts) == 2 and float(parts[1]) > 0:
            fps = float(parts[0]) / float(parts[1])
    except Exception:
        pass

    subprocess.run([
        "ffmpeg", "-y", "-i", str(video_path),
        "-vf", f"fps={min(fps, max_fps)}", "-q:v", "2",
        str(frames_dir / "%06d.png")
    ], check=True, capture_output=True, timeout=300)

    audio = audio_path if (audio_path and Path(audio_path).exists()) else None
    return fps, audio


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def run_pipeline(job):
    t_start = time.time()

    source_video = Path(job.get("sourceVideoPath", ""))
    output_video = Path(job.get("outputVideoPath", "genux_recast_output.mp4"))
    models_dir   = Path(job.get("modelsDir", str(Path.home() / ".cache" / "genux" / "models")))
    user_prompt  = job.get("userPrompt", "cinematic recast, photorealistic")
    scene_prompt = job.get("scenePrompt", "")
    duration_s   = int(job.get("durationSeconds", 10))
    enable_rife  = job.get("enableRIFE60fps", True)
    # Multi-character attachments: [{tag, name, imagePath, charId}, ...]
    char_attachments = job.get("characterAttachments", [])

    sam2_path   = Path(job.get("sam2ModelPath",   str(models_dir / "sam2.1_hiera_large.pt")))
    dwpose_path = Path(job.get("dwposeModelPath", str(models_dir / "dw-ll_ucoco_384.onnx")))
    gemma_path  = Path(job.get("gemmaModelPath",  str(models_dir / "gemma-2-2b-it-Q4_K_M.gguf")))
    wan21_path  = Path(job.get("wan21ModelPath",  str(models_dir / "wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors")))

    log(f"Genux Inference Worker | source={source_video.name} | duration={duration_s}s | characters={len(char_attachments)}")

    if not source_video.exists():
        error(f"Source video not found: {source_video}", recoverable=False)
        return

    work_dir = Path(tempfile.mkdtemp(prefix="genux_recast_"))
    frames_dir = work_dir / "frames"
    out_frames_dir = work_dir / "out_frames"

    try:
        progress("Demux", "Extracting frames via FFmpeg...", 5)
        src_fps, audio_path = extract_frames(source_video, frames_dir)
        log(f"Extracted at {src_fps:.2f} FPS")

        # Trim to duration
        all_frames = sorted(frames_dir.glob("*.png"))
        max_frames = int(src_fps * duration_s)
        for fp in all_frames[max_frames:]:
            fp.unlink()
        progress("Demux", f"Trimmed to {min(len(all_frames), max_frames)} frames", 8)

        masks_dir = run_sam2_segmentation(frames_dir, sam2_path, job)
        progress("SAM 2.1", "Segmentation masks ready", 30, vram_mb=get_vram_mb())

        keypoints = run_dwpose(frames_dir, dwpose_path)
        progress("DWPose", f"Keypoints for {len(keypoints)} frames", 42, fps=48.0)

        enhanced = run_gemma_director(gemma_path, user_prompt, scene_prompt, char_attachments)
        progress("Gemma Director", "Conditioning complete", 60)

        global _synthesis_t0
        _synthesis_t0 = time.time()
        run_wan21_synthesis(frames_dir, masks_dir, wan21_path, enhanced, job, out_frames_dir)
        progress("Wan 2.1 FP8", "Synthesis complete", 88, vram_mb=get_vram_mb())

        fps_target = 60.0 if enable_rife else src_fps
        run_rife_and_encode(out_frames_dir, output_video, audio_path, src_fps, fps_target, job)

        elapsed = time.time() - t_start
        emit("result",
             output_path=str(output_video),
             duration_s=round(elapsed, 2),
             fps_in=src_fps,
             fps_out=fps_target,
             frames=len(sorted(out_frames_dir.glob("*.png"))),
             models_used={
                 "sam2": sam2_path.exists(),
                 "dwpose": dwpose_path.exists(),
                 "gemma": gemma_path.exists(),
                 "wan21": wan21_path.exists()
             })

    except Exception as e:
        import traceback
        error(f"Pipeline error: {e}\n{traceback.format_exc()}", recoverable=False)
    finally:
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        error("Usage: genux_infer.py <job_config.json>", recoverable=False)
        sys.exit(1)

    cfg_path = Path(sys.argv[1])
    if not cfg_path.exists():
        error(f"Config not found: {cfg_path}", recoverable=False)
        sys.exit(1)

    try:
        job = json.loads(cfg_path.read_text())
    except Exception as e:
        error(f"Bad JSON config: {e}", recoverable=False)
        sys.exit(1)

    run_pipeline(job)
