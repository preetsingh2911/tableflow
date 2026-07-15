const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '' // try without password first
    });
    await conn.query('CREATE DATABASE IF NOT EXISTS tableflow');
    console.log('Database created successfully');
    await conn.end();
  } catch (e) {
    if (e.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Access denied. Password required.');
    } else {
      console.error('Error:', e);
    }
  }
}
run();
