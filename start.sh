#!/bin/bash

echo "========================================"
echo "智能酒店管理系统启动脚本"
echo "========================================"
echo

# 检查Node.js环境
echo "正在检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误：未检测到Node.js，请先安装Node.js"
    echo "下载地址：https://nodejs.org/"
    exit 1
fi

echo "Node.js环境检查通过"
echo

# 启动后端服务
echo "正在启动后端服务..."
cd back_end

if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi

echo "启动后端服务..."
npm run dev &
BACKEND_PID=$!

echo "等待后端服务启动..."
sleep 5

# 启动前端服务
echo
echo "正在启动前端服务..."
cd ../front_end

if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
fi

echo "启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo "服务启动完成！"
echo "========================================"
echo "后端服务：http://localhost:5000"
echo "前端应用：http://localhost:3000"
echo
echo "请确保MySQL数据库已启动并配置正确"
echo "配置文件：back_end/.env"
echo
echo "按Ctrl+C停止所有服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 