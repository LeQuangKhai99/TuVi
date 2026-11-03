@echo off
chcp 65001 > nul
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo ===================================================
echo   Đang khởi động Tử Vi Đẩu Số (Ziwei Doushu - Prod)
echo   Địa chỉ truy cập: http://localhost:3000
echo ===================================================
start http://localhost:3000
npm run start
pause
