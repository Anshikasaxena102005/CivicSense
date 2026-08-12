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
  u_cit.phone AS citizen_phone,
  u_off.id AS officer_id, u_off.name AS officer_name
`;

const issueJoins = `
  FROM issues i
  LEFT JOIN categories c  ON c.id = i.category_id
  LEFT JOIN departments d ON d.id = c.department_id
  LEFT JOIN users u_cit   ON u_cit.id = i.citizen_id
  LEFT JOIN users u_off   ON u_off.id = i.officer_id
`;

const safeParseJSON = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};

const parseIssue = (row) => ({ ...row, images: safeParseJSON(row.images), after_images: safeParseJSON(row.after_images) });

// ── GET /api/officer/issues ───────────────────────────────────
const getAssignedIssues = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = ['i.officer_id = ?'];
    const params = [req.user.id];
    if (status) { where.push('i.status = ?'); params.push(status); }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);
    const [rows] = await pool.query(
      `SELECT ${issueSelectFields} ${issueJoins} ${whereClause}
       ORDER BY i.updated_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM issues i ${whereClause}`, params
    );

    return R.paginated(res, rows.map(parseIssue), { total, page, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
};

// ── GET /api/officer/issues/:id ───────────────────────────────
const getIssue = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${issueSelectFields} ${issueJoins} WHERE i.id = ? AND i.officer_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found or not assigned to you');

    const [timeline] = await pool.execute(
      `SELECT t.*, u.name AS user_name, u.role AS user_role
       FROM issue_timeline t LEFT JOIN users u ON u.id = t.user_id
       WHERE t.issue_id = ? ORDER BY t.created_at ASC`,
      [req.params.id]
    );
    return R.success(res, { issue: parseIssue(rows[0]), timeline });
  } catch (err) { next(err); }
};

// ── PATCH /api/officer/issues/:id/status ─────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status, note, rejection_reason } = req.body;
    const allowed = [ISSUE_STATUS.IN_PROGRESS, ISSUE_STATUS.RESOLVED, ISSUE_STATUS.REJECTED];
    if (!allowed.includes(status)) return R.badRequest(res, 'Invalid status transition');

    const [rows] = await pool.execute(
      'SELECT id, citizen_id, title, status FROM issues WHERE id = ? AND officer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');
    const issue = rows[0];

    const updateFields = { status };
    if (status === ISSUE_STATUS.REJECTED && rejection_reason) updateFields.rejection_reason = rejection_reason;
    if (status === ISSUE_STATUS.RESOLVED && note) updateFields.resolution_note = note;

    const setClauses = Object.keys(updateFields).map((k) => `${k} = ?`).join(', ');
    await pool.execute(
      `UPDATE issues SET ${setClauses} WHERE id = ?`,
      [...Object.values(updateFields), req.params.id]
    );

    const actionMap = {
      [ISSUE_STATUS.IN_PROGRESS]: TIMELINE_ACTIONS.STATUS_CHANGE,
      [ISSUE_STATUS.RESOLVED]:    TIMELINE_ACTIONS.RESOLVED,
      [ISSUE_STATUS.REJECTED]:    TIMELINE_ACTIONS.REJECTED,
    };
    await addTimeline({ issueId: req.params.id, userId: req.user.id, action: actionMap[status], note: note || rejection_reason || null });

    // Notify citizen
    const msgMap = {
      [ISSUE_STATUS.IN_PROGRESS]: { title: 'Issue In Progress', type: NOTIFICATION_TYPE.INFO },
      [ISSUE_STATUS.RESOLVED]:    { title: 'Issue Resolved ✅', type: NOTIFICATION_TYPE.SUCCESS },
      [ISSUE_STATUS.REJECTED]:    { title: 'Issue Rejected', type: NOTIFICATION_TYPE.WARNING },
    };
    await createNotification({
      userId: issue.citizen_id,
      title: msgMap[status].title,
      message: `Your issue "${issue.title}" has been marked as ${status.replace('_', ' ')}.`,
      type: msgMap[status].type,
      relatedIssueId: issue.id,
    });

    const [updated] = await pool.execute('SELECT id, status, resolution_note, rejection_reason FROM issues WHERE id = ?', [req.params.id]);
    return R.success(res, { issue: updated[0] }, `Issue status updated to ${status}`);
  } catch (err) { next(err); }
};

// ── PATCH /api/officer/issues/:id/resolution ─────────────────
const addResolution = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) return R.badRequest(res, 'Resolution note is required');

    const [rows] = await pool.execute(
      'SELECT id, citizen_id, title FROM issues WHERE id = ? AND officer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');

    await pool.execute('UPDATE issues SET resolution_note = ? WHERE id = ?', [note, req.params.id]);
    await addTimeline({ issueId: req.params.id, userId: req.user.id, action: TIMELINE_ACTIONS.NOTE_ADDED, note });

    return R.success(res, null, 'Resolution note added');
  } catch (err) { next(err); }
};

// ── POST /api/officer/issues/:id/after-images ────────────────
const uploadAfterImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) return R.badRequest(res, 'No images provided');

    const [rows] = await pool.execute(
      'SELECT id, after_images FROM issues WHERE id = ? AND officer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, 'Issue not found');

    const existing = safeParseJSON(rows[0].after_images);
    const newImages = req.files.map((f) => `/uploads/${f.filename}`);
    const merged = [...existing, ...newImages];

    await pool.execute('UPDATE issues SET after_images = ? WHERE id = ?', [JSON.stringify(merged), req.params.id]);
    await addTimeline({ issueId: req.params.id, userId: req.user.id, action: TIMELINE_ACTIONS.AFTER_IMAGE });

    return R.success(res, { after_images: merged }, 'After-images uploaded');
  } catch (err) { next(err); }
};

// ── GET /api/officer/stats ────────────────────────────────────
const getOfficerStats = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT status, COUNT(*) AS count FROM issues WHERE officer_id = ? GROUP BY status',
      [req.user.id]
    );
    const stats = { total: 0, assigned: 0, in_progress: 0, resolved: 0, rejected: 0 };
    rows.forEach((r) => { stats[r.status] = Number(r.count); stats.total += Number(r.count); });
    return R.success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { getAssignedIssues, getIssue, updateStatus, addResolution, uploadAfterImages, getOfficerStats };
