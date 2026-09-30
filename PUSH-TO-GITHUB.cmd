@echo off
setlocal
title WorkPay India - GitHub Push

set "GIT=C:\Users\techh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
set "GIT_EXEC_PATH=C:\Users\techh\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\mingw64\bin"
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "LOG=%~dp0github-push-result.txt"

echo WorkPay India GitHub push started > "%LOG%"
echo %date% %time% >> "%LOG%"

echo Pushing WorkPay India changes to GitHub...
echo Pushing WorkPay India changes to GitHub... >> "%LOG%"
cd /d "%REPO%"
if errorlevel 1 goto :error
if not exist "%GIT%" goto :error

"%GIT%" -c "safe.directory=%REPO%" status --short >> "%LOG%" 2>&1

set "PUSH_OK=0"
for /l %%A in (1,1,3) do (
    echo Push attempt %%A of 3...
    echo Push attempt %%A of 3... >> "%LOG%"
    "%GIT%" -c "safe.directory=%REPO%" -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main >> "%LOG%" 2>&1
    if not errorlevel 1 (
        set "PUSH_OK=1"
        goto :success
    )
    if %%A lss 3 timeout /t 4 /nobreak >nul
)
if "%PUSH_OK%"=="0" goto :error

:success
echo.
echo Push completed successfully.
echo Push completed successfully. >> "%LOG%"
echo Repository: https://github.com/prowoflowautomationtools/Worker-Management-System-
echo Repository: https://github.com/prowoflowautomationtools/Worker-Management-System- >> "%LOG%"
pause
exit /b 0

:error
echo.
echo Push could not be completed.
echo If GitHub asks for authentication, complete it and run this file again.
echo Push could not be completed. >> "%LOG%"
echo See the error above or open github-push-result.txt in this folder. >> "%LOG%"
pause
exit /b 1
