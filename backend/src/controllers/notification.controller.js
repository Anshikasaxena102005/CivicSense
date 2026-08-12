const { pool } = require('../config/db');
const R = require('../utils/response');
const { PAGINATION } = require('../config/constants');

// ── GET /api/notifications ────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const lim = parseInt(limit, 10);
    const off = parseInt(offset, 10);
    const [rows] = await pool.query(
      `SELECT n.*, i.title AS issue_title
       FROM notifications n
       LEFT JOIN issues i ON i.id = n.related_issue_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ${lim} OFFSET ${off}`,
      [req.user.id]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?',
      [req.user.id]
    );

    return R.paginated(res, rows, { total, page, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notifications/unread-count ───────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return R.success(res, { count });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/:id/read ─────────────────────────
const markRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return R.success(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return R.success(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return R.success(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
