@echo off
title InfiniteIQ Server
cd /d "C:\Users\WRyan\Desktop\PERSONAL\DEV\Projetos\infiniteiq\backend"
echo.
echo  ================================
echo   InfiniteIQ Backend - porta 8000
echo  ================================
echo.
python -m uvicorn main:app --reload --port 8000
pause
