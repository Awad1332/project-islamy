@echo off
rem ABAYA OS - double-click to stop on Windows (data is kept).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" -Stop
pause
