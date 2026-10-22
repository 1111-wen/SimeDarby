@echo off
title FloodSafe Route Frontend Server
echo ========================================================
echo  Starting FloodSafe Route Frontend Web Server
echo  Port: 8000 (http://localhost:8000)
echo ========================================================
cd /d "%~dp0web"
python -m http.server 8000
pause
