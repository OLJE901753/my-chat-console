@echo off
title Farm Server
echo Starting server...
cd /d "%~dp0server"
node src/index.js
pause
