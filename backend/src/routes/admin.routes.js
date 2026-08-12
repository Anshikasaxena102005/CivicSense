const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Public lookups (used by citizen report form)
router.get('/public/categories',  ctrl.getPublicCategories);
router.get('/public/departments', ctrl.getPublicDepartments);

// Everything below requires admin
router.use(requireAuth, requireRole('admin'));

// Stats
router.get('/stats', ctrl.getStats);

// Issues
router.get('/issues',               ctrl.getAllIssues);
router.get('/issues/:id',           ctrl.getIssue);
router.patch('/issues/:id/assign',
  [body('officer_id').isInt({ min: 1 }).withMessage('Valid officer_id required')],
  validate,
  ctrl.assignOfficer
);
router.delete('/issues/:id',        ctrl.deleteIssue);

// Users
router.get('/users',       ctrl.getUsers);
router.get('/officers',    ctrl.getOfficersByDept);
router.post('/users/officer',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  ],
  validate,
  ctrl.createOfficer
);
router.patch('/users/:id/toggle', ctrl.toggleUser);

// Categories
router.get('/categories',      ctrl.getCategories);
router.post('/categories',
  [body('name').trim().notEmpty().withMessage('Name required')],
  validate,
  ctrl.createCategory
);
router.put('/categories/:id',
  [body('name').trim().notEmpty().withMessage('Name required')],
  validate,
  ctrl.updateCategory
);
router.delete('/categories/:id', ctrl.deleteCategory);

// Departments
router.get('/departments',     ctrl.getDepartments);
router.post('/departments',
  [body('name').trim().notEmpty().withMessage('Name required')],
  validate,
  ctrl.createDepartment
);
router.put('/departments/:id',
  [body('name').trim().notEmpty().withMessage('Name required')],
  validate,
  ctrl.updateDepartment
);
router.delete('/departments/:id', ctrl.deleteDepartment);

module.exports = router;
