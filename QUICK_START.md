# 智能酒店管理系统 - 快速启动指南

## 🚀 快速启动步骤

### 1. 环境准备

确保您的系统已安装：
- Node.js 16+
- MySQL 8.0+
- npm 或 yarn

### 2. 数据库配置

```bash
# 启动MySQL服务
sudo systemctl start mysql

# 创建数据库
mysql -u root -p -e "CREATE DATABASE smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 或者运行初始化脚本
mysql -u root -p < init_database.sql
```

### 3. 配置环境变量

```bash
# 进入后端目录
cd back_end

# 复制环境变量文件
cp env.example .env

# 编辑配置文件
nano .env
```

在 `.env` 文件中配置您的数据库信息：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_hotel
DB_PORT=3306
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

### 4. 启动后端服务

```bash
# 安装依赖
npm install

# 启动服务
npm run dev
```

如果遇到logger错误，请确保：
1. 已安装所有依赖：`npm install`
2. 环境变量配置正确
3. 数据库连接正常

### 5. 启动前端服务

打开新的终端窗口：

```bash
# 进入前端目录
cd front_end

# 安装依赖
npm install

# 启动服务
npm run dev
```

### 6. 访问系统

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **健康检查**: http://localhost:5000/health

## 🔧 故障排除

### 常见问题

1. **logger.info is not a function**
   - 确保已安装所有依赖：`npm install`
   - 检查 `node_modules` 目录是否存在

2. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息
   - 确保数据库和用户已创建

3. **端口被占用**
   - 检查端口3000和5000是否被占用
   - 使用 `lsof -i :3000` 查看端口占用情况

### 调试命令

```bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version

# 检查MySQL状态
sudo systemctl status mysql

# 检查端口占用
netstat -tlnp | grep -E ':(3000|5000)'

# 查看后端日志
cd back_end
tail -f logs/combined.log
```

## 📱 使用说明

### 客人入住流程
1. 访问 http://localhost:3000
2. 选择"自助登记"
3. 填写个人信息和房间信息
4. 设置智能锁密码
5. 完成登记

### 客人退房流程
1. 访问 http://localhost:3000/checkout
2. 输入身份证号、房间号和智能锁密码
3. 完成退房

### 系统功能
- 自助登记/退房
- 房间状态查询
- 预订信息查询
- 智能锁管理

## 🛠️ 开发模式

```bash
# 后端开发模式（自动重启）
cd back_end
npm run dev

# 前端开发模式（热重载）
cd front_end
npm run dev
```

## 📦 生产部署

```bash
# 构建前端
cd front_end
npm run build

# 启动后端生产模式
cd back_end
NODE_ENV=production npm start
```

## 📞 技术支持

如遇到问题，请检查：
1. 环境变量配置
2. 数据库连接
3. 依赖安装
4. 端口占用

祝您使用愉快！🎉 