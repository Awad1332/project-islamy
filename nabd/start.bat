@echo off
cd /d "%~dp0"
echo Nabd: http://localhost:8080  (Ctrl+C to stop)
start "" http://localhost:8080
where python >nul 2>nul && (python -m http.server 8080) || (npx --yes serve -l 8080 .)
