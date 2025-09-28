const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// 获取所有房间列表
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT id, room_number, room_type, floor, price, status, smart_lock_code, created_at, updated_at
      FROM rooms 
      ORDER BY room_number
    `);
    connection.release();
    
    await logger.logToDatabase('查询房间列表', '获取所有房间信息', 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '房间列表获取成功'
    });
  } catch (error) {
    logger.error('获取房间列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取房间列表失败',
      error: error.message
    });
  }
});

// 获取可用房间
router.get('/available', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT id, room_number, room_type, floor, price
      FROM rooms 
      WHERE status = '空闲'
      ORDER BY room_number
    `);
    connection.release();
    
    await logger.logToDatabase('查询可用房间', '获取空闲房间列表', 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '可用房间列表获取成功'
    });
  } catch (error) {
    logger.error('获取可用房间失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取可用房间失败',
      error: error.message
    });
  }
});

// 根据房间号获取房间信息
router.get('/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, room_number, room_type, floor, price, status, smart_lock_code, created_at, updated_at
      FROM rooms 
      WHERE room_number = ?
    `, [roomNumber]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }
    
    await logger.logToDatabase('查询房间信息', `查询房间号: ${roomNumber}`, 'system', req.ip);
    
    res.json({
      success: true,
      data: rows[0],
      message: '房间信息获取成功'
    });
  } catch (error) {
    logger.error('获取房间信息失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取房间信息失败',
      error: error.message
    });
  }
});

// 更新房间状态
router.patch('/:roomId/status', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    
    if (!['空闲', '已预订', '已入住', '维护中'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的房间状态'
      });
    }
    
    const connection = await pool.getConnection();
    await connection.execute(`
      UPDATE rooms 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, roomId]);
    
    const [rows] = await connection.execute(`
      SELECT room_number FROM rooms WHERE id = ?
    `, [roomId]);
    
    connection.release();
    
    await logger.logToDatabase('更新房间状态', `房间${rows[0]?.room_number}状态更新为: ${status}`, 'system', req.ip);
    
    res.json({
      success: true,
      message: '房间状态更新成功'
    });
  } catch (error) {
    logger.error('更新房间状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: '更新房间状态失败',
      error: error.message
    });
  }
});

// 设置智能锁密码
router.post('/:roomId/smart-lock', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { lockCode } = req.body;
    
    if (!lockCode || lockCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '智能锁密码必须是6位数字'
      });
    }
    
    const connection = await pool.getConnection();
    await connection.execute(`
      UPDATE rooms 
      SET smart_lock_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [lockCode, roomId]);
    
    const [rows] = await connection.execute(`
      SELECT room_number FROM rooms WHERE id = ?
    `, [roomId]);
    
    connection.release();
    
    await logger.logToDatabase('设置智能锁密码', `房间${rows[0]?.room_number}设置智能锁密码`, 'system', req.ip);
    
    res.json({
      success: true,
      message: '智能锁密码设置成功'
    });
  } catch (error) {
    logger.error('设置智能锁密码失败:', error.message);
    res.status(500).json({
      success: false,
      message: '设置智能锁密码失败',
      error: error.message
    });
  }
});

// 重置智能锁密码
router.delete('/:roomId/smart-lock', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const connection = await pool.getConnection();
    await connection.execute(`
      UPDATE rooms 
      SET smart_lock_code = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [roomId]);
    
    const [rows] = await connection.execute(`
      SELECT room_number FROM rooms WHERE id = ?
    `, [roomId]);
    
    connection.release();
    
    await logger.logToDatabase('重置智能锁密码', `房间${rows[0]?.room_number}重置智能锁密码`, 'system', req.ip);
    
    res.json({
      success: true,
      message: '智能锁密码重置成功'
    });
  } catch (error) {
    logger.error('重置智能锁密码失败:', error.message);
    res.status(500).json({
      success: false,
      message: '重置智能锁密码失败',
      error: error.message
    });
  }
});

module.exports = router; 