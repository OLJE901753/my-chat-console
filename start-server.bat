@echo off
cd /d "%~dp0server"
echo Starting Farm Management Server...
node src/index.js
pause
