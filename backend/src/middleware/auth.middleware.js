const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * Verifies the Bearer JWT and attaches req.user.
 * Must be placed before any protected route.
 */
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return R.unauthorized(res, 'No token provided');
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return R.unauthorized(res, 'Invalid or expired token');
    }

    // Pull fresh user data so deactivated users are blocked immediately
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, address, avatar, department_id, is_active FROM users WHERE id = ?',
      [payload.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return R.unauthorized(res, 'Account not found or deactivated');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role guard factory.
 * Usage: requireRole('admin') or requireRole('admin', 'officer')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return R.unauthorized(res);
  if (!roles.includes(req.user.role)) {
    return R.forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
  }
  next();
};

module.exports = { requireAuth, requireRole };
