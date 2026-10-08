const { query, param } = require('express-validator');

const searchNearbyValidator = [
  query('lat')
    .notEmpty()
    .withMessage('lat is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90'),

  query('lng')
    .notEmpty()
    .withMessage('lng is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180'),

  query('radiusKm')
    .notEmpty()
    .withMessage('radiusKm is required')
    .isFloat({ min: 0.5, max: 40 })
    .withMessage('radiusKm must be between 0.5 and 40 (SRS FR-01 hard limit)'),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('category must be a valid category id'),

  query('keyword').optional().isString().trim().isLength({ max: 100 }),

  query('refresh').optional().isBoolean().toBoolean(),
];

const placeIdValidator = [
  param('id').isMongoId().withMessage('Invalid place id'),
];

module.exports = { searchNearbyValidator, placeIdValidator };