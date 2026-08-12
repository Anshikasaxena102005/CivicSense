const { pool } = require('../config/db');
const R = require('../utils/response');
const { ISSUE_STATUS, PAGINATION, TIMELINE_ACTIONS, NOTIFICATION_TYPE } = require('../config/constants');
const { createNotification, addTimeline } = require('../services/notification.service');

const issueSelectFields = `
  i.id, i.title, i.description, i.status, i.priority, i.location,
  i.latitude, i.longitude, i.images, i.after_images, i.resolution_note,
  i.rejection_reason, i.created_at, i.updated_at,
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

// ── POST /api/citizen/issues ──────────────────────────────────
const createIssue = async (req, res, next) => {
  try {
    const { title, description, category_id, priority, location, latitude, longitude } = req.body;

    // Handle images uploaded via multer
    const images = req.files && req.files.length
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];

    const [result] = await pool.execute(
      `INSERT INTO issues (title, description, category_id, citizen_id, priority, location, latitude, longitude, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        category_id || null,
        req.user.id,
        priority || 'medium',
        location || null,
        latitude  || null,
        longitude || null,
        JSON.stringify(images),
      ]
    );

    const issueId = result.insertId;

    // Timeline entry
    await addTimeline({ issueId, userId: req.user.id, action: TIMELINE_ACTIONS.CREATED });

    const [rows] = await pool.execute(
      `SELECT ${issueSelectFields} ${issueJoins} WHERE i.id = ?`,
      [issueId]
    );

    const issue = parseIssue(rows[0]);
    return R.created(res, { issue }, 'Issue reported successfully');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/citizen/issues ───────────────────────────────────
const getMyIssues = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE);
    const limit  = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;
    const { status, category_id } = req.query;

    const where = ['i.citizen_id = ?'];
    const params = [req.user.id];

    if (status)      { where.push('i.status = ?');      params.push(status); }
    if (category_id) { where.push('i.category_id = ?'); params.push(category_id); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);
    const [rows] = await pool.query(
      `SELECT ${issueSelectFields} ${issueJoins} ${whereClause}
       ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM issues i ${whereClause}`,
      params
    );

    return R.paginated(res, rows.map(parseIssue), { total, page, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/citizen/issues/:id ───────────────────────────────
const getMyIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${issueSelectFields} ${issueJoins} WHERE i.id = ? AND i.citizen_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');

    // Fetch timeline
    const [timeline] = await pool.execute(
      `SELECT t.*, u.name AS user_name, u.role AS user_role
       FROM issue_timeline t LEFT JOIN users u ON u.id = t.user_id
       WHERE t.issue_id = ? ORDER BY t.created_at ASC`,
      [req.params.id]
    );

    return R.success(res, { issue: parseIssue(rows[0]), timeline });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/citizen/issues/:id ────────────────────────────
const deleteMyIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, status FROM issues WHERE id = ? AND citizen_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');
    if (rows[0].status !== ISSUE_STATUS.PENDING) {
      return R.badRequest(res, 'Only pending issues can be deleted');
    }

    await pool.execute('DELETE FROM issues WHERE id = ?', [req.params.id]);
    return R.success(res, null, 'Issue deleted');
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/citizen/issues/:id/reopen ─────────────────────
const reopenIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, status FROM issues WHERE id = ? AND citizen_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');
    if (rows[0].status !== ISSUE_STATUS.RESOLVED && rows[0].status !== ISSUE_STATUS.REJECTED) {
      return R.badRequest(res, 'Only resolved or rejected issues can be reopened');
    }

    await pool.execute(
      "UPDATE issues SET status = 'reopened', officer_id = NULL WHERE id = ?",
      [req.params.id]
    );
    await addTimeline({ issueId: req.params.id, userId: req.user.id, action: TIMELINE_ACTIONS.REOPENED, note: req.body.reason || null });

    return R.success(res, null, 'Issue reopened');
  } catch (err) {
    next(err);
  }
};

// ── GET /api/citizen/stats ────────────────────────────────────
const getMyStats = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count FROM issues WHERE citizen_id = ? GROUP BY status`,
      [req.user.id]
    );
    const stats = { total: 0, pending: 0, assigned: 0, in_progress: 0, resolved: 0, rejected: 0, reopened: 0 };
    rows.forEach((r) => {
      stats[r.status] = Number(r.count);
      stats.total += Number(r.count);
    });
    return R.success(res, stats);
  } catch (err) {
    next(err);
  }
};

// ── Helper ────────────────────────────────────────────────────
const parseIssue = (row) => {
  if (!row) return null;
  return {
    ...row,
    images:       safeParseJSON(row.images),
    after_images: safeParseJSON(row.after_images),
  };
};

const safeParseJSON = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};

module.exports = { createIssue, getMyIssues, getMyIssue, deleteMyIssue, reopenIssue, getMyStats };
