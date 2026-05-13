@echo off
setlocal

cd /d "%~dp0"

set "ELECTRON_RUN_AS_NODE="

call npm install
if errorlevel 1 exit /b %errorlevel%

call npm run package:exe
if errorlevel 1 exit /b %errorlevel%

echo.
echo EXE listo:
echo %CD%\dist\Sistema-Forestal-PC-1.0.0-portable.exe
