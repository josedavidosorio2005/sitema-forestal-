@echo off
setlocal

echo Forest Analysis - entorno local
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js no esta instalado o no esta en PATH.
  exit /b 1
)

if "%DB_CLIENT%"=="" set DB_CLIENT=sqlite
if "%REACT_APP_API_URL%"=="" set REACT_APP_API_URL=http://localhost:5000/api

echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo DB_CLIENT=%DB_CLIENT%
echo.

start "Forest Analysis API" cmd /k "cd /d %~dp0backend && set DB_CLIENT=%DB_CLIENT%&& npm run migrate && npm run seed && npm start"
timeout /t 3 /nobreak >nul
start "Forest Analysis Web" cmd /k "cd /d %~dp0frontend && set REACT_APP_API_URL=%REACT_APP_API_URL%&& npm start"

echo Listo. Cierra las ventanas abiertas para detener los servicios.
endlocal
