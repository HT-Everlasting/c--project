#!/bin/bash

echo "========================================"
echo "智能酒店管理系统数据库设置脚本"
echo "========================================"
echo

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL未安装，请先安装MySQL"
    echo "Ubuntu/Debian: sudo apt install mysql-server"
    echo "CentOS/RHEL: sudo yum install mysql-server"
    exit 1
fi

echo "✅ MySQL已安装"

# 检查MySQL服务状态
if ! sudo systemctl is-active --quiet mysql; then
    echo "⚠️  MySQL服务未启动，正在启动..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

echo "✅ MySQL服务已启动"

# 创建.env文件
echo "📝 创建环境配置文件..."
cat > .env << EOF
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_hotel
DB_PORT=3306

# 服务器配置
PORT=5000
NODE_ENV=development

# 前端URL
FRONTEND_URL=http://localhost:3000

# 日志级别
LOG_LEVEL=info
EOF

echo "✅ 环境配置文件已创建"

# 提示用户设置密码
echo
echo "🔐 请设置MySQL root密码（如果未设置）："
echo "1. 运行: sudo mysql_secure_installation"
echo "2. 或者直接登录MySQL: sudo mysql"
echo "3. 设置密码: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';"
echo

# 创建数据库
echo "🗄️ 创建数据库..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功"
else
    echo "❌ 数据库创建失败，请检查MySQL密码设置"
    echo "请运行以下命令手动创建数据库："
    echo "mysql -u root -p"
    echo "CREATE DATABASE smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "exit"
fi

echo
echo "========================================"
echo "数据库设置完成！"
echo "========================================"
echo
echo "如果设置了MySQL密码，请编辑 .env 文件更新密码："
echo "DB_PASSWORD=your_password"
echo
echo "然后运行: npm run dev"
echo 