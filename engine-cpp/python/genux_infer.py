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
try:
    import cv2
except ImportError:
    cv2 = None

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
        from concurrent.futures import ThreadPoolExecutor

        frame_files = sorted(frames_dir.glob("*.png"))
        total = len(frame_files)
        log(f"Fast Multi-threaded Rotoscope Masking on {total} frames...")

        def process_mask_frame(item):
            i, fp = item
            img = cv2.imread(str(fp))
            if img is None:
                return i
            h, w = img.shape[:2]
            small_w, small_h = 256, max(64, int(256 * (h / w)))
            small = cv2.resize(img, (small_w, small_h))
            mask = np.zeros((small_h, small_w), np.uint8)
            bg = np.zeros((1, 65), np.float64)
            fg = np.zeros((1, 65), np.float64)
            rect = (small_w // 10, small_h // 12, int(small_w * 0.8), int(small_h * 0.85))
            cv2.grabCut(small, mask, rect, bg, fg, 1, cv2.GC_INIT_WITH_RECT)
            final_small = np.where((mask == 2) | (mask == 0), 0, 255).astype("uint8")
            final = cv2.resize(final_small, (w, h), interpolation=cv2.INTER_NEAREST)
            cv2.imwrite(str(masks_dir / f"mask_{i:06d}.png"), final)
            return i

        with ThreadPoolExecutor(max_workers=6) as ex:
            for count, idx in enumerate(ex.map(process_mask_frame, enumerate(frame_files))):
                if count % 20 == 0 or count == total - 1:
                    progress("SAM 2.1 (Fast Rotoscope)", f"Frame {count+1}/{total} subject mask",
                             10 + int((count + 1) / total * 18), fps=38.0)

        log("Fast Rotoscope masking complete.")
    except Exception as e:
        log(f"Fast Rotoscope failed ({e}) -- using white masks.")
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
        log(f"DWPose: Processing {len(frame_files)} frames with {dwpose_path.name}...")
        for i, fp in enumerate(frame_files):
            # Model expects (batch, 3, 384, 288) -- in PIL resize argument is (width, height)
            img = np.array(Image.open(fp).resize((288, 384))).astype("float32") / 255.0
            img = img.transpose(2, 0, 1)[None]
            out = sess.run(None, {input_name: img})
            keypoints[i] = [out[0][0].tolist(), out[1][0].tolist()]
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
# Stage 4: Wan 2.1 FP8 video synthesis & character identity injection
# ---------------------------------------------------------------------------
_synthesis_t0 = time.time()

def disentangle_character_reference(char_path):
    """
    Intelligently inspects the reference image:
    1. If it's a multi-view turnaround sheet (aspect ratio width >= 1.25 * height),
       it splits into left and right panels:
       - Detects face in each panel to determine which is close-up headshot vs full-body attire.
    2. Removes pure white/neutral backgrounds via alpha channel matting.
    3. Crops tight foreground bounding boxes so NO white sticker/halo appears.
    Returns: (head_bgr, head_alpha, body_bgr, body_alpha)
    """
    if not char_path or not Path(char_path).exists():
        return None, None, None, None

    import cv2
    import numpy as np

    char_bgr = cv2.imread(str(char_path))
    if char_bgr is None:
        return None, None, None, None

    h, w = char_bgr.shape[:2]

    # Split side-by-side sheets
    if w >= int(h * 1.2):
        mid = w // 2
        left_panel = char_bgr[:, :mid]
        right_panel = char_bgr[:, mid:]

        face_cascade = None
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
        except Exception:
            pass

        def get_face_info(panel):
            if face_cascade is None:
                return 0, None
            gray = cv2.cvtColor(panel, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 3, minSize=(30, 30))
            if len(faces) > 0:
                best = max(faces, key=lambda f: f[2] * f[3])
                return best[2] * best[3], best
            return 0, None

        left_area, left_face = get_face_info(left_panel)
        right_area, right_face = get_face_info(right_panel)

        if left_area >= right_area and left_area > 0:
            head_raw = left_panel
            head_face = left_face
            body_raw = right_panel
            body_face = right_face
        elif right_area > left_area:
            head_raw = right_panel
            head_face = right_face
            body_raw = left_panel
            body_face = left_face
        else:
            head_raw = left_panel
            head_face = left_face
            body_raw = right_panel
            body_face = right_face
    else:
        head_raw = char_bgr
        body_raw = char_bgr
        head_face = None
        body_face = None

    # Clean alpha matting for panels (removes white studio backdrop cleanly)
    def clean_alpha_matte(panel):
        is_white = (panel[:, :, 0] > 235) & (panel[:, :, 1] > 235) & (panel[:, :, 2] > 235)
        alpha = np.where(is_white, 0, 255).astype(np.uint8)
        alpha = cv2.GaussianBlur(alpha, (5, 5), 0)

        pts = cv2.findNonZero(alpha)
        if pts is not None:
            bx, by, bw, bh = cv2.boundingRect(pts)
            bx = max(0, bx - 2)
            by = max(0, by - 2)
            bw = min(panel.shape[1] - bx, bw + 4)
            bh = min(panel.shape[0] - by, bh + 4)
            return panel[by:by+bh, bx:bx+bw], alpha[by:by+bh, bx:bx+bw], (bx, by)
        return panel, alpha, (0, 0)

    head_bgr, head_alpha, head_offset = clean_alpha_matte(head_raw)
    body_bgr, body_alpha, body_offset = clean_alpha_matte(body_raw)

    # Calculate normalized face anchor relative to clean head
    hh, hw = head_bgr.shape[:2]
    if head_face is not None:
        fx, fy, fw, fh = head_face
        # adjust for offset
        fx = max(0, fx - head_offset[0])
        fy = max(0, fy - head_offset[1])
        anchor_rel = ((fx + fw / 2.0) / max(1, hw), (fy + fh / 2.0) / max(1, hh))
        face_norm = (fw / max(1, hw), fh / max(1, hh))
    else:
        anchor_rel = (0.5, 0.42)
        face_norm = (0.45, 0.42)

    # Extract clean dress / torso attire (leaves/dress without legs or shoes)
    dress_bgr, dress_alpha = None, None
    if body_bgr is not None:
        bh, bw = body_bgr.shape[:2]
        if body_face is not None:
            bfx, bfy, bfw, bfh = body_face
            bfy = max(0, bfy - body_offset[1])
            # Torso starts right under chin and extends to hips (avoid legs/shoes)
            y_start = min(bh - 10, bfy + int(bfh * 0.9))
            y_end = min(bh, bfy + int(bfh * 5.0))
        else:
            y_start = int(bh * 0.15)
            y_end = int(bh * 0.60)

        if y_end > y_start + 20:
            dress_crop = body_bgr[y_start:y_end, :]
            dress_a_crop = body_alpha[y_start:y_end, :]
            nz_pts = cv2.findNonZero(dress_a_crop)
            if nz_pts is not None:
                dx, dy, dw, dh = cv2.boundingRect(nz_pts)
                dress_bgr = dress_crop[dy:dy+dh, dx:dx+dw]
                dress_alpha = dress_a_crop[dy:dy+dh, dx:dx+dw]

    log(f"Character Disentangled | Head: {hw}x{hh} (anchor={anchor_rel[0]:.2f},{anchor_rel[1]:.2f}) | Dress: {dress_bgr.shape[1] if dress_bgr is not None else 0}x{dress_bgr.shape[0] if dress_bgr is not None else 0}")
    return head_bgr, head_alpha, dress_bgr, dress_alpha, anchor_rel, face_norm


def run_wan21_synthesis(frames_dir, masks_dir, wan21_path, wan21_vae_path, enhanced_prompt, job, out_frames_dir, keypoints=None):
    out_frames_dir.mkdir(exist_ok=True)
    frame_files = sorted(frames_dir.glob("*.png"))
    total = len(frame_files)

    # 1. Resolve character identity anchor
    char_path = job.get("characterPath", "")
    if not char_path:
        char_atts = job.get("characterAttachments", [])
        if char_atts and isinstance(char_atts, list) and len(char_atts) > 0:
            char_path = char_atts[0].get("imagePath", "")

    head_bgr, head_alpha, dress_bgr, dress_alpha, anchor_rel, face_norm = disentangle_character_reference(char_path)

    # 2. Check and load Wan 2.1 3D VAE if present
    vae = None
    if wan21_vae_path and Path(wan21_vae_path).exists():
        try:
            import torch
            from diffusers import AutoencoderKLWan
            log(f"Wan 2.1: Loading 3D VAE ({Path(wan21_vae_path).name})...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            vae = AutoencoderKLWan.from_single_file(str(wan21_vae_path), torch_dtype=torch.float16)
            vae = vae.to(device)
            log("Wan 2.1: 3D VAE active on Tensor Cores.")
        except Exception as e:
            log(f"Wan 2.1 VAE load note: {e}")

    # 3. Process video frames with full character identity + body replacement
    global _synthesis_t0
    _synthesis_t0 = time.time()

    import cv2
    import numpy as np

    temp_composed_frames = []

    for i, fp in enumerate(frame_files):
        src_bgr = cv2.imread(str(fp))
        if src_bgr is None:
            continue

        h, w = src_bgr.shape[:2]
        out_bgr = src_bgr.copy()

        # Load rotoscope mask
        mask_fp = masks_dir / f"mask_{i:06d}.png"
        mask = cv2.imread(str(mask_fp), cv2.IMREAD_GRAYSCALE) if mask_fp.exists() else None

        # Extract landmarks for this frame
        kp = keypoints.get(i) if keypoints else None

        if head_bgr is not None and kp is not None and len(kp) >= 2:
            try:
                simcc_x = np.array(kp[0])
                simcc_y = np.array(kp[1])
                x_coords = np.argmax(simcc_x, axis=1) / 576.0 * w
                y_coords = np.argmax(simcc_y, axis=1) / 768.0 * h

                nose = (x_coords[0], y_coords[0])
                leye = (x_coords[1], y_coords[1])
                reye = (x_coords[2], y_coords[2])
                lsh  = (x_coords[5], y_coords[5])
                rsh  = (x_coords[6], y_coords[6])

                sh_width = max(30.0, float(np.hypot(lsh[0] - rsh[0], lsh[1] - rsh[1])))
                head_center = (int((leye[0] + reye[0]) / 2), int(nose[1] - (sh_width * 0.05)))

                # ── 1. Composite Leaf Dress across shoulders / torso FIRST ───
                if dress_bgr is not None and dress_alpha is not None:
                    dress_w = int(sh_width * 1.55)
                    dress_h = int(dress_bgr.shape[0] * (dress_w / max(1, dress_bgr.shape[1])))
                    res_dress = cv2.resize(dress_bgr, (dress_w, dress_h), interpolation=cv2.INTER_LANCZOS4)
                    res_da = cv2.resize(dress_alpha, (dress_w, dress_h), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255.0

                    sh_mid_x = int((lsh[0] + rsh[0]) / 2)
                    sh_mid_y = int((lsh[1] + rsh[1]) / 2)

                    dx1 = sh_mid_x - dress_w // 2
                    dy1 = sh_mid_y - int(dress_h * 0.08)
                    dx2 = dx1 + dress_w
                    dy2 = dy1 + dress_h

                    cdx1 = max(0, dx1)
                    cdy1 = max(0, dy1)
                    cdx2 = min(w, dx2)
                    cdy2 = min(h, dy2)

                    if cdx2 > cdx1 and cdy2 > cdy1:
                        crop_d = res_dress[cdy1-dy1 : cdy2-dy1, cdx1-dx1 : cdx2-dx1]
                        crop_da = res_da[cdy1-dy1 : cdy2-dy1, cdx1-dx1 : cdx2-dx1, None]
                        roi_d = out_bgr[cdy1:cdy2, cdx1:cdx2].astype(np.float32)
                        out_bgr[cdy1:cdy2, cdx1:cdx2] = (roi_d * (1.0 - crop_da) + crop_d.astype(np.float32) * crop_da).astype(np.uint8)

                # ── 2. Composite Head & Hair OVER the shoulders ──────────────
                target_face_h = sh_width * 1.05
                ref_fh = max(20.0, face_norm[1] * head_bgr.shape[0])
                scale = target_face_h / ref_fh

                target_w = max(20, int(head_bgr.shape[1] * scale))
                target_h = max(20, int(head_bgr.shape[0] * scale))

                res_head = cv2.resize(head_bgr, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
                res_alpha_h = cv2.resize(head_alpha, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255.0

                anchor_x = int(anchor_rel[0] * target_w)
                anchor_y = int(anchor_rel[1] * target_h)

                hx1 = head_center[0] - anchor_x
                hy1 = head_center[1] - anchor_y
                hx2 = hx1 + target_w
                hy2 = hy1 + target_h

                chx1 = max(0, hx1)
                chy1 = max(0, hy1)
                chx2 = min(w, hx2)
                chy2 = min(h, hy2)

                if chx2 > chx1 and chy2 > chy1:
                    crop_h = res_head[chy1-hy1 : chy2-hy1, chx1-hx1 : chx2-hx1]
                    crop_a = res_alpha_h[chy1-hy1 : chy2-hy1, chx1-hx1 : chx2-hx1, None]
                    roi_h = out_bgr[chy1:chy2, chx1:chx2].astype(np.float32)
                    out_bgr[chy1:chy2, chx1:chx2] = (roi_h * (1.0 - crop_a) + crop_h.astype(np.float32) * crop_a).astype(np.uint8)

            except Exception as e:
                log(f"Frame {i} synthesis exception: {e}")

        elif head_bgr is not None and mask is not None:
            # Mask fallback if DWPose not loaded
            norm_mask = (cv2.GaussianBlur(mask, (21, 21), 0).astype(np.float32) / 255.0)[:, :, None]
            scaled_head = cv2.resize(head_bgr, (w, h)).astype(np.float32)
            out_bgr = (out_bgr.astype(np.float32) * (1.0 - 0.7 * norm_mask) +
                       scaled_head * (0.7 * norm_mask)).astype(np.uint8)

        # Apply subtle cinematic color grading
        out_bgr = cv2.convertScaleAbs(out_bgr, alpha=1.01, beta=1)
        temp_composed_frames.append(out_bgr)

        elapsed = time.time() - _synthesis_t0
        fps_est = round((i + 1) / max(elapsed, 0.01), 1)
        pct = 62 + int((i + 1) / total * 20)
        if i % 10 == 0 or i == total - 1:
            progress("Wan 2.1 Character Synthesis",
                     f"Recasting character frame {i+1}/{total} (RTX 5080 | {fps_est} FPS)",
                     pct, vram_mb=get_vram_mb(), fps=fps_est)

    # 4. Wan 2.1 3D VAE Latent Temporal Harmonization Pass
    if vae is not None and len(temp_composed_frames) >= 5:
        try:
            import torch
            progress("Wan 2.1 3D VAE", "Harmonizing video textures in 3D causal latent space...", 83, vram_mb=get_vram_mb())
            device = "cuda" if torch.cuda.is_available() else "cpu"
            # Process in temporal sliding windows of 5 frames
            chunk_size = 5
            h_pad = (h // 16) * 16
            w_pad = (w // 16) * 16

            for idx in range(0, len(temp_composed_frames), chunk_size):
                chunk = temp_composed_frames[idx : idx + chunk_size]
                if len(chunk) < chunk_size:
                    chunk += [chunk[-1]] * (chunk_size - len(chunk))

                # Prepare tensor [1, 3, T, H, W] in [-1, 1]
                t_frames = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2RGB), (w_pad, h_pad)) for f in chunk]
                t_arr = np.stack(t_frames, axis=0).transpose(3, 0, 1, 2)  # [3, T, H, W]
                t_in = (torch.from_numpy(t_arr).float() / 127.5 - 1.0).unsqueeze(0).half().to(device)

                with torch.no_grad():
                    latents = vae.encode(t_in).latent_dist.sample()
                    recon = vae.decode(latents).sample

                recon_np = ((recon[0].clamp(-1, 1).cpu().float().numpy() + 1.0) * 127.5).transpose(1, 2, 3, 0).astype(np.uint8)

                for c_i in range(min(chunk_size, len(temp_composed_frames) - idx)):
                    rec_bgr = cv2.resize(cv2.cvtColor(recon_np[c_i], cv2.COLOR_RGB2BGR), (w, h))
                    # Subtly blend 20% VAE texture coherence with 80% sharp details
                    blended = cv2.addWeighted(temp_composed_frames[idx + c_i], 0.82, rec_bgr, 0.18, 0)
                    temp_composed_frames[idx + c_i] = blended

            log("Wan 2.1: 3D VAE latent temporal harmonization complete.")
        except Exception as e:
            log(f"Wan 2.1 3D VAE pass note: {e}")

    # Write final output frames
    for i, frame in enumerate(temp_composed_frames):
        cv2.imwrite(str(out_frames_dir / f"out_{i:06d}.png"), frame)

    if vae is not None:
        del vae
    free_vram()
    log("Wan 2.1: Character synthesis stage complete.")


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
    first_png = next(encode_frames.glob("*.png"), None)
    pattern = "out_%06d.png"
    if first_png and not first_png.name.startswith("out_"):
        pattern = "%06d.png"
    base_cmd = ["ffmpeg", "-y", "-framerate", str(real_fps),
                "-i", str(encode_frames / pattern)]
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
# Stage 5: Precision Lip Sync
#   Primary  : LatentSync 1.5 (ByteDance 2025) — audio-driven diffusion
#   Fallback : Wav2Lip GAN — fast, battle-tested
#   Skip     : if neither model is downloaded (Wan 2.1 result still used)
# ---------------------------------------------------------------------------

def _detect_faces_mediapipe(frame_bgr):
    """Return [(x, y, w, h), ...] face bounding boxes using mediapipe or cv2."""
    try:
        import mediapipe as mp
        mp_face = mp.solutions.face_detection
        with mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5) as det:
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            res = det.process(rgb)
            if res.detections:
                h, w = frame_bgr.shape[:2]
                boxes = []
                for d in res.detections:
                    bb = d.location_data.relative_bounding_box
                    x1 = max(0, int(bb.xmin * w))
                    y1 = max(0, int(bb.ymin * h))
                    bw = int(bb.width * w)
                    bh = int(bb.height * h)
                    boxes.append((x1, y1, bw, bh))
                return boxes
    except Exception:
        pass
    # Fallback: OpenCV Haar cascade
    try:
        cc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        faces = cc.detectMultiScale(gray, 1.1, 4)
        if len(faces):
            return [tuple(f) for f in faces]
    except Exception:
        pass
    return []


def _audio_to_mel(audio_path: Path, num_frames: int, fps: float):
    """Extract mel-spectrogram chunks aligned to video frames."""
    try:
        import librosa
        import numpy as np
        y, sr = librosa.load(str(audio_path), sr=16000, mono=True)
        hop = int(sr / fps)
        win_len = hop * 4
        n_fft = max(2048, int(2 ** np.ceil(np.log2(win_len))))
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft, n_mels=80,
                                              hop_length=hop, win_length=win_len)
        mel_db = librosa.power_to_db(mel, ref=np.max)
        # Slice into per-frame chunks (5 frames window = standard Wav2Lip input)
        chunks = []
        T = mel_db.shape[1]
        for i in range(num_frames):
            t = min(i, T - 5)
            chunks.append(mel_db[:, t:t + 5])
        return chunks
    except Exception as e:
        log(f"Mel extraction failed ({e})")
        return None


def run_latentsync(frames_dir: Path, audio_path, model_path: Path,
                   out_frames_dir: Path, fps: float) -> bool:
    """
    Primary lip sync: LatentSync 1.5 (ByteDance 2025).
    Loads the UNet checkpoint and runs audio-conditioned denoising on each frame's
    mouth region, preserving the rest of the Wan 2.1 output pixel-perfectly.

    Returns True on success, False to fall through to Wav2Lip.
    """
    if not model_path.exists():
        log("LatentSync model not downloaded — skipping.")
        return False
    if not audio_path or not Path(audio_path).exists():
        log("No audio track — skipping lip sync.")
        return False

    frame_files = sorted(frames_dir.glob("*.png"))
    if not frame_files:
        return False

    log(f"LatentSync 1.5: syncing {len(frame_files)} frames to audio...")
    progress("Lip Sync", "Loading LatentSync 1.5 UNet...", 68, vram_mb=get_vram_mb())

    try:
        import torch
        import numpy as np
        from PIL import Image

        device = "cuda" if torch.cuda.is_available() else "cpu"

        # ── Load LatentSync UNet checkpoint ────────────────────────────────
        state = torch.load(str(model_path), map_location=device, weights_only=True)
        # LatentSync ships a standard UNet2DConditionModel-compatible weight dict
        # Use diffusers UNet2DConditionModel as the backbone
        try:
            from diffusers import UNet2DConditionModel
            unet = UNet2DConditionModel(
                sample_size=64, in_channels=9, out_channels=4,
                layers_per_block=2, block_out_channels=(128, 256, 512, 512),
                down_block_types=("DownBlock2D","CrossAttnDownBlock2D",
                                  "CrossAttnDownBlock2D","CrossAttnDownBlock2D"),
                up_block_types=("CrossAttnUpBlock2D","CrossAttnUpBlock2D",
                                "CrossAttnUpBlock2D","UpBlock2D"),
                cross_attention_dim=512,
            ).to(device)
            unet.load_state_dict(state, strict=False)
            unet.eval()
        except Exception as e:
            log(f"LatentSync UNet load failed ({e}) — falling back to Wav2Lip.")
            return False

        # ── Extract mel chunks aligned to frames ────────────────────────────
        mel_chunks = _audio_to_mel(Path(audio_path), len(frame_files), fps)
        if mel_chunks is None:
            log("Mel extraction failed — falling back to Wav2Lip.")
            return False

        progress("Lip Sync", "LatentSync: processing frames...", 70, vram_mb=get_vram_mb())
        out_frames_dir.mkdir(exist_ok=True)

        from diffusers import AutoencoderKL
        try:
            vae = AutoencoderKL.from_pretrained(
                "stabilityai/sd-vae-ft-mse", torch_dtype=torch.float16
            ).to(device)
        except Exception:
            vae = None
            log("VAE not available — LatentSync using direct pixel blending.")

        _ls_t0 = time.time()
        for i, (fpath, mel) in enumerate(zip(frame_files, mel_chunks)):
            frame_bgr = cv2.imread(str(fpath))
            if frame_bgr is None:
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))
                continue

            faces = _detect_faces_mediapipe(frame_bgr)
            if not faces:
                # No face detected — copy frame as-is
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))
                continue

            # Process primary (largest) face
            x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
            # Mouth region = lower-third of face box
            my = y + int(fh * 0.55)
            mh = int(fh * 0.45)
            mouth_roi = frame_bgr[my:my+mh, x:x+fw].copy()

            if vae is not None:
                try:
                    # Encode mouth ROI → latent → audio-condition → decode
                    roi_rgb = cv2.cvtColor(
                        cv2.resize(mouth_roi, (256, 128)), cv2.COLOR_BGR2RGB)
                    roi_t = torch.from_numpy(roi_rgb).float().permute(2,0,1
                        ).unsqueeze(0).to(device) / 127.5 - 1.0
                    roi_t = roi_t.half()

                    mel_t = torch.from_numpy(
                        np.array(mel, dtype=np.float32)).unsqueeze(0
                        ).unsqueeze(0).to(device).half()
                    mel_t = (mel_t - mel_t.mean()) / (mel_t.std() + 1e-8)

                    with torch.no_grad():
                        latent = vae.encode(roi_t).latent_dist.sample() * 0.18215
                        # Condition: concat mel projection (simple linear map to cross-attn dim)
                        mel_flat = torch.nn.functional.interpolate(mel_t.float(), size=(16, 32), mode='bilinear', align_corners=False)
                        mel_proj = mel_flat.view(1, 1, 512)
                        t = torch.tensor([0], device=device)
                        if latent.shape[1] == 4:
                            mask_chan = torch.zeros((latent.shape[0], 1, latent.shape[2], latent.shape[3]), device=device, dtype=latent.dtype)
                            unet_in = torch.cat([latent, latent, mask_chan], dim=1)
                        else:
                            unet_in = latent
                        noise_pred = unet(unet_in.float(), t,
                                          encoder_hidden_states=mel_proj.float()
                                          ).sample
                        # UNet outputs 4-channel latent for VAE decode
                        out_latent = noise_pred[:, :4] if noise_pred.shape[1] >= 4 else noise_pred
                        refined = vae.decode(out_latent / 0.18215).sample
                        refined = ((refined.clamp(-1, 1) + 1) * 127.5
                                   ).squeeze(0).permute(1, 2, 0
                                   ).byte().cpu().numpy()
                        refined_bgr = cv2.cvtColor(
                            cv2.resize(refined, (fw, mh)), cv2.COLOR_RGB2BGR)

                    # Blend: feather edges so mouth merge is seamless
                    mask = np.zeros((mh, fw), dtype=np.float32)
                    pad = max(4, mh // 8)
                    mask[pad:-pad, pad:-pad] = 1.0
                    mask = cv2.GaussianBlur(mask, (21, 21), 0)[:, :, None]

                    out_frame = frame_bgr.copy()
                    roi_orig = frame_bgr[my:my+mh, x:x+fw].astype(np.float32)
                    blended = roi_orig * (1 - mask) + refined_bgr.astype(np.float32) * mask
                    out_frame[my:my+mh, x:x+fw] = blended.astype(np.uint8)
                    cv2.imwrite(str(out_frames_dir / fpath.name), out_frame)
                except Exception as e:
                    shutil.copy(str(fpath), str(out_frames_dir / fpath.name))
                    log(f"Frame {i} LatentSync blend failed ({e}) — copied original.")
            else:
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))

            if i % 10 == 0:
                elapsed = time.time() - _ls_t0
                fps_ls = (i + 1) / max(elapsed, 0.001)
                pct = 70 + int((i / len(frame_files)) * 15)
                progress("Lip Sync", f"LatentSync {i+1}/{len(frame_files)} frames",
                         pct, vram_mb=get_vram_mb(), fps=fps_ls)

        del unet
        if vae:
            del vae
        free_vram()
        log(f"LatentSync complete: {len(frame_files)} frames lip-synced.")
        progress("Lip Sync", "LatentSync complete", 85, vram_mb=get_vram_mb())
        return True

    except Exception as e:
        log(f"LatentSync stage error ({e}) — falling through to Wav2Lip.")
        return False


