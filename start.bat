@echo off
echo ========================================
echo 智能酒店管理系统启动脚本
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js环境检查通过
echo.

echo 正在启动后端服务...
cd back_end
if not exist node_modules (
    echo 正在安装后端依赖...
    npm install
)
echo 启动后端服务...
start "后端服务" cmd /k "npm run dev"

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo.
echo 正在启动前端服务...
cd ..\front_end
if not exist node_modules (
    echo 正在安装前端依赖...
    npm install
)
echo 启动前端服务...
start "前端服务" cmd /k "npm run dev"

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo 后端服务：http://localhost:5000
echo 前端应用：http://localhost:3000
echo.
echo 请确保MySQL数据库已启动并配置正确
echo 配置文件：back_end\.env
echo.
echo 按任意键退出...
pause >nul 