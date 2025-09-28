-- 智能酒店管理系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS smart_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_hotel;

-- 创建房间表
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
);

-- 创建客人表
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
);

-- 创建预订表
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
);

-- 创建入住记录表
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
);

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  user_type ENUM('guest', 'admin', 'system') NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建智能锁操作记录表
CREATE TABLE IF NOT EXISTS lock_operations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  operation_type ENUM('设置密码', '验证密码', '重置密码') NOT NULL,
  operation_result ENUM('成功', '失败') NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 插入初始房间数据
INSERT INTO rooms (room_number, room_type, floor, price) VALUES
-- 标准间 (1-20)
('001', '标准间', 1, 299.00),
('002', '标准间', 1, 299.00),
('003', '标准间', 1, 299.00),
('004', '标准间', 1, 299.00),
('005', '标准间', 1, 299.00),
('006', '标准间', 1, 299.00),
('007', '标准间', 1, 299.00),
('008', '标准间', 1, 299.00),
('009', '标准间', 1, 299.00),
('010', '标准间', 1, 299.00),
('011', '标准间', 2, 299.00),
('012', '标准间', 2, 299.00),
('013', '标准间', 2, 299.00),
('014', '标准间', 2, 299.00),
('015', '标准间', 2, 299.00),
('016', '标准间', 2, 299.00),
('017', '标准间', 2, 299.00),
('018', '标准间', 2, 299.00),
('019', '标准间', 2, 299.00),
('020', '标准间', 2, 299.00),

-- 豪华间 (21-35)
('021', '豪华间', 2, 499.00),
('022', '豪华间', 2, 499.00),
('023', '豪华间', 2, 499.00),
('024', '豪华间', 2, 499.00),
('025', '豪华间', 2, 499.00),
('026', '豪华间', 3, 499.00),
('027', '豪华间', 3, 499.00),
('028', '豪华间', 3, 499.00),
('029', '豪华间', 3, 499.00),
('030', '豪华间', 3, 499.00),
('031', '豪华间', 3, 499.00),
('032', '豪华间', 3, 499.00),
('033', '豪华间', 3, 499.00),
('034', '豪华间', 3, 499.00),
('035', '豪华间', 3, 499.00),

-- 套房 (36-40)
('036', '套房', 3, 899.00),
('037', '套房', 3, 899.00),
('038', '套房', 3, 899.00),
('039', '套房', 3, 899.00),
('040', '套房', 3, 899.00),

-- 总统套房
('401', '总统套房', 4, 1999.00)
ON DUPLICATE KEY UPDATE room_number = room_number;

-- 创建索引
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_guests_id_card ON guests(id_card);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_check_ins_room_id ON check_ins(room_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_lock_operations_room_id ON lock_operations(room_id);

-- 显示创建结果
SELECT '数据库初始化完成！' as message;
SELECT COUNT(*) as room_count FROM rooms;
SELECT '智能酒店管理系统数据库已准备就绪' as status; 