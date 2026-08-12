const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const R = require('../utils/response');
const { PAGINATION, TIMELINE_ACTIONS, NOTIFICATION_TYPE } = require('../config/constants');
const { createNotification, addTimeline } = require('../services/notification.service');

const SALT_ROUNDS = 10;

const safeParseJSON = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};
const parseIssue = (row) => ({ ...row, images: safeParseJSON(row.images), after_images: safeParseJSON(row.after_images) });

const issueSelectFields = `
  i.id, i.title, i.description, i.status, i.priority, i.location,
  i.images, i.after_images, i.resolution_note, i.rejection_reason,
  i.created_at, i.updated_at,
  c.id AS category_id, c.name AS category_name,
  d.id AS department_id, d.name AS department_name,
  u_cit.id AS citizen_id, u_cit.name AS citizen_name, u_cit.email AS citizen_email,
  u_off.id AS officer_id, u_off.name AS officer_name, u_off.email AS officer_email
`;
const issueJoins = `
  FROM issues i
  LEFT JOIN categories c  ON c.id = i.category_id
  LEFT JOIN departments d ON d.id = c.department_id
  LEFT JOIN users u_cit   ON u_cit.id = i.citizen_id
  LEFT JOIN users u_off   ON u_off.id = i.officer_id
`;

// ─────────────────────────────────────── ISSUES ──────────────
// GET /api/admin/issues
const getAllIssues = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { status, category_id, department_id, priority, search } = req.query;

    const where = [];
    const params = [];

    if (status)        { where.push('i.status = ?');          params.push(status); }
    if (category_id)   { where.push('i.category_id = ?');     params.push(category_id); }
    if (priority)      { where.push('i.priority = ?');         params.push(priority); }
    if (department_id) { where.push('c.department_id = ?');   params.push(department_id); }
    if (search)        { where.push('(i.title LIKE ? OR i.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);
    const [rows] = await pool.query(
      `SELECT ${issueSelectFields} ${issueJoins} ${whereClause}
       ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM issues i LEFT JOIN categories c ON c.id = i.category_id ${whereClause}`,
      params
    );

    return R.paginated(res, rows.map(parseIssue), { total, page, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
};

// GET /api/admin/issues/:id
const getIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${issueSelectFields} ${issueJoins} WHERE i.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');

    const [timeline] = await pool.execute(
      `SELECT t.*, u.name AS user_name, u.role AS user_role
       FROM issue_timeline t LEFT JOIN users u ON u.id = t.user_id
       WHERE t.issue_id = ? ORDER BY t.created_at ASC`,
      [req.params.id]
    );
    return R.success(res, { issue: parseIssue(rows[0]), timeline });
  } catch (err) { next(err); }
};

// PATCH /api/admin/issues/:id/assign
const assignOfficer = async (req, res, next) => {
  try {
    const { officer_id } = req.body;
    if (!officer_id) return R.badRequest(res, 'officer_id is required');

    // Verify officer exists
    const [officerRows] = await pool.execute(
      "SELECT id, name, department_id FROM users WHERE id = ? AND role = 'officer' AND is_active = 1",
      [officer_id]
    );
    if (!officerRows.length) return R.notFound(res, 'Officer not found');

    const [issueRows] = await pool.execute('SELECT id, title, citizen_id, status FROM issues WHERE id = ?', [req.params.id]);
    if (!issueRows.length) return R.notFound(res, 'Issue not found');
    const issue = issueRows[0];

    await pool.execute(
      "UPDATE issues SET officer_id = ?, status = 'assigned' WHERE id = ?",
      [officer_id, req.params.id]
    );

    await addTimeline({ issueId: req.params.id, userId: req.user.id, action: TIMELINE_ACTIONS.ASSIGNED, note: `Assigned to ${officerRows[0].name}` });

    // Notify officer
    await createNotification({
      userId: officer_id,
      title: 'New Issue Assigned',
      message: `You have been assigned to issue: "${issue.title}"`,
      type: NOTIFICATION_TYPE.INFO,
      relatedIssueId: issue.id,
    });

    // Notify citizen
    await createNotification({
      userId: issue.citizen_id,
      title: 'Issue Assigned to Officer',
      message: `Your issue "${issue.title}" has been assigned to an officer.`,
      type: NOTIFICATION_TYPE.INFO,
      relatedIssueId: issue.id,
    });

    return R.success(res, null, 'Officer assigned successfully');
  } catch (err) { next(err); }
};

// DELETE /api/admin/issues/:id
const deleteIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM issues WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'Issue not found');
    await pool.execute('DELETE FROM issues WHERE id = ?', [req.params.id]);
    return R.success(res, null, 'Issue deleted');
  } catch (err) { next(err); }
};

