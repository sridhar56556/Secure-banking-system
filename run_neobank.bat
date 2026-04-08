@echo off
echo ========================================================
echo   NeoBank Simulation | Launching Secure Server
echo ========================================================
echo.
echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed.
)
echo.
echo [2/3] Starting Email Backend Server...
start node server.js

echo [3/3] Starting Vite Dev Server...
echo.
echo PREPARING: http://localhost:5173
echo.
call npm run dev
pause
