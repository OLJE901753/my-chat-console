@echo off
title Farm Management Server
echo.
echo ========================================
echo   Farm Management Server
echo ========================================
echo.
echo Starting server...
cd /d "%~dp0server"
echo Current directory: %CD%
echo.
echo Starting Node.js server...
echo Press Ctrl+C to stop the server
echo.
node src/index.js
echo.
echo Server stopped.
pause
