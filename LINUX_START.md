# Linux 启动指南

## 快速启动

### 方法一：使用启动脚本（推荐）

```bash
# 给脚本执行权限
chmod +x start_linux.sh

# 运行启动脚本
./start_linux.sh
```

### 方法二：手动启动

#### 1. 启动后端
```bash
cd back_end
npm install  # 首次运行需要安装依赖
npm run dev
```

#### 2. 启动前端（新终端）
```bash
cd front_end
npm install  # 首次运行需要安装依赖
npm run dev
```

## 环境要求

- Node.js 16+ 
- MySQL 5.7+
- npm 或 yarn

## 数据库设置（重要！）

### 1. 安装MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
```

### 2. 启动MySQL服务

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3. 设置MySQL密码

```bash
# 安全设置（推荐）
sudo mysql_secure_installation

# 或者直接设置密码
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
exit;
```

### 4. 创建数据库

```bash
mysql -u root -p
CREATE DATABASE smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 5. 配置环境变量

```bash
cd back_end
cp env.example .env
```

编辑 `.env` 文件：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password  # 替换为你的MySQL密码
DB_NAME=smart_hotel
DB_PORT=3306
```

### 6. 测试数据库连接

```bash
cd back_end
node test_db.js
```

## 配置说明

### 1. 数据库配置

复制环境配置文件：
```bash
cd back_end
cp env.example .env
```

编辑 `.env` 文件，修改数据库连接信息：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_hotel
DB_PORT=3306
```

### 2. 创建数据库

```sql
CREATE DATABASE smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 访问地址

- 前端页面：http://localhost:3000
- 后端接口：http://localhost:5000
- 健康检查：http://localhost:5000/health

## 常见问题

### 1. 数据库连接失败

**错误信息：** `ER_ACCESS_DENIED_ERROR`
```bash
# 解决方案：
sudo mysql_secure_installation
# 或者
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
exit;
```

**错误信息：** `ECONNREFUSED`
```bash
# 解决方案：
sudo systemctl start mysql
sudo systemctl status mysql
```

**错误信息：** `ER_BAD_DB_ERROR`
```bash
# 解决方案：
mysql -u root -p -e "CREATE DATABASE smart_hotel;"
```

### 2. 端口被占用
```bash
# 查看端口占用
lsof -i :5000
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 3. 权限问题
```bash
# 给脚本执行权限
chmod +x start_linux.sh

# 如果遇到权限问题，使用sudo
sudo chmod +x start_linux.sh
```

### 4. 依赖安装失败
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 5. 数据库连接失败
- 检查MySQL服务是否启动：`sudo systemctl status mysql`
- 检查数据库配置是否正确
- 检查防火墙设置

## 日志查看

```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志
tail -f logs/frontend.log
```

## 停止服务

```bash
# 使用启动脚本显示的PID
kill <BACKEND_PID> <FRONTEND_PID>

# 或者查找进程
ps aux | grep node
kill -9 <PID>
```

## 一键设置脚本

如果遇到数据库配置问题，可以使用设置脚本：

```bash
cd back_end
chmod +x setup_database.sh
./setup_database.sh
```

然后测试数据库连接：
```bash
node test_db.js
``` 