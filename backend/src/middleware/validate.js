const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Runs after express-validator checks; turns validation failures into a 400 AppError.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(', ');
    throw new AppError(message, 400);
  }
  next();
}

module.exports = validate;
