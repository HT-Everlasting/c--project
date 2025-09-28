# 智能酒店管理系统

一个基于前后端分离架构的智能酒店管理系统，支持客人自助登记、退房和智能锁管理。

## 系统特性

### 🏨 核心功能
- **自助登记**：客人可自助完成入住登记，无需前台人员
- **自助退房**：客人可自助完成退房手续
- **智能锁管理**：支持设置和验证房间智能锁密码
- **房间状态查询**：实时查看所有房间状态
- **预订信息查询**：根据身份证号查询预订记录

### 🚀 技术优势
- **前后端分离**：前端Vue3 + Element Plus，后端Node.js + Express
- **实时通信**：WebSocket支持实时状态更新
- **数据安全**：完整的日志记录和操作审计
- **响应式设计**：支持移动端和桌面端
- **自动化流程**：减少人工干预，提高效率

## 项目结构

```
cursor_project/
├── back_end/                 # 后端服务
│   ├── src/
│   │   ├── app.js           # 主应用入口，注册所有路由和Socket.io
│   │   ├── config/
│   │   │   └── database.js  # 数据库连接池配置
│   │   ├── routes/          # 路由文件
│   │   │   ├── auth.js      # 系统状态与认证
│   │   │   ├── rooms.js     # 房间管理
│   │   │   ├── guests.js    # 客人管理
│   │   │   ├── bookings.js  # 预订与入住/退房
│   │   │   ├── smartLock.js # 智能锁管理
│   │   │   └── statistics.js# 统计分析
│   │   └── utils/
│   │       └── logger.js    # 日志工具，支持写入数据库和文件
│   ├── package.json         # 后端依赖
│   ├── env.example          # 环境变量示例
│   ├── start.js             # 启动脚本
│   ├── setup_database.sh    # 一键初始化数据库脚本
│   └── test_db.js           # 数据库连接测试
├── front_end/                # 前端应用
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   │   ├── CheckIn.vue      # 自助登记
│   │   │   ├── CheckOut.vue     # 自助退房
│   │   │   ├── RoomStatus.vue   # 房间状态
│   │   │   ├── BookingQuery.vue # 预订查询
│   │   │   ├── SmartLock.vue    # 智能锁管理
│   │   │   ├── BookingManagement.vue # 预订管理
│   │   │   └── Statistics.vue   # 数据统计
│   │   ├── layout/          # 公共布局
│   │   ├── router/          # 路由配置
│   │   │   └── index.ts     # 路由定义
│   │   ├── App.vue          # 主应用
│   │   └── main.ts          # 入口文件
│   ├── package.json         # 前端依赖
│   ├── vite.config.ts       # Vite配置
│   └── index.html           # HTML模板
├── init_database.sql        # 数据库初始化SQL
├── start_linux.sh           # Linux一键启动脚本
├── start.bat                # Windows一键启动脚本
├── README.md                # 项目说明
└── QUICK_START.md           # 快速上手指南
```

## 快速开始

### 环境要求
- Node.js 16+
- MySQL 8.0+
- npm 或 yarn

### 1. 数据库准备

```sql
-- 创建数据库
CREATE DATABASE smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'hotel_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_hotel.* TO 'hotel_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 后端启动

```bash
# 进入后端目录
cd back_end

# 安装依赖
npm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置数据库连接信息

# 启动服务
npm run dev
```

后端服务将在 `http://localhost:5000` 启动

### 3. 前端启动

```bash
# 进入前端目录
cd front_end

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

## API 接口

### 房间管理
- `GET /api/rooms` - 获取所有房间
- `GET /api/rooms/available` - 获取可用房间
- `GET /api/rooms/:roomNumber` - 获取房间信息
- `PATCH /api/rooms/:roomId/status` - 更新房间状态

### 客人管理
- `POST /api/guests/register` - 客人自助登记
- `GET /api/guests/:guestId` - 获取客人信息
- `GET /api/guests/search/id-card/:idCard` - 根据身份证查询

### 预订管理
- `POST /api/bookings/checkout` - 自助退房
- `GET /api/bookings` - 获取所有预订
- `GET /api/bookings/current` - 获取当前入住
- `GET /api/bookings/guest/:idCard` - 查询客人预订

### 智能锁管理
- `POST /api/smart-lock/verify` - 验证密码
- `GET /api/smart-lock/status/:roomNumber` - 查询锁状态
- `GET /api/smart-lock/status` - 获取所有锁状态

## 使用流程

### 客人入住流程
1. 客人访问自助登记页面
2. 选择可用房间和入住日期
3. 设置6位数字智能锁密码
4. 填写个人信息（姓名、身份证、手机等）
5. 系统自动创建预订和入住记录
6. 显示房间号和智能锁密码

### 客人退房流程
1. 客人访问自助退房页面
2. 输入身份证号、房间号和智能锁密码
3. 系统验证信息并完成退房
4. 自动重置智能锁密码
5. 更新房间状态为空闲

### 智能锁使用
- 客人入住时设置6位数字密码
- 退房时验证密码后自动重置
- 支持实时状态查询和操作记录

## 数据库设计

### 主要表结构
- `rooms` - 房间信息表
- `guests` - 客人信息表
- `bookings` - 预订记录表
- `check_ins` - 入住记录表
- `system_logs` - 系统日志表
- `lock_operations` - 智能锁操作记录表

## 部署说明

### 生产环境部署
1. 配置生产环境变量
2. 构建前端应用：`npm run build`
3. 使用PM2管理后端进程
4. 配置Nginx反向代理
5. 设置SSL证书

### Docker部署
```bash
# 构建镜像
docker build -t smart-hotel-backend ./back_end
docker build -t smart-hotel-frontend ./front_end

# 运行容器
docker run -d -p 5000:5000 smart-hotel-backend
docker run -d -p 3000:3000 smart-hotel-frontend
```

## 开发说明

### 后端开发
- 使用Express框架
- MySQL数据库连接池
- Winston日志记录
- Socket.io实时通信
- 完整的错误处理

### 前端开发
- Vue 3 + TypeScript
- Element Plus UI组件
- Vite构建工具
- 响应式设计
- 表单验证

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。 