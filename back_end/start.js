require('dotenv').config();
const { initDatabase, testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function startServer() {
  try {
    console.log('🚀 正在启动智能酒店管理系统后端...');
    
    // 测试数据库连接
    console.log('📊 检查数据库连接...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功');
    
    // 初始化数据库表
    console.log('🗄️ 初始化数据库表...');
    await initDatabase();
    console.log('✅ 数据库初始化完成');
    
    // 启动服务器
    console.log('🌐 启动Web服务器...');
    require('./src/app');
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer(); 