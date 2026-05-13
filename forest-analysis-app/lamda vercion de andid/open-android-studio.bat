@echo off
setlocal

call npm run android:sync
if errorlevel 1 exit /b %errorlevel%

call npx cap open android