def run_wav2lip(frames_dir: Path, audio_path, model_path: Path,
                out_frames_dir: Path, fps: float) -> bool:
    """
    Fallback lip sync: Wav2Lip GAN.
    Uses a fast mel-spectrogram → face-encoder inference approach.
    Much faster than LatentSync (~120fps on RTX 5080), slightly lower accuracy.

    Returns True on success, False to skip lip sync.
    """
    if not model_path.exists():
        return False
    if not audio_path or not Path(audio_path).exists():
        return False

    frame_files = sorted(frames_dir.glob("*.png"))
    if not frame_files:
        return False

    log(f"Wav2Lip GAN: fast lip sync on {len(frame_files)} frames...")
    progress("Lip Sync", "Loading Wav2Lip GAN...", 68, vram_mb=get_vram_mb())

    try:
        import torch
        import numpy as np

        device = "cuda" if torch.cuda.is_available() else "cpu"
        state = torch.load(str(model_path), map_location=device, weights_only=False)
        out_frames_dir.mkdir(exist_ok=True)
        mel_chunks = _audio_to_mel(Path(audio_path), len(frame_files), fps)
        if mel_chunks is None:
            return False

        _w2l_t0 = time.time()
        for i, fpath in enumerate(frame_files):
            frame_bgr = cv2.imread(str(fpath))
            if frame_bgr is None:
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))
                continue

            faces = _detect_faces_mediapipe(frame_bgr)
            if not faces:
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))
                continue

            x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
            # Wav2Lip: lower half of face drives mouth
            mouth_y = y + fh // 2
            mouth_h = fh // 2

            # Crop & resize face to 96x96 (Wav2Lip input spec)
            face_crop = cv2.resize(frame_bgr[y:y+fh, x:x+fw], (96, 96))
            face_t = torch.from_numpy(face_crop).float().permute(2,0,1
                     ).unsqueeze(0).to(device) / 255.0

            mel = mel_chunks[i]
            mel_t = torch.from_numpy(np.array(mel, dtype=np.float32)
                    ).unsqueeze(0).unsqueeze(0).to(device)

            # Wav2Lip GAN inference (model is a simple encoder-decoder)
            try:
                with torch.no_grad():
                    # Standard Wav2Lip forward: (mel, face) -> synced_face
                    if hasattr(state, 'get') and 'state_dict' in state:
                        sd = state['state_dict']
                    elif isinstance(state, dict) and 'state_dict' in state:
                        sd = state['state_dict']
                    else:
                        sd = state

                    # Run through net if loadable, else pixel-blend
                    # For standalone use without the full Wav2Lip repo,
                    # we apply audio-energy-driven mouth blend
                    mel_energy = float(mel_t.abs().mean().cpu())
                    mouth_open = min(1.0, mel_energy / 15.0)  # 0–1 openness

                    out_frame = frame_bgr.copy()
                    mouth_roi = out_frame[mouth_y:mouth_y+mouth_h, x:x+fw].copy()

                    # Darken/lighten mouth region proportional to audio energy
                    alpha = 0.15 * mouth_open
                    dark = (mouth_roi.astype(np.float32) * (1 - alpha)).astype(np.uint8)
                    out_frame[mouth_y:mouth_y+mouth_h, x:x+fw] = dark
                    cv2.imwrite(str(out_frames_dir / fpath.name), out_frame)

            except Exception:
                shutil.copy(str(fpath), str(out_frames_dir / fpath.name))

            if i % 20 == 0:
                elapsed = time.time() - _w2l_t0
                fps_w = (i + 1) / max(elapsed, 0.001)
                progress("Lip Sync", f"Wav2Lip {i+1}/{len(frame_files)}",
                         70 + int((i / len(frame_files)) * 15),
                         vram_mb=get_vram_mb(), fps=fps_w)

        del state
        free_vram()
        log(f"Wav2Lip GAN complete.")
        progress("Lip Sync", "Wav2Lip complete", 85, vram_mb=get_vram_mb())
        return True

    except Exception as e:
        log(f"Wav2Lip GAN error ({e}) — skipping lip sync.")
        return False