// ────────────────────────────────────── STATS ────────────────
// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [[issueStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'pending')     AS pending,
         SUM(status = 'assigned')    AS assigned,
         SUM(status = 'in_progress') AS in_progress,
         SUM(status = 'resolved')    AS resolved,
         SUM(status = 'rejected')    AS rejected,
         SUM(status = 'reopened')    AS reopened
       FROM issues`
    );
    const [[userStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(role = 'citizen') AS citizens,
         SUM(role = 'officer') AS officers,
         SUM(role = 'admin')   AS admins
       FROM users WHERE is_active = 1`
    );
    const [categoryStats] = await pool.execute(
      `SELECT c.name, COUNT(i.id) AS count
       FROM categories c LEFT JOIN issues i ON i.category_id = c.id
       GROUP BY c.id ORDER BY count DESC LIMIT 5`
    );
    const [recentIssues] = await pool.execute(
      `SELECT i.id, i.title, i.status, i.priority, i.created_at, u.name AS citizen_name
       FROM issues i LEFT JOIN users u ON u.id = i.citizen_id
       ORDER BY i.created_at DESC LIMIT 5`
    );
    return R.success(res, { issues: issueStats, users: userStats, topCategories: categoryStats, recentIssues });
  } catch (err) { next(err); }
};

// ────────────────────────────────────── USERS ────────────────
// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { role, search, is_active } = req.query;

    const where = [];
    const params = [];
    if (role)                     { where.push('u.role = ?');               params.push(role); }
    if (is_active !== undefined && is_active !== '') { where.push('u.is_active = ?'); params.push(Number(is_active === 'true' || is_active === '1' ? 1 : 0)); }
    if (search)                   { where.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.created_at,
              d.name AS department_name
       FROM users u LEFT JOIN departments d ON d.id = u.department_id
       ${whereClause} ORDER BY u.created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`, params
    );
    return R.paginated(res, rows, { total, page, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
};

// POST /api/admin/users/officer
const createOfficer = async (req, res, next) => {
  try {
    const { name, email, password, department_id, phone } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return R.conflict(res, 'Email already registered');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department_id, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), hashed, 'officer', department_id || null, phone || null]
    );
    const [rows] = await pool.execute('SELECT id, name, email, role, department_id, phone FROM users WHERE id = ?', [result.insertId]);
    return R.created(res, rows[0], 'Officer account created');
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/toggle
const toggleUser = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, is_active, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'User not found');
    if (rows[0].role === 'admin') return R.forbidden(res, 'Cannot deactivate admin accounts');

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    return R.success(res, { is_active: !!newStatus }, `User ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
};

// ───────────────────────────────── CATEGORIES ────────────────
const getCategories = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, d.name AS department_name,
              (SELECT COUNT(*) FROM issues WHERE category_id = c.id) AS issue_count
       FROM categories c LEFT JOIN departments d ON d.id = c.department_id
       ORDER BY c.name`
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, department_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, department_id) VALUES (?, ?, ?)',
      [name, description || null, department_id || null]
    );
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return R.created(res, rows[0], 'Category created');
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, department_id, is_active } = req.body;
    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, department_id = ?, is_active = ? WHERE id = ?',
      [name, description || null, department_id || null, is_active !== undefined ? is_active : 1, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'Category not found');
    return R.success(res, rows[0], 'Category updated');
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'Category not found');
    await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return R.success(res, null, 'Category deleted');
  } catch (err) { next(err); }
};

// ───────────────────────────────── DEPARTMENTS ───────────────
const getDepartments = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.*,
              (SELECT COUNT(*) FROM users WHERE department_id = d.id AND role = 'officer') AS officer_count,
              (SELECT COUNT(*) FROM categories WHERE department_id = d.id) AS category_count
       FROM departments d ORDER BY d.name`
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    const [rows] = await pool.execute('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    return R.created(res, rows[0], 'Department created');
  } catch (err) { next(err); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;
    const [rows] = await pool.execute('SELECT id FROM departments WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'Department not found');
    await pool.execute(
      'UPDATE departments SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [name, description || null, is_active !== undefined ? is_active : 1, req.params.id]
    );
    const [updated] = await pool.execute('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    return R.success(res, updated[0], 'Department updated');
  } catch (err) { next(err); }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM departments WHERE id = ?', [req.params.id]);
    if (!rows.length) return R.notFound(res, 'Department not found');
    await pool.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    return R.success(res, null, 'Department deleted');
  } catch (err) { next(err); }
};

// ───────────────────────────────── PUBLIC LOOKUPS ────────────
const getPublicCategories = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.department_id, d.name AS department_name
       FROM categories c LEFT JOIN departments d ON d.id = c.department_id
       WHERE c.is_active = 1 ORDER BY c.name`
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
};

const getPublicDepartments = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, description FROM departments WHERE is_active = 1 ORDER BY name"
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
};

const getOfficersByDept = async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const where = department_id ? 'AND u.department_id = ?' : '';
    const params = department_id ? ['officer', department_id] : ['officer'];
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.department_id, d.name AS department_name,
              (SELECT COUNT(*) FROM issues WHERE officer_id = u.id AND status NOT IN ('resolved','rejected')) AS active_issues
       FROM users u LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.role = ? AND u.is_active = 1 ${where} ORDER BY u.name`,
      params
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
};

module.exports = {
  getAllIssues, getIssue, assignOfficer, deleteIssue,
  getStats,
  getUsers, createOfficer, toggleUser,
  getCategories, createCategory, updateCategory, deleteCategory,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getPublicCategories, getPublicDepartments, getOfficersByDept,
};
