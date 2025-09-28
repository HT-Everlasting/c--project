const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'smart-hotel-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 所有日志文件
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 记录系统日志到数据库
async function logToDatabase(action, description, userType = 'system', ipAddress = null) {
  try {
    const { pool } = require('../config/database');
    const connection = await pool.getConnection();
    
    await connection.execute(`
      INSERT INTO system_logs (action, description, user_type, ip_address) 
      VALUES (?, ?, ?, ?)
    `, [action, description, userType, ipAddress]);
    
    connection.release();
  } catch (error) {
    logger.error('记录数据库日志失败:', error.message);
  }
}

// 记录智能锁操作
async function logLockOperation(roomId, operationType, operationResult, ipAddress = null) {
  try {
    const { pool } = require('../config/database');
    const connection = await pool.getConnection();
    
    await connection.execute(`
      INSERT INTO lock_operations (room_id, operation_type, operation_result, ip_address) 
      VALUES (?, ?, ?, ?)
    `, [roomId, operationType, operationResult, ipAddress]);
    
    connection.release();
  } catch (error) {
    logger.error('记录智能锁操作失败:', error.message);
  }
}

// 正确导出logger对象和其他函数
module.exports = {
  info: logger.info.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  debug: logger.debug.bind(logger),
  logToDatabase,
  logLockOperation
}; 