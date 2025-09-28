const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  
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

  console.log('📋 数据库配置:');
  console.log(`  Host: ${dbConfig.host}`);
  console.log(`  User: ${dbConfig.user}`);
  console.log(`  Database: ${dbConfig.database}`);
  console.log(`  Port: ${dbConfig.port}`);
  console.log(`  Password: ${dbConfig.password ? '***已设置***' : '***未设置***'}`);

  try {
    // 首先尝试不指定数据库连接
    console.log('\n🔗 尝试连接到MySQL服务器...');
    const serverConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    console.log('✅ MySQL服务器连接成功');
    
    // 检查数据库是否存在
    const [databases] = await serverConnection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbConfig.database);
    
    if (!dbExists) {
      console.log(`⚠️  数据库 '${dbConfig.database}' 不存在，正在创建...`);
      await serverConnection.execute(`CREATE DATABASE ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ 数据库 '${dbConfig.database}' 创建成功`);
    } else {
      console.log(`✅ 数据库 '${dbConfig.database}' 已存在`);
    }
    
    await serverConnection.end();
    
    // 现在连接到指定数据库
    console.log('\n🔗 尝试连接到指定数据库...');
    const dbConnection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 测试查询
    const [rows] = await dbConnection.execute('SELECT 1 as test');
    console.log('✅ 数据库查询测试成功');
    
    await dbConnection.end();
    console.log('\n🎉 数据库连接测试完成！');
    return true;
    
  } catch (error) {
    console.error('\n❌ 数据库连接失败:');
    console.error(`   错误信息: ${error.message}`);
    console.error(`   错误代码: ${error.code}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查用户名和密码是否正确');
      console.log('2. 确保MySQL用户有足够权限');
      console.log('3. 运行: sudo mysql_secure_installation');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案:');
      console.log('1. 确保MySQL服务已启动: sudo systemctl start mysql');
      console.log('2. 检查MySQL是否在指定端口运行');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 解决方案:');
      console.log('1. 数据库不存在，请先创建数据库');
      console.log('2. 运行: mysql -u root -p -e "CREATE DATABASE smart_hotel;"');
    }
    
    return false;
  }
}

// 运行测试
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🚀 可以启动应用了！');
    console.log('运行: npm run dev');
  } else {
    console.log('\n⚠️  请先解决数据库连接问题');
    process.exit(1);
  }
}); 