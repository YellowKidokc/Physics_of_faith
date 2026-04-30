#Requires AutoHotkey v2.0+
#SingleInstance Force

global SERVICES_INI := A_ScriptDir "\..\config\services.ini"
global LAST_CLIP := ""
OnClipboardChange(ClipChanged)

ClipChanged(*) {
    global LAST_CLIP
    txt := A_Clipboard
    if !IsSet(txt) || txt = "" || txt = LAST_CLIP
        return
    LAST_CLIP := txt
    PostClip(txt)
}

PostClip(content) {
    endpointKey := IniRead(SERVICES_INI, "CLIPBOARD", "active", "local")
    baseUrl := IniRead(SERVICES_INI, "CLIPBOARD", endpointKey, "http://localhost:3456")
    payload := Format('{{"content":{1},"title":"Clipboard","category":"clipboard","ts":"{2}"}}', JsonStr(content), FormatTime(A_NowUTC, "yyyy-MM-ddTHH:mm:ssZ"))
    http := ComObject("WinHttp.WinHttpRequest.5.1")
    try {
        http.Open("POST", baseUrl "/clips", true)
        http.SetRequestHeader("Content-Type", "application/json")
        http.Send(payload)
    }
}
JsonStr(s) => '"' StrReplace(StrReplace(StrReplace(s, '\\', '\\\\'), '"', '\\"'), '`n', '\\n') '"'

^!s:: {
    txt := A_Clipboard
    if txt != ""
        PostClip(txt)
}
