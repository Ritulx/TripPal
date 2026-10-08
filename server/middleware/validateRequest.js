const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    throw new AppError(message, 400);
  }
  next();
};

module.exports = validateRequest;