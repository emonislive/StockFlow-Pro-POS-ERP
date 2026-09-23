@echo off
title StockFlow Pro - Next.js Frontend Server (Port 3000)
cd /d "%~dp0frontend"
echo [StockFlow Pro] Starting Next.js Dev Server on http://localhost:3000...
cmd /c "npm run dev"
pause
