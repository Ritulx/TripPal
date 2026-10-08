const { body, param, query } = require('express-validator');

const moderateReviewValidator = [
  param('id').isMongoId().withMessage('Invalid review id'),
];

const moderateTipValidator = [
  param('id').isMongoId().withMessage('Invalid tip id'),
  body('action')
    .isIn(['approve', 'remove'])
    .withMessage('action must be "approve" or "remove"'),
];

const listFlaggedTipsValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'flagged', 'approved', 'removed'])
    .withMessage('Invalid status filter'),
];

const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('icon').optional().trim().isLength({ max: 50 }),
];

const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('isActive').optional().isBoolean(),
];

const verifyLocalValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
];

module.exports = {
  moderateReviewValidator,
  moderateTipValidator,
  listFlaggedTipsValidator,
  createCategoryValidator,
  updateCategoryValidator,
  verifyLocalValidator,
};