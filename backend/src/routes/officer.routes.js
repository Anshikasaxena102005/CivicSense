const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/officer.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../utils/upload');

router.use(requireAuth, requireRole('officer'));

router.get('/stats',   ctrl.getOfficerStats);
router.get('/issues',  ctrl.getAssignedIssues);
router.get('/issues/:id', ctrl.getIssue);

router.patch('/issues/:id/status',
  [
    body('status').isIn(['in_progress', 'resolved', 'rejected']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.updateStatus
);

router.patch('/issues/:id/resolution',
  [body('note').trim().notEmpty().withMessage('Note is required')],
  validate,
  ctrl.addResolution
);

router.post('/issues/:id/after-images',
  upload.array('images', 5),
  ctrl.uploadAfterImages
);

module.exports = router;
