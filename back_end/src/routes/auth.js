const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 系统状态检查
router.get('/status', async (req, res) => {
  try {
    await logger.logToDatabase('系统状态检查', '检查系统运行状态', 'system', req.ip);
    
    res.json({
      success: true,
      data: {
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'smart-hotel-backend'
      },
      message: '系统运行正常'
    });
  } catch (error) {
    logger.error('系统状态检查失败:', error.message);
    res.status(500).json({
      success: false,
      message: '系统状态检查失败',
      error: error.message
    });
  }
});

module.exports = router; 