const { body, param, query } = require('express-validator');

const createTipValidator = [
  body('place').isMongoId().withMessage('A valid place id is required'),
  body('tipText')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Tip text must be between 5 and 255 characters'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('tags must be an array of up to 10 strings'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be under 50 characters'),
  body('categoryTag').optional().isString().trim().isLength({ max: 50 }),
];

const updateTipValidator = [
  param('id').isMongoId().withMessage('Invalid tip id'),
  body('tipText').optional().trim().isLength({ min: 5, max: 255 }),
  body('tags').optional().isArray({ max: 10 }),
];

const tipIdValidator = [param('id').isMongoId().withMessage('Invalid tip id')];

const placeIdParamValidator = [
  param('placeId').isMongoId().withMessage('Invalid place id'),
];

const voteValidator = [
  param('id').isMongoId().withMessage('Invalid tip id'),
  body('direction')
    .isIn(['up', 'down'])
    .withMessage('direction must be either "up" or "down"'),
];

const listTipsQueryValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'flagged', 'removed'])
    .withMessage('Invalid status filter'),
];

module.exports = {
  createTipValidator,
  updateTipValidator,
  tipIdValidator,
  placeIdParamValidator,
  voteValidator,
  listTipsQueryValidator,
};