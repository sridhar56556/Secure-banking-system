@echo off
echo ========================================
echo  NeoBank - Fix and Run
echo ========================================
echo.
echo Deleting old lock file...
del /f /q package-lock.json 2>nul
echo.
echo Deleting node_modules (this may take a minute)...
rmdir /s /q node_modules 2>nul
echo.
echo Installing fresh dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed. Please check your internet connection.
    pause
    exit /b 1
)
echo.
echo ========================================
echo  Starting NeoBank dev server...
echo  It will open automatically in your browser!
echo ========================================
echo.
start node server.js
call npm run dev
pause
