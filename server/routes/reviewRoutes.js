const express = require('express');
const {
  createReview,
  getReviewsForPlace,
  updateReview,
  deleteReview,
  getMyReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  createReviewValidator,
  updateReviewValidator,
  placeIdParamValidator,
  reviewIdParamValidator,
} = require('../middleware/validators/reviewValidators');

const router = express.Router();

router.post('/', protect, createReviewValidator, validateRequest, createReview);
router.get('/mine', protect, getMyReviews);
router.get('/place/:placeId', placeIdParamValidator, validateRequest, getReviewsForPlace);
router.patch('/:id', protect, updateReviewValidator, validateRequest, updateReview);
router.delete('/:id', protect, reviewIdParamValidator, validateRequest, deleteReview);

module.exports = router;