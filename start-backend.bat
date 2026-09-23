@echo off
title StockFlow Pro - Backend API Server (Port 8000)
cd /d "%~dp0backend"
echo [StockFlow Pro] Starting Laravel API Server on http://localhost:8000...
"C:\laragon\bin\php\php-8.5.10-Win32-vs17-x64\php.exe" artisan serve --port=8000
pause
