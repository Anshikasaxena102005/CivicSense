const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const R = require('../utils/response');
const { ROLES } = require('../config/constants');

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const userShape = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone,
  address: u.address,
  avatar: u.avatar,
  department_id: u.department_id,
});

// ── POST /api/auth/register ───────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return R.conflict(res, 'Email already registered');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), hashed, ROLES.CITIZEN, phone || null, address || null]
    );

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, address, avatar, department_id FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = signToken(rows[0]);
    return R.created(res, { user: userShape(rows[0]), token }, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, phone, address, avatar, department_id, is_active FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (!rows.length) return R.unauthorized(res, 'Invalid credentials');

    const user = rows[0];
    if (!user.is_active) return R.forbidden(res, 'Account is deactivated');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return R.unauthorized(res, 'Invalid credentials');

    const token = signToken(user);
    return R.success(res, { user: userShape(user), token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.address, u.avatar, u.department_id,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    return R.success(res, userShape({ ...rows[0] }));
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/auth/profile ─────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    await pool.execute(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone || null, address || null, req.user.id]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, address, avatar, department_id FROM users WHERE id = ?',
      [req.user.id]
    );
    return R.success(res, userShape(rows[0]), 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/auth/password ────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) return R.badRequest(res, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    return R.success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
