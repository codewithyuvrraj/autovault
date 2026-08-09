const mysql = require('mysql2/promise');
require('dotenv').config();

// Hosted MySQL (Render + TiDB Cloud / Aiven) requires TLS — enable it with MYSQL_SSL=true.
// rejectUnauthorized is relaxed because free tiers use self-signed/rotating CAs.
const ssl = process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

// Connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'car_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  dateStrings: true,
  ...(ssl ? { ssl } : {}),
});

// Simple query helper
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
