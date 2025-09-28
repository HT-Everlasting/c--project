const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// 获取所有预订记录（带分页）
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // 查询总数
    const [totalRows] = await connection.execute(`
      SELECT COUNT(*) as total FROM bookings
    `);
    const total = totalRows[0].total;

    // 查询分页数据
    const [rows] = await connection.execute(`
      SELECT
        b.id AS booking_id,
        g.name AS guest_name,
        g.id_card,
        g.phone,
        r.room_number,
        r.room_type,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        b.status AS booking_status,
        b.payment_status,
        b.created_at AS booking_time
      FROM
        bookings b
      JOIN
        guests g ON b.guest_id = g.id
      JOIN
        rooms r ON b.room_id = r.id
      ORDER BY
        b.created_at DESC
      LIMIT ?
      OFFSET ?
    `, [limit, offset]);
    
    connection.release();

    res.json({
      success: true,
      data: {
        bookings: rows,
        pagination: {
          page,
          limit,
          total
        }
      },
      message: '预订列表获取成功'
    });

  } catch (error) {
    logger.error('获取预订列表失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取预订列表失败',
      error: error.message
    });
  }
});

// 客人自助入住
router.post('/checkin', async (req, res) => {
  // ... (现有入住逻辑代码) ...

      // 4. 更新房间状态为"已入住"
      await connection.execute(
        `UPDATE rooms SET status = '已入住', smart_lock_code = ? WHERE id = ?`,
        [smartLockCode, roomId]
      );

      await connection.commit();
      
      // 发送实时更新通知
      const [updatedRooms] = await connection.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
      if (updatedRooms.length > 0) {
        io.emit('room_status_changed', updatedRooms[0]);
      }

      await logger.logToDatabase('客人自助入住', `客人${guest.name}成功入住，房间号${room.room_number}`, 'guest', req.ip);

  // ... (现有入住逻辑的 catch 和 finally 代码) ...
});

// 客人自助退房
router.post('/checkout', async (req, res) => {
  try {
    const { roomNumber, lockCode } = req.body;

    // 验证必填字段
    if (!roomNumber || !lockCode) {
      return res.status(400).json({
        success: false,
        message: '请输入房间号和智能锁密码'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. 根据房间号查找当前有效的入住记录和房间信息
      const [bookingRows] = await connection.execute(`
        SELECT 
          b.id as booking_id, 
          b.guest_id, 
          b.total_amount, 
          g.name, 
          r.id as room_id,
          r.smart_lock_code
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        JOIN guests g ON b.guest_id = g.id
        WHERE r.room_number = ? AND b.status = '已入住'
      `, [roomNumber]);

      if (bookingRows.length === 0) {
        throw new Error('未找到该房间的入住信息，请检查房间号是否正确');
      }
      
      const booking = bookingRows[0];
      
      // 2. 验证智能锁密码
      if (booking.smart_lock_code !== lockCode) {
        // 记录失败尝试
        await logger.logToDatabase('退房失败', `房间号 ${roomNumber} 智能锁密码错误`, 'guest', req.ip);
        throw new Error('智能锁密码错误');
      }

      const checkOutTime = new Date();

      // 3. 更新预订记录状态为"已退房"
      await connection.execute(`
        UPDATE bookings SET status = '已退房', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [booking.booking_id]);

      // 4. 更新入住记录状态为"已退房"
      await connection.execute(`
        UPDATE check_ins SET status = '已退房', check_out_time = ? WHERE booking_id = ?
      `, [checkOutTime, booking.booking_id]);

      // 5. 更新房间状态为空闲，并清空智能锁密码
      await connection.execute(
        `UPDATE rooms SET status = '空闲', smart_lock_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [booking.room_id]
      );

      await connection.commit();

      // 发送实时更新通知
      const [updatedRooms] = await connection.execute('SELECT * FROM rooms WHERE id = ?', [booking.room_id]);
      if (updatedRooms.length > 0) {
        io.emit('room_status_changed', updatedRooms[0]);
      }

      await logger.logToDatabase('客人自助退房', `客人 ${booking.name} 成功退房，房间号 ${roomNumber}`, 'guest', req.ip);

      res.json({
        success: true,
        data: {
          guestName: booking.name,
          roomNumber,
          checkOutTime,
          totalAmount: booking.total_amount
        },
        message: '退房成功'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('退房失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || '退房失败，请重试',
      error: error.message
    });
  }
});

// 获取所有预订记录
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        b.id,
        g.name as guest_name,
        g.id_card,
        g.phone,
        r.room_number,
        r.room_type,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        b.status,
        b.payment_status,
        b.created_at
      FROM bookings b
      JOIN guests g ON b.guest_id = g.id
      JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);
    
    connection.release();
    
    await logger.logToDatabase('查询预订记录', '获取所有预订记录', 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '预订记录获取成功'
    });
  } catch (error) {
    logger.error('获取预订记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取预订记录失败',
      error: error.message
    });
  }
});

