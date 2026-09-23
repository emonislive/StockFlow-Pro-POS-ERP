@echo off
title StockFlow Pro - Starter
echo ========================================================
echo   StockFlow Pro POS and ERP - Launching Services
echo ========================================================
start "" "%~dp0start-backend.bat"
timeout /t 2 /nobreak >nul
start "" "%~dp0start-frontend.bat"
echo Services launched!
echo - Backend API:  http://localhost:8000
echo - Frontend App: http://localhost:3000
