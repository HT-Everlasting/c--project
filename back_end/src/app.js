const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const db = require('./config/database');

// 路由导入
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const bookingRoutes = require('./routes/bookings')(io);
const smartLockRoutes = require('./routes/smartLock');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 安全中间件
app.use(helmet());

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use(limiter);

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/smart-lock', smartLockRoutes);
app.use('/api/statistics', statisticsRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '智能酒店管理系统后端运行正常'
  });
});

// WebSocket连接处理
io.on('connection', (socket) => {
  logger.info(`客户端连接: ${socket.id}`);
  
  // 房间状态更新
  socket.on('room_status_update', (data) => {
    io.emit('room_status_changed', data);
  });
  
  // 智能锁状态更新
  socket.on('lock_status_update', (data) => {
    io.emit('lock_status_changed', data);
  });
  
  socket.on('disconnect', () => {
    logger.info(`客户端断开连接: ${socket.id}`);
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`错误: ${err.message}`);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const PORT = process.env.PORT || 5000;

// 启动服务器
server.listen(PORT, () => {
  logger.info(`智能酒店管理系统后端启动成功，端口: ${PORT}`);
  logger.info(`健康检查地址: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, io }; 