// 获取当前入住记录
router.get('/current', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        ci.id,
        g.name as guest_name,
        g.id_card,
        g.phone,
        r.room_number,
        r.room_type,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        ci.smart_lock_code,
        ci.check_in_time
      FROM check_ins ci
      JOIN guests g ON ci.guest_id = g.id
      JOIN rooms r ON ci.room_id = r.id
      JOIN bookings b ON ci.booking_id = b.id
      WHERE ci.status = '入住中'
      ORDER BY ci.check_in_time DESC
    `);
    
    connection.release();
    
    await logger.logToDatabase('查询当前入住', '获取当前入住记录', 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '当前入住记录获取成功'
    });
  } catch (error) {
    logger.error('获取当前入住记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取当前入住记录失败',
      error: error.message
    });
  }
});

// 根据身份证号查询预订记录
router.get('/guest/:idCard', async (req, res) => {
  try {
    const { idCard } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        b.id,
        g.name as guest_name,
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
      JOIN guests g ON b.guest_id = g.id
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN check_ins ci ON b.id = ci.booking_id
      WHERE g.id_card = ?
      ORDER BY b.created_at DESC
    `, [idCard]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到预订记录'
      });
    }
    
    await logger.logToDatabase('查询客人预订记录', `根据身份证号查询预订: ${idCard}`, 'system', req.ip);
    
    res.json({
      success: true,
      data: rows,
      message: '预订记录获取成功'
    });
  } catch (error) {
    logger.error('获取预订记录失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取预订记录失败',
      error: error.message
    });
  }
});

// 取消预订
router.patch('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const connection = await pool.getConnection();
    
    // 检查预订状态
    const [bookingRows] = await connection.execute(`
      SELECT b.id, b.room_id, b.status, r.room_number, g.name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN guests g ON b.guest_id = g.id
      WHERE b.id = ?
    `, [bookingId]);
    
    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '预订记录不存在'
      });
    }
    
    if (bookingRows[0].status !== '已预订') {
      return res.status(400).json({
        success: false,
        message: '只能取消已预订状态的订单'
      });
    }
    
    await connection.execute(`
      UPDATE bookings 
      SET status = '已取消', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [bookingId]);
    
    await connection.execute(`
      UPDATE rooms 
      SET status = '空闲', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [bookingRows[0].room_id]);
    
    connection.release();
    
    await logger.logToDatabase('取消预订', `取消客人${bookingRows[0].name}的房间${bookingRows[0].room_number}预订`, 'system', req.ip);
    
    res.json({
      success: true,
      message: '预订取消成功'
    });
  } catch (error) {
    logger.error('取消预订失败:', error.message);
    res.status(500).json({
      success: false,
      message: '取消预订失败',
      error: error.message
    });
  }
});

module.exports = (io) => {
  return router;
}; 