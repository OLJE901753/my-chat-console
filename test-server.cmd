@echo off
echo Testing server connection...
echo.
curl -s http://localhost:3001/health
if %errorlevel% equ 0 (
    echo.
    echo Server is running!
) else (
    echo.
    echo Server is not running.
    echo.
    echo To start the server, double-click: start-server.cmd
)
echo.
pause
