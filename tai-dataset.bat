@echo off
chcp 65001 > nul
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%PATH%"
echo ========================================================
echo   TẢI DỮ LIỆU TỬ VI 674.976 LÁ SỐ (1950 - 2026)
echo   Nguồn: Dataset v4.0 Nghê Hải Hạ (Ouranic / Tian Ji)
echo   Tổng dung lượng nén: ~161 MB
echo ========================================================
echo.
echo [1] Tải toàn bộ 77 năm (1950 - 2026) để dùng offline 100%%
echo [2] Tải riêng năm sinh cụ thể
echo [3] Thoát
echo.
set /p choice="Nhập lựa chọn (1/2/3): "

if "%choice%"=="1" (
    echo Đang tải toàn bộ dữ liệu 77 năm...
    python scripts/lookup-dataset.py --download-all
) else if "%choice%"=="2" (
    set /p y="Nhập năm cần tải (ví dụ 1995): "
    python scripts/lookup-dataset.py --download-year %y%
) else (
    exit /b
)
echo.
echo ========================================================
echo   HOÀN TẤT!
echo ========================================================
pause
