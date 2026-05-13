@echo off
setlocal

cd /d "%~dp0.."

set "PORT=5000"
set "NODE_ENV=development"
set "DB_CLIENT=sqlite"
set "AUTO_MIGRATE=true"
set "TRUST_PROXY=false"
set "RATE_LIMIT_WINDOW_MS=900000"
set "RATE_LIMIT_MAX=300"
set "FRONTEND_URL=http://localhost:3000,http://127.0.0.1:3000,https://localhost,capacitor://localhost"

call npm --prefix backend run migrate
if errorlevel 1 exit /b %errorlevel%

call npm --prefix backend start

