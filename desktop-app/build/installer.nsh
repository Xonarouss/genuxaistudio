; Genux AI Studio — NSIS Custom Installer Script
; electron-builder calls:
;   customHeader        — injected into the header
;   customInstall       — runs at end of Install section
;   customUnInstall     — runs at start of Uninstall section

; ──────────────────────────────────────────────────────────────
; INSTALL: Finish page README checkbox
; ──────────────────────────────────────────────────────────────
!macro customHeader
  !define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\resources\app\README.txt"
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Open README after install"
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!macroend

; ──────────────────────────────────────────────────────────────
; UNINSTALL: Complete removal of ALL app data, caches, models
;
; electron-builder calls this macro inside the Uninstall section.
; This is the ONLY custom hook that is actually executed.
; ──────────────────────────────────────────────────────────────
!macro customUnInstall

  ; Ask user whether to also delete downloaded AI model files.
  ; Model weights can be many GB — give them the choice.
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you also want to remove downloaded AI model files?$\n$\nThis will delete all neural weights from:$\n  $PROFILE\.cache\genux\models$\n$\nSay NO to keep your models for a future reinstall." \
    IDNO skip_models

    DetailPrint "Removing AI model weights and settings cache..."
    RMDir /r "$PROFILE\.cache\genux"
    DetailPrint "AI models removed."
    Goto after_models

  skip_models:
    DetailPrint "AI model files kept at: $PROFILE\.cache\genux\models"

  after_models:

  ; ── Electron userData directories ───────────────────────────
  ; Electron derives userData from productName.
  ; electron-builder sets productName = "Genux AI Studio" so:
  ;   %APPDATA%\Genux AI Studio   (primary)
  ;   %APPDATA%\genux-desktop-app (fallback name-id)
  DetailPrint "Removing Electron user data..."
  RMDir /r "$APPDATA\Genux AI Studio"
  RMDir /r "$APPDATA\genux-desktop-app"

  ; ── Electron local app data cache ───────────────────────────
  DetailPrint "Removing Electron local app caches..."
  RMDir /r "$LOCALAPPDATA\Genux AI Studio"
  RMDir /r "$LOCALAPPDATA\genux-desktop-app"
  RMDir /r "$LOCALAPPDATA\genux-desktop-app-updater"
  RMDir /r "$LOCALAPPDATA\GenuxAI"

  ; ── Default video export folder (remove only if empty) ──────
  RMDir "$PROFILE\Videos\Genux AI"

  ; ── Remove install directory itself (catches bin\yt-dlp.exe) ─
  ; electron-builder tracks files it packaged but does NOT track
  ; files added via extraResources — so $INSTDIR\resources\bin\
  ; (where yt-dlp.exe lives) stays behind without this line.
  DetailPrint "Removing install directory and all remaining files..."
  RMDir /r "$INSTDIR"

  ; ── Start Menu shortcut folder ──────────────────────────────
  RMDir "$SMPROGRAMS\Genux AI Studio"

  ; ── Registry cleanup ────────────────────────────────────────
  ; electron-builder writes to HKCU for per-user installs.
  DetailPrint "Cleaning registry entries..."
  DeleteRegKey HKCU "Software\nl.xonarous.genux"
  DeleteRegKey HKCU "Software\Genux AI Studio"
  DeleteRegKey HKCU "Software\genux-desktop-app"

  DetailPrint "Genux AI Studio has been fully removed."

!macroend

; Stub — electron-builder does NOT call customRemoveFiles automatically
!macro customRemoveFiles
!macroend
