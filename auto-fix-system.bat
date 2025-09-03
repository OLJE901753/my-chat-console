@echo off
echo ============================================
echo    FARM MANAGEMENT SYSTEM AUTO-FIXER
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "server" (
    echo ERROR: server directory not found!
    echo Please run this script from your project root directory
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please ensure you're in the project root directory
    pause
    exit /b 1
)

echo [1/8] Killing existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1
echo Done.

echo.
echo [2/8] Checking and fixing backend...
cd server
if exist "package.json" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo WARNING: Backend npm install failed
    ) else (
        echo Backend dependencies installed successfully
    )
) else (
    echo ERROR: server/package.json not found!
)

REM Check if main server file exists
if exist "src\index.js" (
    echo Found server file: src\index.js
) else if exist "index.js" (
    echo Found server file: index.js
) else if exist "server.js" (
    echo Found server file: server.js
) else if exist "app.js" (
    echo Found server file: app.js
) else (
    echo ERROR: No server entry point found!
    echo Looking for: src\index.js, index.js, server.js, or app.js
)

cd ..

echo.
echo [3/8] Checking and fixing frontend...
if exist "package.json" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo WARNING: Frontend npm install failed
    ) else (
        echo Frontend dependencies installed successfully
    )
) else (
    echo ERROR: Frontend package.json not found!
)

echo.
echo [4/8] Checking for port conflicts...
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo WARNING: Port 3001 is in use
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo Killing process %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr :8080 >nul
if not errorlevel 1 (
    echo WARNING: Port 8080 is in use
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
        echo Killing process %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo.
echo [5/8] Creating startup scripts...

REM Create backend startup script
echo @echo off > start-backend.bat
echo echo Starting backend server... >> start-backend.bat
echo cd server >> start-backend.bat
if exist "server\src\index.js" (
    echo node src/index.js >> start-backend.bat
) else if exist "server\index.js" (
    echo node index.js >> start-backend.bat
) else if exist "server\server.js" (
    echo node server.js >> start-backend.bat
) else (
    echo node app.js >> start-backend.bat
)

REM Create frontend startup script
echo @echo off > start-frontend.bat
echo echo Starting frontend server... >> start-frontend.bat
echo npm run dev >> start-frontend.bat

REM Create combined startup script
echo @echo off > start-both-fixed.bat
echo echo ============================================ >> start-both-fixed.bat
echo echo    STARTING FARM MANAGEMENT SYSTEM >> start-both-fixed.bat
echo echo ============================================ >> start-both-fixed.bat
echo echo. >> start-both-fixed.bat
echo echo [1/2] Starting Backend Server... >> start-both-fixed.bat
echo start "Farm Backend" cmd /k "cd server && node src/index.js" >> start-both-fixed.bat
echo timeout /t 3 /nobreak >nul >> start-both-fixed.bat
echo echo. >> start-both-fixed.bat
echo echo [2/2] Starting Frontend Server... >> start-both-fixed.bat
echo start "Farm Frontend" cmd /k "npm run dev" >> start-both-fixed.bat
echo echo. >> start-both-fixed.bat
echo echo System should be starting... >> start-both-fixed.bat
echo echo Backend: http://localhost:3001 >> start-both-fixed.bat
echo echo Frontend: http://localhost:8080 >> start-both-fixed.bat
echo echo. >> start-both-fixed.bat
echo pause >> start-both-fixed.bat

echo.
echo [6/8] Creating diagnostic script...
echo @echo off > test-system-health.bat
echo echo Testing system health... >> test-system-health.bat
echo echo. >> test-system-health.bat
echo echo [Testing Backend] >> test-system-health.bat
echo curl -s http://localhost:3001/health ^>nul 2^>^&1 >> test-system-health.bat
echo if errorlevel 1 ( >> test-system-health.bat
echo     echo ❌ Backend not responding >> test-system-health.bat
echo ^) else ( >> test-system-health.bat
echo     echo ✅ Backend is running >> test-system-health.bat
echo ^) >> test-system-health.bat
echo echo. >> test-system-health.bat
echo echo [Testing Frontend] >> test-system-health.bat
echo curl -s http://localhost:8080/ ^>nul 2^>^&1 >> test-system-health.bat
echo if errorlevel 1 ( >> test-system-health.bat
echo     echo ❌ Frontend not responding >> test-system-health.bat
echo ^) else ( >> test-system-health.bat
echo     echo ✅ Frontend is running >> test-system-health.bat
echo ^) >> test-system-health.bat
echo echo. >> test-system-health.bat
echo echo [Testing SSE Endpoint] >> test-system-health.bat
echo curl -s http://localhost:3001/api/events ^>nul 2^>^&1 >> test-system-health.bat
echo if errorlevel 1 ( >> test-system-health.bat
echo     echo ❌ SSE endpoint not responding >> test-system-health.bat
echo ^) else ( >> test-system-health.bat
echo     echo ✅ SSE endpoint is working >> test-system-health.bat
echo ^) >> test-system-health.bat
echo echo. >> test-system-health.bat
echo pause >> test-system-health.bat

echo.
echo [7/8] Clearing caches...
if exist ".vite" rmdir /s /q ".vite" >nul 2>&1
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" >nul 2>&1
if exist "server\node_modules\.cache" rmdir /s /q "server\node_modules\.cache" >nul 2>&1
echo Cache cleared.

echo.
echo [8/8] Final system check...
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found! Please install npm
    pause
    exit /b 1
) else (
    echo ✅ npm is installed
)

echo.
echo ============================================
echo    AUTO-FIX COMPLETE!
echo ============================================
echo.
echo Created scripts:
echo - start-backend.bat     (Start backend only)
echo - start-frontend.bat    (Start frontend only)
echo - start-both-fixed.bat  (Start both servers)
echo - test-system-health.bat (Test system health)
echo.
echo To start the system, run: start-both-fixed.bat
echo To test the system, run: test-system-health.bat
echo.
echo Press any key to exit...
pause >nul
