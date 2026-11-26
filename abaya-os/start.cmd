@echo off
rem ABAYA OS - double-click to start on Windows (includes the labelled demo store).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" -Demo
pause