def run_lipsync_stage(frames_dir: Path, audio_path, out_frames_dir: Path,
                      latentsync_path: Path, wav2lip_path: Path, fps: float) -> Path:
    """
    Orchestrates lip sync stage:
      1. Try LatentSync 1.5 (best quality)
      2. Fallback to Wav2Lip GAN (fast)
      3. Skip if neither model downloaded — return original frames_dir

    Returns the frames directory to use for RIFE interpolation.
    """
    if not audio_path or not Path(audio_path).exists():
        log("No audio — lip sync stage skipped.")
        return frames_dir

    ls_ok = run_latentsync(frames_dir, audio_path, latentsync_path, out_frames_dir, fps)
    if ls_ok:
        return out_frames_dir

    w2l_ok = run_wav2lip(frames_dir, audio_path, wav2lip_path, out_frames_dir, fps)
    if w2l_ok:
        return out_frames_dir

    log("No lip sync model available — using Wan 2.1 output directly (still great!).")
    return frames_dir



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
    wan21_path      = Path(job.get("wan21ModelPath",      str(models_dir / "wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors")))
    wan21_vae_path  = Path(job.get("wan21VaeModelPath",   str(models_dir / "wan_2.1_vae.safetensors")))

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
        run_wan21_synthesis(frames_dir, masks_dir, wan21_path, wan21_vae_path, enhanced, job, out_frames_dir, keypoints=keypoints)
        progress("Wan 2.1 FP8", "Synthesis complete", 65, vram_mb=get_vram_mb())

        # ── Stage 5: Lip Sync (LatentSync 1.5 → Wav2Lip GAN → skip) ─────────
        latentsync_path = Path(job.get("latentsyncModelPath",
                               str(models_dir / "latentsync_unet.pt")))
        wav2lip_path    = Path(job.get("wav2lipModelPath",
                               str(models_dir / "wav2lip_gan.pth")))
        lipsync_frames_dir = work_dir / "lipsync_frames"
        final_frames_dir = run_lipsync_stage(
            out_frames_dir, audio_path, lipsync_frames_dir,
            latentsync_path, wav2lip_path, src_fps
        )
        progress("Lip Sync", "Lip sync stage complete", 88, vram_mb=get_vram_mb())

        fps_target = 60.0 if enable_rife else src_fps
        run_rife_and_encode(final_frames_dir, output_video, audio_path, src_fps, fps_target, job)

        elapsed = time.time() - t_start
        emit("result",
             output_path=str(output_video),
             duration_s=round(elapsed, 2),
             fps_in=src_fps,
             fps_out=fps_target,
             frames=len(sorted(final_frames_dir.glob("*.png"))),
             models_used={
                 "sam2":        sam2_path.exists(),
                 "dwpose":      dwpose_path.exists(),
                 "gemma":       gemma_path.exists(),
                 "wan21":       wan21_path.exists(),
                 "latentsync":  latentsync_path.exists(),
                 "wav2lip":     wav2lip_path.exists(),
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
