#!/bin/bash

echo "========================================"
echo "智能酒店管理系统启动脚本 (Linux/macOS)"
echo "========================================"
echo

# 检查Node.js环境
if ! command -v node &> /dev/null
then
    echo "❌ 错误: 未检测到Node.js，请先安装Node.js"
    echo "建议使用nvm进行安装: https://github.com/nvm-sh/nvm"
    exit 1
fi
echo "✅ Node.js环境检查通过"
echo

# 检查后台依赖
echo "▶️ 检查后端依赖..."
cd back_end || exit
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装后端依赖..."
  npm install
fi
cd ..

# 检查前台依赖
echo "▶️ 检查前端依赖..."
cd front_end || exit
if [ ! -d "node_modules" ]; then
  echo "📦 正在安装前端依赖..."
  npm install
fi
cd ..

# 启动后端服务 (使用gnome-terminal)
echo "🚀 启动后端服务..."
gnome-terminal --title="后端服务" -- bash -c "cd back_end && npm run dev; exec bash"

# 启动前端服务 (使用gnome-terminal)
echo "🚀 启动前端服务..."
gnome-terminal --title="前端服务" -- bash -c "cd front_end && npm run dev; exec bash"

echo
echo "========================================"
echo "🎉 服务启动完成！"
echo "========================================"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo "健康检查: http://localhost:5000/health"
echo
echo "新的终端窗口已经打开，用于显示服务日志。" 