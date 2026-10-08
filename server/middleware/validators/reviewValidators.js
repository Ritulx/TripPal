const { body, param } = require('express-validator');

const createReviewValidator = [
  body('place').isMongoId().withMessage('A valid place id is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('text')
    .trim()
    .isLength({ min: 3, max: 2000 })
    .withMessage('Review text must be between 3 and 2000 characters'),
];

const updateReviewValidator = [
  param('id').isMongoId().withMessage('Invalid review id'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('text').optional().trim().isLength({ min: 3, max: 2000 }),
];

const placeIdParamValidator = [
  param('placeId').isMongoId().withMessage('Invalid place id'),
];

const reviewIdParamValidator = [param('id').isMongoId().withMessage('Invalid review id')];

module.exports = {
  createReviewValidator,
  updateReviewValidator,
  placeIdParamValidator,
  reviewIdParamValidator,
};