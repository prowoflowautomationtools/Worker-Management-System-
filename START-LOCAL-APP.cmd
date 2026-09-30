@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"

if defined NODE_EXE (
  start "WorkPay India Local Server" cmd /k ""%NODE_EXE%" tools\local-server.js"
) else (
  where node >nul 2>&1
  if not errorlevel 1 (
    start "WorkPay India Local Server" cmd /k "node tools\local-server.js"
  ) else (
    where py >nul 2>&1
    if not errorlevel 1 (
      start "WorkPay India Local Server" cmd /k "py -m http.server 4173 --directory outputs\attendance-payroll-app"
    ) else (
      where python >nul 2>&1
      if not errorlevel 1 (
        start "WorkPay India Local Server" cmd /k "python -m http.server 4173 --directory outputs\attendance-payroll-app"
      ) else (
        echo Node.js or Python was not found. Install one or use GitHub Pages for online access.
        pause
        exit /b 1
      )
    )
  )
)

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173/"
echo WorkPay India is opening at http://127.0.0.1:4173/
endlocal
