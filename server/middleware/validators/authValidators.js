const { body, param } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),

  // No role field — everyone registers as a plain user. "Local" status is
  // claimed per-area after registration via POST /auth/local-areas.
  body('homeLocation.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('homeLocation.coordinates must be [longitude, latitude]'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required'),
];

const updatePreferencesValidator = [
  body('preferences')
    .optional()
    .isArray()
    .withMessage('Preferences must be an array of strings'),
  body('preferences.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each preference must be under 50 characters'),
];

const addLocalAreaValidator = [
  body('label')
    .trim()
    .notEmpty()
    .withMessage('A label for this area is required')
    .isLength({ max: 100 })
    .withMessage('Label cannot exceed 100 characters'),
  body('coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('coordinates must be [longitude, latitude]'),
  body('coordinates.*').isFloat().withMessage('coordinates must be numeric'),
  body('radiusKm')
    .isFloat({ min: 1, max: 50 })
    .withMessage('radiusKm must be between 1 and 50'),
];

const localAreaIdValidator = [
  param('areaId').isMongoId().withMessage('Invalid local area id'),
];

module.exports = {
  registerValidator,
  loginValidator,
  updatePreferencesValidator,
  addLocalAreaValidator,
  localAreaIdValidator,
};