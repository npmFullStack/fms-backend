const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use Render's full URL
  ssl: {
    rejectUnauthorized: false // Required for Render's external PostgreSQL
  }
});

// Test connection
pool.query('SELECT NOW()')
  .then(res => console.log('✅ Database connected at:', res.rows[0].now))
  .catch(err => console.error('❌ Database connection error:', err));

module.exports = pool;