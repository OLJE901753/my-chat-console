@echo off
echo ========================================
echo  Farm Management System Test
echo ========================================
echo.

echo Testing backend server...
curl -s http://localhost:3001/health
echo.
echo.

echo Testing frontend server...
curl -s http://localhost:8080/ | findstr "html"
echo.

echo If you see JSON response above, backend is working.
echo If you see HTML content above, frontend is working.
echo.
pause
