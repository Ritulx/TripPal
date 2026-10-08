const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  getMe,
  updatePreferences,
  updateHomeLocation,
  getSearchHistory,
  addLocalArea,
  removeLocalArea,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  registerValidator,
  loginValidator,
  updatePreferencesValidator,
  addLocalAreaValidator,
  localAreaIdValidator,
} = require('../middleware/validators/authValidators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

router.post('/register', authLimiter, registerValidator, validateRequest, register);
router.post('/login', authLimiter, loginValidator, validateRequest, login);
router.get('/search-history', protect, getSearchHistory);
router.get('/me', protect, getMe);
router.patch('/preferences', protect, updatePreferencesValidator, validateRequest, updatePreferences);
router.patch('/home-location', protect, updateHomeLocation);

router.post('/local-areas', protect, addLocalAreaValidator, validateRequest, addLocalArea);
router.delete('/local-areas/:areaId', protect, localAreaIdValidator, validateRequest, removeLocalArea);

module.exports = router;