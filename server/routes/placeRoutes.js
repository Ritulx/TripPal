const express = require('express');
const {
  searchNearby,
  getPlaceById,
  getScoreBreakdown,
  searchLocations,
} = require('../controllers/placeController');
const { optionalAuth } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  searchNearbyValidator,
  placeIdValidator,
} = require('../middleware/validators/placeValidators');

const router = express.Router();

// Registered FIRST as a literal two-segment path, so it isn't shadowed by
// the "/:id/score-breakdown" pattern registered below (Express matches
// routes in registration order, not by specificity).
router.get('/geocode/search', searchLocations);

router.get('/search', optionalAuth, searchNearbyValidator, validateRequest, searchNearby);
router.get('/:id/score-breakdown', placeIdValidator, validateRequest, getScoreBreakdown);
router.get('/:id', placeIdValidator, validateRequest, getPlaceById);

module.exports = router;