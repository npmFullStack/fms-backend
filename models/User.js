const pool = require('../db');

class User {
  static async findOne({ email }) {
    try {
      console.log('Searching for user with email:', email);
      const query = 'SELECT * FROM users WHERE email = $1';
      const { rows } = await pool.query(query, [email]);
      console.log('User search result:', rows[0]);
      return rows[0];
    } catch (err) {
      console.error('Error in User.findOne:', err);
      throw err;
    }
  }

  static async create({ email, password }) {
    try {
      console.log('Creating user with email:', email);
      const query = 'INSERT INTO users(email, password) VALUES($1, $2) RETURNING *';
      const { rows } = await pool.query(query, [email, password]);
      console.log('User created:', rows[0]);
      return rows[0];
    } catch (err) {
      console.error('Error in User.create:', err);
      throw err;
    }
  }
}

module.exports = User;