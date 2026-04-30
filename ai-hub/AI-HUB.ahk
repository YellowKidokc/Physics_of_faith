#Requires AutoHotkey v2.0+
#SingleInstance Force
#Warn

; ============================================================
; AI-HUB v2 — Entry Point
; ============================================================
; Three processes, three tray icons:
;   1. AI-HUB (this)     — main GUI with tabs [shell32 icon]
;   2. ClipSync Bridge    — clipboard + hotkeys [notepad icon]
;   3. BetterTTS          — TTS with normalizer [GHOSTY icon]
;
; On startup also launches:
;   - sync_server.py (serves HTML panels)
;   - Prompt Picker HTML
;   - Research Links HTML
; ============================================================

#include .\hub_core.ahk
#include .\modules\manifest.ahk

; Boot the application (defined in hub_core.ahk)
Hub_Boot()

; --- SUBPROCESS 1: ClipSync Bridge server (Python, silent) ---
try Run(A_ScriptDir "\clipsync-bridge\start_bridge_silent.bat", , "Hide")

; --- SUBPROCESS 2: ClipSync hotkeys/UI bridge (AHK) ---
try Run(A_ScriptDir "\clipsync-bridge\clipsync_bridge.ahk")

; --- SUBPROCESS 3: BetterTTS (AHK, own tray icon) ---
try Run(A_ScriptDir "\BetterTTS\BetterTTS.ahk")

; --- HTML PANELS: Launch after server has time to start ---
SetTimer(LaunchStartupPanels, -3000)

LaunchStartupPanels() {
    try LaunchHtmlPanel(PanelUrl("prompt_picker.html"), "POF-Prompts")
    Sleep(500)
    try LaunchHtmlPanel(PanelUrl("research_links.html"), "POF-Links")
}

; Clipboard ingestion now lives in Python (sync_server.py).
; Keep AHK focused on GUI, hotkeys, and OS-level actions.


; Startup service checks
try {
    activeClipboard := IniRead(A_ScriptDir "\config\services.ini", "CLIPBOARD", "active", "local")
    if (activeClipboard = "local")
        Run(A_ScriptDir "\sync_server.py", , "Hide")
}
try {
    commsActive := IniRead(A_ScriptDir "\config\services.ini", "COMMS", "active", "cloud")
    commsUrl := IniRead(A_ScriptDir "\config\services.ini", "COMMS", commsActive, "")
    http := ComObject("WinHttp.WinHttpRequest.5.1")
    http.Open("GET", commsUrl, true)
    http.Send()
}
^!a::Run(A_ScriptDir "\modules\app_launcher.html")
