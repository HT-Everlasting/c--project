const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// 验证智能锁密码
router.post('/verify', async (req, res) => {
  try {
    const { roomNumber, lockCode } = req.body;

    if (!roomNumber || !lockCode) {
      return res.status(400).json({
        success: false,
        message: '请提供房间号和智能锁密码'
      });
    }

    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, room_number, status, smart_lock_code FROM rooms WHERE room_number = ?
    `, [roomNumber]);
    
    connection.release();
    
    if (rows.length === 0) {
      await logger.logLockOperation(null, '验证密码', '失败', req.ip);
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const room = rows[0];
    
    if (room.status !== '已入住') {
      await logger.logLockOperation(room.id, '验证密码', '失败', req.ip);
      return res.status(400).json({
        success: false,
        message: '房间未入住'
      });
    }

    if (room.smart_lock_code !== lockCode) {
      await logger.logLockOperation(room.id, '验证密码', '失败', req.ip);
      return res.status(401).json({
        success: false,
        message: '智能锁密码错误'
      });
    }

    await logger.logLockOperation(room.id, '验证密码', '成功', req.ip);
    
    res.json({
      success: true,
      data: {
        roomNumber: room.room_number,
        status: room.status
      },
      message: '密码验证成功'
    });
  } catch (error) {
    logger.error('验证智能锁密码失败:', error.message);
    res.status(500).json({
      success: false,
      message: '验证失败',
      error: error.message
    });
  }
});

// 获取房间智能锁状态
router.get('/status/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, room_number, status, smart_lock_code, updated_at
      FROM rooms WHERE room_number = ?
    `, [roomNumber]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const room = rows[0];
    
    res.json({
      success: true,
      data: {
        roomNumber: room.room_number,
        status: room.status,
        hasLockCode: !!room.smart_lock_code,
        lastUpdated: room.updated_at
      },
      message: '智能锁状态获取成功'
    });
  } catch (error) {
    logger.error('获取智能锁状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取智能锁状态失败',
      error: error.message
    });
  }
});

// 重置智能锁密码
router.post('/reset/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, room_number, status FROM rooms WHERE room_number = ?
    `, [roomNumber]);
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const room = rows[0];
    
    if (room.status !== '已入住') {
      connection.release();
      return res.status(400).json({
        success: false,
        message: '只能重置已入住房间的智能锁密码'
      });
    }

    await connection.execute(`
      UPDATE rooms 
      SET smart_lock_code = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [room.id]);
    
    connection.release();
    
    await logger.logLockOperation(room.id, '重置密码', '成功', req.ip);
    
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

// 获取智能锁操作记录
router.get('/operations/:roomNumber', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const connection = await pool.getConnection();
    
    // 先获取房间ID
    const [roomRows] = await connection.execute(`
      SELECT id FROM rooms WHERE room_number = ?
    `, [roomNumber]);
    
    if (roomRows.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const [rows] = await connection.execute(`
      SELECT operation_type, operation_result, ip_address, created_at
      FROM lock_operations
      WHERE room_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [roomRows[0].id]);
    
    connection.release();
    
    res.json({
      success: true,
      data: rows,
      message: '智能锁操作记录获取成功'
    });
  } catch (error) {
    logger.error('获取智能锁操作记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取智能锁操作记录失败',
      error: error.message
    });
  }
});

// 批量获取所有房间的智能锁状态
router.get('/status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT room_number, status, smart_lock_code, updated_at
      FROM rooms
      ORDER BY room_number
    `);
    
    connection.release();
    
    const lockStatus = rows.map(room => ({
      roomNumber: room.room_number,
      status: room.status,
      hasLockCode: !!room.smart_lock_code,
      lastUpdated: room.updated_at
    }));
    
    res.json({
      success: true,
      data: lockStatus,
      message: '所有房间智能锁状态获取成功'
    });
  } catch (error) {
    logger.error('获取所有房间智能锁状态失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取智能锁状态失败',
      error: error.message
    });
  }
});

module.exports = router; 