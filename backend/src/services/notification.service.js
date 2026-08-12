const { pool } = require('../config/db');
const { NOTIFICATION_TYPE } = require('../config/constants');

/**
 * Creates a notification row and optionally logs a timeline entry.
 *
 * @param {object} opts
 * @param {number}  opts.userId          - recipient user
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {string}  [opts.type]          - info|success|warning|error
 * @param {number}  [opts.relatedIssueId]
 */
const createNotification = async ({ userId, title, message, type = NOTIFICATION_TYPE.INFO, relatedIssueId = null }) => {
  try {
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, related_issue_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, message, type, relatedIssueId]
    );
  } catch (err) {
    // Non-fatal — log but don't crash the request
    console.error('[Notification] Failed to create:', err.message);
  }
};

/**
 * Logs an entry in issue_timeline.
 *
 * @param {object} opts
 * @param {number}  opts.issueId
 * @param {number}  [opts.userId]
 * @param {string}  opts.action
 * @param {string}  [opts.note]
 */
const addTimeline = async ({ issueId, userId = null, action, note = null }) => {
  try {
    await pool.execute(
      'INSERT INTO issue_timeline (issue_id, user_id, action, note) VALUES (?, ?, ?, ?)',
      [issueId, userId, action, note]
    );
  } catch (err) {
    console.error('[Timeline] Failed to add:', err.message);
  }
};

module.exports = { createNotification, addTimeline };
