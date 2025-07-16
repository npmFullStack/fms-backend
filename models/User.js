const pool = require('../db');

class User {
  static async findOne({ email }) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const { rows } = await pool.query(query, [email]);
      return rows[0];
    } catch (err) {
      console.error('Error in User.findOne:', err);
      throw err;
    }
  }

  static async create({ username, email, password }) {
    try {
      const query = `
        INSERT INTO users(username, email, password) 
        VALUES($1, $2, $3) 
        RETURNING id, username, email
      `;
      const { rows } = await pool.query(query, [username, email, password]);
      return rows[0];
    } catch (err) {
      console.error('Error in User.create:', err);
      throw err;
    }
  }
}

module.exports = User;