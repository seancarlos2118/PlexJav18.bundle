@echo off
title Image Crop API Installer
cd /d "%~dp0"

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo ==========================================
echo        Image Crop API - Setup
echo ==========================================
echo 1. Native Node.js + PM2 (RECOMMENDED - Auto-starts on Windows boot)
echo 2. Docker (Builds locally + Auto-starts with Docker Desktop)
echo.
set /p choice="Choose installation method (1 or 2): "

if "%choice%"=="1" goto native
if "%choice%"=="2" goto docker
echo Invalid choice.
pause
exit /b

:docker
echo Building and starting Docker container...
docker compose up -d --build
echo.
echo Done! Image Crop API is running at http://localhost:3133
pause
exit /b

:native
echo Installing Node dependencies...
call npm install --omit=dev
echo Installing PM2 and Windows startup service...
call npm install -g pm2 pm2-windows-startup
call pm2-startup install
call pm2 start server.js --name "image-crop-api"
call pm2 save
echo.
echo Done! Image Crop API is running at http://localhost:3133 and registered for Windows startup.
pause
exit /b
