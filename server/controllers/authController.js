const { asyncHandler, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const { SearchQuery } = require('../models');
const generateToken = require('../utils/generateToken');

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, homeLocation, preferences } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // role is always 'user' at registration — never trust a client-supplied
  // role, and there is no tourist/local distinction to pick anymore.
  const userData = { name, email, password, role: 'user' };

  if (homeLocation?.coordinates) {
    userData.homeLocation = { type: 'Point', coordinates: homeLocation.coordinates };
  }

  if (Array.isArray(preferences)) {
    userData.preferences = preferences;
  }

  const user = await User.create(userData);
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user,
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Contact support.', 403);
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user,
  });
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

/**
 * @route   PATCH /api/auth/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferences },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Preferences updated', user });
});

/**
 * @route   PATCH /api/auth/home-location
 * @access  Private
 */
const updateHomeLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new AppError('coordinates must be an array of [longitude, latitude]', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { homeLocation: { type: 'Point', coordinates } },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Home location updated', user });
});

/**
 * @route   GET /api/auth/search-history
 * @access  Private
 */
const getSearchHistory = asyncHandler(async (req, res) => {
  const history = await SearchQuery.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('category', 'name');
  res.status(200).json({ success: true, history });
});

/**
 * @route   POST /api/auth/local-areas   body: { label, coordinates: [lng,lat], radiusKm }
 * @access  Private
 * Lets a user declare themselves local to a specific place/area. Starts
 * unverified — an admin must approve it before tips can be posted anywhere
 * inside this area's radius. A user can have multiple areas, each judged
 * independently; being verified in one area never grants access elsewhere.
 */
const addLocalArea = asyncHandler(async (req, res) => {
  const { label, coordinates, radiusKm } = req.body;

  const user = await User.findById(req.user._id);
  user.localAreas.push({
    label,
    location: { type: 'Point', coordinates },
    radiusKm,
    isVerified: false,
  });
  await user.save();

  res.status(201).json({ success: true, message: 'Local area submitted for verification', user });
});

/**
 * @route   DELETE /api/auth/local-areas/:areaId
 * @access  Private
 */
const removeLocalArea = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const area = user.localAreas.id(req.params.areaId);
  if (!area) throw new AppError('Local area not found', 404);

  area.deleteOne();
  await user.save();

  res.status(200).json({ success: true, message: 'Local area removed', user });
});

module.exports = {
  register,
  login,
  getMe,
  updatePreferences,
  updateHomeLocation,
  getSearchHistory,
  addLocalArea,
  removeLocalArea,
};