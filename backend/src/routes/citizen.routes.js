const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/citizen.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../utils/upload');

router.use(requireAuth, requireRole('citizen'));

// Stats
router.get('/stats', ctrl.getMyStats);

// Issue CRUD
router.post('/issues',
  upload.array('images', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }),
  ],
  validate,
  ctrl.createIssue
);

router.get('/issues',     ctrl.getMyIssues);
router.get('/issues/:id', ctrl.getMyIssue);
router.delete('/issues/:id', ctrl.deleteMyIssue);
router.patch('/issues/:id/reopen', ctrl.reopenIssue);

module.exports = router;
