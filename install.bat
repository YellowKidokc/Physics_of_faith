@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title POF 2828 Unified Installer

echo.
echo ============================================================
echo  POF 2828 - Unified Installer
echo  Dashboard PWA + AI-HUB + Sync Server
echo ============================================================
echo.

set "FAIL=0"
set "WARN=0"
set "PYEXE="
set "NODEEXE="
set "AHKEXE="
set "NPMEXE="

REM ---------- Prereq checks ----------
echo [1/6] Checking prerequisites...
echo.

where python >nul 2>nul && set "PYEXE=python"
if not defined PYEXE where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE (
  echo   [FAIL] Python 3.10+ not on PATH. Install from https://www.python.org/
  set "FAIL=1"
) else (
  for /f "delims=" %%I in ('%PYEXE% --version 2^>^&1') do echo   [OK]   %%I
)

where node >nul 2>nul && set "NODEEXE=node"
if not defined NODEEXE (
  echo   [FAIL] Node.js not on PATH. Install LTS from https://nodejs.org/
  set "FAIL=1"
) else (
  for /f "delims=" %%I in ('node --version 2^>^&1') do echo   [OK]   Node %%I
)

where npm >nul 2>nul && set "NPMEXE=npm"
if not defined NPMEXE if defined NODEEXE (
  echo   [FAIL] npm not found alongside Node.
  set "FAIL=1"
)

where AutoHotkey64.exe >nul 2>nul && set "AHKEXE=AutoHotkey64.exe"
if not defined AHKEXE where AutoHotkey.exe >nul 2>nul && set "AHKEXE=AutoHotkey.exe"
if not defined AHKEXE (
  echo   [WARN] AutoHotkey v2 not found. ai-hub desktop hotkeys will be disabled.
  echo          Install from https://www.autohotkey.com/ if you want global hotkeys.
  set "WARN=1"
) else (
  echo   [OK]   AutoHotkey: %AHKEXE%
)

if "%FAIL%"=="1" (
  echo.
  echo Prerequisite check failed. Fix the items above and re-run this installer.
  goto :end
)

REM ---------- npm install ----------
echo.
echo [2/6] Installing npm dependencies...
call npm install
if errorlevel 1 (
  echo   [FAIL] npm install failed.
  set "FAIL=1"
  goto :end
)
echo   [OK] Dependencies installed.

REM ---------- Build dashboard ----------
echo.
echo [3/6] Building dashboard PWA...
call npm run build
if errorlevel 1 (
  echo   [FAIL] Build failed.
  set "FAIL=1"
  goto :end
)
echo   [OK] dist\ ready.

REM ---------- AI-HUB config ----------
echo.
echo [4/6] Preparing AI-HUB config...
if not exist "ai-hub\config\settings.ini" (
  if exist "ai-hub\config\settings.example.ini" (
    copy /Y "ai-hub\config\settings.example.ini" "ai-hub\config\settings.ini" >nul
    echo   [OK] Created ai-hub\config\settings.ini from example.
  ) else (
    echo   [WARN] ai-hub\config\settings.example.ini missing; skipping.
    set "WARN=1"
  )
) else (
  echo   [OK] ai-hub\config\settings.ini already exists.
)

REM ---------- Python deps for sync server ----------
echo.
echo [5/6] Checking sync server deps (openpyxl, optional)...
%PYEXE% -m pip install --disable-pip-version-check --quiet openpyxl >nul 2>nul
if errorlevel 1 (
  echo   [WARN] openpyxl install skipped; Excel tools in ai-hub may be limited.
  set "WARN=1"
) else (
  echo   [OK] openpyxl present.
)

REM ---------- Emit launcher scripts ----------
echo.
echo [6/6] Writing launcher scripts...

REM start_pof.bat — one-shot launch of everything
(
  echo @echo off
  echo setlocal
  echo cd /d "%%~dp0"
  echo echo Starting POF 2828 stack...
  echo start "POF Sync Server" /MIN "%PYEXE%" "server\sync_server.py"
  if defined AHKEXE (
    echo start "POF AI-HUB" "%AHKEXE%" "ai-hub\AI-HUB.ahk"
  ) else (
    echo echo [INFO] AutoHotkey not installed; skipping ai-hub launch.
  )
  echo echo Dashboard PWA is served from dist\. Open index.html or deploy to Cloudflare Pages.
  echo echo Done.
) > "start_pof.bat"
echo   [OK] start_pof.bat

REM stop_pof.bat — graceful shutdown
(
  echo @echo off
  echo taskkill /FI "WINDOWTITLE eq POF Sync Server*" /F ^>nul 2^>nul
  echo taskkill /FI "WINDOWTITLE eq POF AI-HUB*"        /F ^>nul 2^>nul
  echo taskkill /IM AutoHotkey64.exe /F ^>nul 2^>nul
  echo echo POF 2828 stopped.
) > "stop_pof.bat"
echo   [OK] stop_pof.bat

REM ---------- Startup shortcut (optional) ----------
echo.
set /p "MAKESTART=Create a Windows Startup shortcut so POF launches at login? (y/N): "
if /I "%MAKESTART%"=="y" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $startup=[Environment]::GetFolderPath('Startup'); $shortcut=$ws.CreateShortcut((Join-Path $startup 'POF 2828.lnk')); $shortcut.TargetPath='%~dp0start_pof.bat'; $shortcut.WorkingDirectory='%~dp0'; $shortcut.WindowStyle=7; $shortcut.Save()" >nul 2>nul
  if errorlevel 1 (
    echo   [WARN] Could not create Startup shortcut.
  ) else (
    echo   [OK]   Startup shortcut installed.
  )
)

:end
echo.
echo ============================================================
if "%FAIL%"=="0" (
  echo  INSTALL COMPLETE
  echo ============================================================
  echo.
  echo Next steps:
  echo   1. Edit ai-hub\config\settings.ini and add your API keys.
  echo   2. Run start_pof.bat to launch the stack locally.
  echo   3. Deploy dist\ to Cloudflare Pages for the hosted dashboard.
  if "%WARN%"=="1" echo   (Some optional components were skipped — see warnings above.)
) else (
  echo  INSTALL FAILED
  echo ============================================================
  echo Fix the errors above and re-run this installer.
)
echo.
set /p "=Press Enter to close..."
endlocal
