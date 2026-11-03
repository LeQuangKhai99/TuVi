@echo off
chcp 65001 > nul
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
echo ===================================================
echo   Đang đẩy mã nguồn lên GitHub qua SSH
echo   Kho lưu trữ: git@github.com:LeQuangKhai99/TuVi.git
echo ===================================================
echo.
git push -u origin main
echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo   ĐẨY LÊN GITHUB THÀNH CÔNG!
) else (
    echo   Lưu ý: Nếu bị báo lỗi Permission denied (publickey),
    echo   bạn hãy đảm bảo đã dán Public Key vào GitHub Settings.
)
echo ===================================================
pause
