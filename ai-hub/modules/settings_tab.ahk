#Requires AutoHotkey v2.0+
if IsSet(HUB_CORE_LOADED)
    RegisterTab("Settings", Build_SettingsTab, 90)

global SERVICES_INI := A_ScriptDir "\..\config\services.ini"

global gServiceRows := Map()

gServiceNames := ["CLIPBOARD", "COMMS", "OLLAMA"]

Build_SettingsTab() {
    global gShell, DARK_TEXT, gServiceRows, gServiceNames
    gShell.gui.SetFont("s10 c" DARK_TEXT, "Segoe UI")
    gShell.gui.Add("Text", "xm+15 ym+45", "Service Endpoints")

    y := 80
    for name in gServiceNames {
        gShell.gui.Add("Text", "xm+15 y" y " w100", name)
        ddl := gShell.gui.Add("DropDownList", "x+10 yp-2 w120", ["local", "nas", "cloud"])
        urlTxt := gShell.gui.Add("Text", "x+10 yp+2 w360", ResolveServiceUrl(name, ddl.Text))
        status := gShell.gui.Add("Text", "x+10 yp w20", "●")
        btn := gShell.gui.Add("Button", "x+10 yp-2 w60", "Test")
        gServiceRows[name] := {ddl: ddl, urlTxt: urlTxt, status: status}
        ddl.Text := IniRead(SERVICES_INI, name, "active", "local")
        urlTxt.Text := ResolveServiceUrl(name, ddl.Text)
        ddl.OnEvent("Change", (*) => (urlTxt.Text := ResolveServiceUrl(name, ddl.Text)))
        btn.OnEvent("Click", (*) => PingService(name))
        y += 34
    }

    saveBtn := gShell.gui.Add("Button", "xm+15 y" y+10 " w90", "Save")
    saveBtn.OnEvent("Click", (*) => SaveServicesIni())
    statusBtn := gShell.gui.Add("Button", "x+10 yp w120", "Test All")
    statusBtn.OnEvent("Click", (*) => TestAllServices())
    TestAllServices()
}

ResolveServiceUrl(section, endpoint) => IniRead(SERVICES_INI, section, endpoint, "")
PingService(section) {
    global gServiceRows
    row := gServiceRows[section]
    row.status.Opt("cRed")
    row.status.Text := "●"
}
TestAllServices() {
    global gServiceNames
    for name in gServiceNames
        PingService(name)
}
SaveServicesIni() {
    global gServiceRows, SERVICES_INI
    for section, row in gServiceRows
        IniWrite(row.ddl.Text, SERVICES_INI, section, "active")
}
