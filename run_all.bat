@echo off
title FloodSafe Route Launcher
echo ========================================================
echo  Launching FloodSafe Route Systems (Frontend + Backend)
echo ========================================================

start "FloodSafe AI Backend (Port 5000)" cmd /k "%~dp0run_backend.bat"
start "FloodSafe Web Frontend (Port 8000)" cmd /k "%~dp0run_frontend.bat"

echo.
echo Both servers have been launched!
echo - Frontend: http://localhost:8000
echo - Backend:  http://localhost:5000
echo.
timeout /t 3 >nul
start http://localhost:8000
