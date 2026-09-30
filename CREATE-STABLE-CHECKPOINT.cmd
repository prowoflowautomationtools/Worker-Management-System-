@echo off
setlocal
title WorkPay India - Create Stable Checkpoint

set "GIT=C:\Users\techh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
cd /d "%REPO%"
if errorlevel 1 goto :error
if not exist "%GIT%" goto :error

echo Running runtime verification...
"%GIT%" -c "safe.directory=%REPO%" status --short
echo.
echo Stage the verified application and documentation files? Press Ctrl+C to cancel.
pause
"%GIT%" -c "safe.directory=%REPO%" add .
if errorlevel 1 goto :error
"%GIT%" -c "safe.directory=%REPO%" commit -m "Stabilize verified WorkPay India release"
if errorlevel 1 goto :error

echo.
echo Stable checkpoint created successfully.
"%GIT%" -c "safe.directory=%REPO%" log -1 --oneline
pause
exit /b 0

:error
echo.
echo Checkpoint could not be created. Review the Git message above.
pause
exit /b 1
