const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_hotel',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 创建房间表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_number VARCHAR(10) UNIQUE NOT NULL,
        room_type ENUM('标准间', '豪华间', '套房', '总统套房') NOT NULL,
        floor INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status ENUM('空闲', '已预订', '已入住', '维护中') DEFAULT '空闲',
        smart_lock_code VARCHAR(6) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建客人表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        id_card VARCHAR(18) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        gender ENUM('男', '女') NOT NULL,
        birth_date DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建预订表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        guest_id INT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('已预订', '已入住', '已退房', '已取消') DEFAULT '已预订',
        payment_status ENUM('未支付', '已支付', '部分支付') DEFAULT '未支付',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (guest_id) REFERENCES guests(id)
      )
    `);

    // 创建入住记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS check_ins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_id INT NOT NULL,
        room_id INT NOT NULL,
        guest_id INT NOT NULL,
        check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out_time TIMESTAMP NULL,
        smart_lock_code VARCHAR(6) NOT NULL,
        status ENUM('入住中', '已退房') DEFAULT '入住中',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (guest_id) REFERENCES guests(id)
      )
    `);

    // 创建系统日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        user_type ENUM('guest', 'admin', 'system') NOT NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建智能锁操作记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lock_operations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        operation_type ENUM('设置密码', '验证密码', '重置密码') NOT NULL,
        operation_result ENUM('成功', '失败') NOT NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )
    `);

    connection.release();
    logger.info('数据库表初始化完成');
    
    // 插入初始房间数据
    await insertInitialRooms();
    
  } catch (error) {
    logger.error('数据库初始化失败:', error.message);
    throw error;
  }
}

// 插入初始房间数据
async function insertInitialRooms() {
  try {
    const connection = await pool.getConnection();
    
    // 检查是否已有房间数据
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM rooms');
    
    if (rows[0].count === 0) {
      // 插入标准间
      for (let i = 1; i <= 20; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type, floor, price) 
          VALUES (?, '标准间', ?, 299.00)
        `, [`${String(i).padStart(3, '0')}`, Math.ceil(i / 10)]);
      }
      
      // 插入豪华间
      for (let i = 21; i <= 35; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type, floor, price) 
          VALUES (?, '豪华间', ?, 499.00)
        `, [`${String(i).padStart(3, '0')}`, Math.ceil(i / 10)]);
      }
      
      // 插入套房
      for (let i = 36; i <= 40; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type, floor, price) 
          VALUES (?, '套房', ?, 899.00)
        `, [`${String(i).padStart(3, '0')}`, Math.ceil(i / 10)]);
      }
      
      // 插入总统套房
      await connection.execute(`
        INSERT INTO rooms (room_number, room_type, floor, price) 
        VALUES ('401', '总统套房', 4, 1999.00)
      `);
      
      logger.info('初始房间数据插入完成');
    }
    
    connection.release();
  } catch (error) {
    logger.error('插入初始房间数据失败:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabase
}; 