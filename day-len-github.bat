@echo off
chcp 65001 > nul
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo ===================================================
echo   Đang đẩy mã nguồn lên GitHub: LeQuangKhai99/TuVi
echo ===================================================
echo.
git push -u origin main
echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo   ĐẨY LÊN GITHUB THÀNH CÔNG!
) else (
    echo   Có lỗi xảy ra trong quá trình xác thực GitHub.
)
echo ===================================================
pause
