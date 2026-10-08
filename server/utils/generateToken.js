const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing only the user's id and role.
 * @param {string} id - MongoDB ObjectId of the user
 * @param {string} role - 'tourist' | 'local' | 'admin'
 * @returns {string} signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;