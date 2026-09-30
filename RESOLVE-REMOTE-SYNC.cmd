@echo off
setlocal
title WorkPay India - Resolve GitHub Synchronization

set "GIT=C:\Users\techh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
set "GIT_EXEC_PATH=C:\Users\techh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\mingw64\bin"
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
cd /d "%REPO%"
if errorlevel 1 goto :error
if not exist "%GIT%" goto :error

echo This will preserve the locally verified modular application.
echo It will retain remote GitHub commits and create a merge commit.
echo.
pause

"%GIT%" -c "safe.directory=%REPO%" rebase --abort >nul 2>&1
"%GIT%" -c "safe.directory=%REPO%" fetch origin
if errorlevel 1 goto :error

"%GIT%" -c "safe.directory=%REPO%" merge --no-commit origin/main
if not errorlevel 1 goto :commit

echo Resolving known application conflicts in favor of the verified local version...
"%GIT%" -c "safe.directory=%REPO%" checkout --ours outputs/attendance-payroll-app/app.js
"%GIT%" -c "safe.directory=%REPO%" checkout --ours outputs/attendance-payroll-app/report-worker.js
"%GIT%" -c "safe.directory=%REPO%" checkout --ours outputs/attendance-payroll-app/service-worker.js
"%GIT%" -c "safe.directory=%REPO%" add outputs/attendance-payroll-app/app.js outputs/attendance-payroll-app/report-worker.js outputs/attendance-payroll-app/service-worker.js
if errorlevel 1 goto :error

for /f "delims=" %%F in ('"%GIT%" -c "safe.directory=%REPO%" diff --name-only --diff-filter=U') do goto :unresolved

:commit
"%GIT%" -c "safe.directory=%REPO%" commit -m "Merge remote GitHub history with verified WorkPay release"
if errorlevel 1 goto :error

echo.
echo Synchronization commit created. Pushing to GitHub...
"%GIT%" -c "safe.directory=%REPO%" push origin main
if errorlevel 1 goto :error

echo.
echo GitHub synchronization and push completed successfully.
pause
exit /b 0

:unresolved
echo Additional merge conflicts remain. No push was performed.
echo Review the Git conflict output above, then run this script only after resolving them.
pause
exit /b 1

:error
echo.
echo Synchronization could not be completed. No force-push was attempted.
pause
exit /b 1
