const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// 客人自助登记
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      idCard, 
      phone, 
      email, 
      gender, 
      birthDate, 
      address,
      roomId,
      checkInDate,
      checkOutDate,
      lockCode
    } = req.body;

    // 如果birthDate是空字符串，则设为null
    const finalBirthDate = birthDate || null;

    // 格式化入住和退房日期
    const formattedCheckInDate = new Date(checkInDate).toISOString().slice(0, 10);
    const formattedCheckOutDate = new Date(checkOutDate).toISOString().slice(0, 10);

    // 验证必填字段
    if (!name || !idCard || !phone || !gender || !roomId || !checkInDate || !checkOutDate || !lockCode) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 验证身份证号格式
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      return res.status(400).json({
        success: false,
        message: '身份证号格式不正确'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 检查房间是否可用
      const [roomRows] = await connection.execute(`
        SELECT id, room_number, price, status FROM rooms WHERE id = ?
      `, [roomId]);

      if (roomRows.length === 0) {
        throw new Error('房间不存在');
      }

      if (roomRows[0].status !== '空闲') {
        throw new Error('房间不可用');
      }

      // 检查客人是否已存在
      let [guestRows] = await connection.execute(`
        SELECT id FROM guests WHERE id_card = ?
      `, [idCard]);

      let guestId;
      if (guestRows.length === 0) {
        // 创建新客人
        const [result] = await connection.execute(`
          INSERT INTO guests (name, id_card, phone, email, gender, birth_date, address)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, idCard, phone, email, gender, finalBirthDate, address]);
        guestId = result.insertId;
      } else {
        guestId = guestRows[0].id;
        // 更新客人信息
        await connection.execute(`
          UPDATE guests 
          SET name = ?, phone = ?, email = ?, gender = ?, birth_date = ?, address = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, phone, email, gender, finalBirthDate, address, guestId]);
      }

      // 计算总金额
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalAmount = roomRows[0].price * days;

      // 创建预订记录
      const [bookingResult] = await connection.execute(`
        INSERT INTO bookings (room_id, guest_id, check_in_date, check_out_date, total_amount, status, payment_status)
        VALUES (?, ?, ?, ?, ?, '已入住', '已支付')
      `, [roomId, guestId, formattedCheckInDate, formattedCheckOutDate, totalAmount]);

      // 创建入住记录
      await connection.execute(`
        INSERT INTO check_ins (booking_id, room_id, guest_id, smart_lock_code)
        VALUES (?, ?, ?, ?)
      `, [bookingResult.insertId, roomId, guestId, lockCode]);

      // 更新房间状态和智能锁密码
      await connection.execute(`
        UPDATE rooms 
        SET status = '已入住', smart_lock_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [lockCode, roomId]);

      await connection.commit();

      await logger.logToDatabase('客人自助登记', `客人${name}登记入住房间${roomRows[0].room_number}`, 'guest', req.ip);

      res.json({
        success: true,
        data: {
          guestId,
          bookingId: bookingResult.insertId,
          roomNumber: roomRows[0].room_number,
          totalAmount,
          lockCode
        },
        message: '登记成功'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('详细错误信息:', error);
    logger.error('客人登记失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || '登记失败',
      error: error.message
    });
  }
});

// 获取客人信息
router.get('/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, name, id_card, phone, email, gender, birth_date, address, created_at, updated_at
      FROM guests 
      WHERE id = ?
    `, [guestId]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '客人不存在'
      });
    }
    
    await logger.logToDatabase('查询客人信息', `查询客人ID: ${guestId}`, 'system', req.ip);
    
    res.json({
      success: true,
      data: rows[0],
      message: '客人信息获取成功'
    });
  } catch (error) {
    logger.error('获取客人信息失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取客人信息失败',
      error: error.message
    });
  }
});

// 根据身份证号查询客人
router.get('/search/id-card/:idCard', async (req, res) => {
  try {
    const { idCard } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT id, name, id_card, phone, email, gender, birth_date, address, created_at, updated_at
      FROM guests 
      WHERE id_card = ?
    `, [idCard]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '客人不存在'
      });
    }
    
    await logger.logToDatabase('查询客人信息', `根据身份证号查询: ${idCard}`, 'system', req.ip);
    
    res.json({
      success: true,
      data: rows[0],
      message: '客人信息获取成功'
    });
  } catch (error) {
    logger.error('获取客人信息失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取客人信息失败',
      error: error.message
    });
  }
});

// 获取客人入住记录
router.get('/:guestId/bookings', async (req, res) => {
  try {
    const { guestId } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        b.id,
        r.room_number,
        r.room_type,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        b.status,
        b.payment_status,
        ci.smart_lock_code,
        ci.check_in_time,
        ci.check_out_time
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN check_ins ci ON b.id = ci.booking_id
      WHERE b.guest_id = ?
      ORDER BY b.created_at DESC
    `, [guestId]);
    
    connection.release();
    
    await logger.logToDatabase('查询客人入住记录', `查询客人ID: ${guestId}的入住记录`, 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '入住记录获取成功'
    });
  } catch (error) {
    logger.error('获取入住记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取入住记录失败',
      error: error.message
    });
  }
});

module.exports = router; 