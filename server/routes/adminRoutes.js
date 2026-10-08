const express = require('express');
const {
  listSuspiciousReviews,
  purgeReview,
  listTipsForModeration,
  moderateTip,
  listAllCategories,
  createCategory,
  updateCategory,
  listPendingLocalAreas,
  verifyLocalArea,
  rejectLocalArea,
  deactivateUser,
  getSystemStats,
} = require('../controllers/adminController');

const { protect, restrictTo } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  moderateReviewValidator,
  moderateTipValidator,
  listFlaggedTipsValidator,
  createCategoryValidator,
  updateCategoryValidator,
  verifyLocalValidator,
} = require('../middleware/validators/adminValidators');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// Reviews
router.get('/reviews/flagged', listSuspiciousReviews);
router.delete('/reviews/:id', moderateReviewValidator, validateRequest, purgeReview);

// Tips
router.get('/tips', listFlaggedTipsValidator, validateRequest, listTipsForModeration);
router.patch('/tips/:id/moderate', moderateTipValidator, validateRequest, moderateTip);

// Categories
router.get('/categories', listAllCategories);
router.post('/categories', createCategoryValidator, validateRequest, createCategory);
router.patch('/categories/:id', updateCategoryValidator, validateRequest, updateCategory);

// Local AREA verification — note the path now includes both the user and
// the specific area, since verification is per-area, not per-account.
// No express-validator chain needed here: a malformed ObjectId triggers a
// Mongoose CastError, already converted to a clean 400 by errorHandler.js.
router.get('/users/pending-local-areas', listPendingLocalAreas);
router.patch('/users/:userId/local-areas/:areaId/verify', verifyLocalArea);
router.patch('/users/:userId/local-areas/:areaId/reject', rejectLocalArea);

router.patch('/users/:id/deactivate', verifyLocalValidator, validateRequest, deactivateUser);

// System stats
router.get('/system/stats', getSystemStats);

module.exports = router;