@echo off
echo ========================================
echo  NeoBank - FORCE RESTART & CLEANUP
echo ========================================
echo.

echo [1/4] Killing any old server processes...
taskkill /F /IM node.exe /T 2>nul
echo Done.

echo.
echo [2/4] Clearing Vite cache...
rmdir /s /q node_modules\.vite_new_cache 2>nul
rmdir /s /q node_modules\.vite_fresh 2>nul
echo Done.

echo.
echo [3/4] Starting Email Backend...
start "NeoBank Backend" node server.js

echo.
echo [4/4] Starting Frontend...
echo PREPARING: http://localhost:5173
echo.
call npm run dev

pause
