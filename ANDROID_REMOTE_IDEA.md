# Genux AI Studio — Android Remote Control App
## Product Idea (saved 2026-10-24)

---

## Concept
A companion Android app that lets you control Genux AI Studio from your phone,
anywhere in the world, as long as your PC is on and Remote Control is enabled.

---

## Settings Panel: "Remote Control"
Location: Desktop App → Settings → **Remote Control** tab

### Toggle
- Big toggle: **Enable Remote Control** (ON / OFF)
- When OFF: nothing runs, no ports open, zero exposure

### Pairing
When turned ON, the desktop app shows:
1. A **QR code** — scan it with the Genux Android app to pair instantly
2. A **6-digit pairing code** — type it in the Android app manually
3. Both expire after 5 minutes and regenerate on each activation

### Step-by-step Tailscale setup guide (in-app, beautiful UI)
After pairing, the app walks the user through:

**Step 1 — Install Tailscale on your PC**
- Direct link to tailscale.com/download/windows
- Auto-detects if Tailscale is already installed
- Shows green checkmark when detected

**Step 2 — Create a free Tailscale account**
- Opens tailscale.com in browser
- Explains: "Free for personal use, up to 3 devices"

**Step 3 — Connect your PC to Tailscale**
- Shows the tailscaled login command / GUI steps
- Verifies connection (pings tailscale API)
- Shows the PC's Tailscale IP (100.x.x.x format)

**Step 4 — Install Tailscale on your Android**
- Links to Play Store
- Shows QR code for Play Store link

**Step 5 — Sign in with the same account on Android**
- Explanation with screenshots

**Step 6 — Done!**
- Shows the Tailscale IP the Android app will connect to
- "You can now use Genux AI Studio from anywhere, even on mobile data"
- Confetti animation 🎉

---

## Android App Features (Genux Remote)
- Browse your video library on the PC
- Upload a video from phone camera roll → send to PC for recasting
- Select characters from your vault (@attachment1, @attachment2...)
- Choose scene preset or type a custom prompt
- Hit **Recast** — job runs on your PC's GPU
- Live progress updates (SAM 2.1 → Wan 2.1 → Lip Sync → RIFE)
- Push notification when done
- Stream/download the output video to your phone
- View rendered video gallery

---

## Technical Architecture

### Desktop side
- Local REST API server: `localhost:7860` (starts when Remote Control is ON)
- Endpoints:
  - `GET  /api/status` — app version, GPU info, queue status
  - `POST /api/recast` — submit a recast job
  - `GET  /api/jobs/:id` — poll job progress
  - `GET  /api/videos` — list output videos
  - `GET  /api/videos/:id/stream` — stream video file
  - `POST /api/vault` — manage character vault
- Auth: Bearer token (generated at pairing time, stored on both sides)

### Network
- **Same network**: Android app connects directly to local IP
- **Different network**: via Tailscale VPN mesh (100.x.x.x stable IP)
- No port forwarding, no router config, no dynamic DNS needed
- Tailscale handles NAT traversal automatically (even CGNAT on mobile)

### Android app stack (when building)
- Kotlin + Jetpack Compose
- Retrofit for API calls
- ExoPlayer for video playback
- ZXing for QR scanning
- CameraX for video capture
- Tailscale SDK integration (optional — can use plain IP)

---

## Why this is a great product differentiator
- "Your PC is your personal AI studio — use it from anywhere"
- No subscription GPU costs — your own RTX does the work
- Nobody else offers this as a polished consumer product
- Viral potential: record video on phone → recast → share, all from your sofa
- Works offline from cloud — privacy-first

---

## Notes
- Tailscale free tier: 3 devices, plenty for PC + phone
- The guide must be beautiful, step-by-step, with animations — not a wall of text
- Remote Control should be very easy to disable (one toggle = everything stops)
- Consider adding a "Remote Control PIN" as an extra security layer
- Future: iPad app, macOS companion app

---
*Idea logged by Chris | Do not implement yet — save for Android development phase*
