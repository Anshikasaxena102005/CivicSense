/**
 * Application-wide constants.
 * Single source of truth — import these everywhere instead of
 * using raw strings for roles, statuses, etc.
 */

const ROLES = Object.freeze({
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  ADMIN:   'admin',
});

const ISSUE_STATUS = Object.freeze({
  PENDING:     'pending',
  ASSIGNED:    'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
  REJECTED:    'rejected',
  REOPENED:    'reopened',
});

const ISSUE_PRIORITY = Object.freeze({
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
});

const NOTIFICATION_TYPE = Object.freeze({
  INFO:    'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR:   'error',
});

const TIMELINE_ACTIONS = Object.freeze({
  CREATED:       'Issue Created',
  ASSIGNED:      'Officer Assigned',
  STATUS_CHANGE: 'Status Changed',
  RESOLVED:      'Issue Resolved',
  REJECTED:      'Issue Rejected',
  REOPENED:      'Issue Reopened',
  NOTE_ADDED:    'Resolution Note Added',
  AFTER_IMAGE:   'After-image Uploaded',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     50,
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES_PER_ISSUE = 5;

module.exports = {
  ROLES,
  ISSUE_STATUS,
  ISSUE_PRIORITY,
  NOTIFICATION_TYPE,
  TIMELINE_ACTIONS,
  PAGINATION,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_ISSUE,
};
