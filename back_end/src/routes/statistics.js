const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 1. 入住率（日/周/月）
router.get('/occupancy-rate', async (req, res) => {
  const { start, end, type = 'day' } = req.query;
  try {
    const connection = await pool.getConnection();
    let groupBy = 'DATE(b.check_in_date)';
    if (type === 'month') groupBy = 'DATE_FORMAT(b.check_in_date, "%Y-%m")';
    if (type === 'week') groupBy = 'YEARWEEK(b.check_in_date)';
    const [rows] = await connection.execute(
      `SELECT ${groupBy} as period, COUNT(*) as count
       FROM bookings b
       WHERE b.status IN ('已入住', '已退房')
         AND b.check_in_date >= ? AND b.check_in_date <= ?
       GROUP BY period
       ORDER BY period`,
      [start, end]
    );
    connection.release();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取入住率失败', error: e.message });
  }
});

// 2. 营收（日/周/月/房型）
router.get('/revenue', async (req, res) => {
  const { start, end, type = 'day' } = req.query;
  try {
    const connection = await pool.getConnection();
    let groupBy = 'DATE(b.check_in_date)';
    if (type === 'month') groupBy = 'DATE_FORMAT(b.check_in_date, "%Y-%m")';
    if (type === 'week') groupBy = 'YEARWEEK(b.check_in_date)';
    const [rows] = await connection.execute(
      `SELECT ${groupBy} as period, SUM(b.total_amount) as revenue
       FROM bookings b
       WHERE b.status IN ('已入住', '已退房')
         AND b.check_in_date >= ? AND b.check_in_date <= ?
       GROUP BY period
       ORDER BY period`,
      [start, end]
    );
    connection.release();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取营收失败', error: e.message });
  }
});

// 3. 房型分布
router.get('/room-type-distribution', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT room_type, COUNT(*) as count FROM rooms GROUP BY room_type`
    );
    connection.release();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取房型分布失败', error: e.message });
  }
});

// 4. 客源地分布（按省份/城市）
router.get('/guest-origin', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT LEFT(address, 2) as province, COUNT(*) as count FROM guests GROUP BY province ORDER BY count DESC LIMIT 10`
    );
    connection.release();
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取客源地分布失败', error: e.message });
  }
});

module.exports = router; 