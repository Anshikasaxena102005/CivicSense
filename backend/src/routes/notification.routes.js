const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/',            ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read-all',  ctrl.markAllRead);
router.patch('/:id/read',  ctrl.markRead);
router.delete('/:id',      ctrl.deleteNotification);

module.exports = router;
