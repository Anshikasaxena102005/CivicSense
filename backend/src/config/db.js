const mysql = require('mysql2/promise');

/**
 * Connection pool — reuses connections instead of creating new ones per request.
 * mysql2/promise gives us async/await support out of the box.
 */
const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             Number(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASS     || '',
  database:         process.env.DB_NAME     || 'civicsense_db',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  timezone:         '+00:00',
  charset:          'utf8mb4',
});

/**
 * Called once at server start to confirm DB is reachable.
 * Exits the process on failure so the dev notices immediately.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected →', process.env.DB_NAME);
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
