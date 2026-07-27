const { validationResult } = require('express-validator');
const { fail } = require('../utils/apiResponse');

// Run after an array of express-validator checks to short-circuit with a
// consistent 400 response if any of them failed.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return fail(res, 400, 'Validation failed', { errors: formatted });
  }
  next();
};

module.exports = validate;
