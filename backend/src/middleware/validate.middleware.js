const { validationResult } = require('express-validator');
const R = require('../utils/response');

/**
 * Run after express-validator chains.
 * Collects all validation errors and returns 400 if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return R.badRequest(res, 'Validation failed', formatted);
  }
  next();
};

module.exports = validate;
