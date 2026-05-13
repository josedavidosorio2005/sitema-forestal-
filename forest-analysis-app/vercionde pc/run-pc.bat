@echo off
setlocal

cd /d "%~dp0"

set "ELECTRON_RUN_AS_NODE="

if not exist "node_modules" (
  call npm install
  if errorlevel 1 exit /b %errorlevel%
)

if not exist "build" (
  call npm run build
  if errorlevel 1 exit /b %errorlevel%
)

call npm run desktop
