const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Review, LocalTip, Category, User, Place, PlaceCache } = require('../models');
const { adjustKarma } = require('../services/karmaService');

const recomputePlaceRatingCache = async (placeId) => {
  const stats = await Review.aggregate([
    { $match: { place: placeId } },
    { $group: { _id: '$place', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats[0]?.avgRating || 0;
  const reviewCount = stats[0]?.count || 0;
  await Place.findByIdAndUpdate(placeId, {
    avgRating: Math.round(avgRating * 100) / 100,
    reviewCount,
  });
};

// ---------- REVIEW MODERATION ----------

const listSuspiciousReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    $expr: { $gte: [{ $size: { $ifNull: ['$extractedKeywords', []] } }, 15] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('place', 'name')
    .populate('user', 'name email');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

const purgeReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const placeId = review.place;
  await review.deleteOne();
  await recomputePlaceRatingCache(placeId);

  res.status(200).json({ success: true, message: 'Review purged by admin' });
});

// ---------- TIP MODERATION ----------

const listTipsForModeration = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status || 'flagged';

  const tips = await LocalTip.find({ status: statusFilter })
    .sort({ createdAt: -1 })
    .populate('place', 'name address')
    .populate('local', 'name email karma');

  res.status(200).json({ success: true, count: tips.length, tips });
});

const moderateTip = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const tip = await LocalTip.findById(req.params.id);
  if (!tip) throw new AppError('Tip not found', 404);

  if (action === 'approve') {
    tip.status = 'approved';
    tip.flaggedBy = [];
    await tip.save();
  } else {
    const netVotes = tip.netVotes;
    if (netVotes !== 0) {
      await adjustKarma(tip.local, -netVotes);
    }
    tip.status = 'removed';
    await tip.save();
  }

  res.status(200).json({
    success: true,
    message: `Tip ${action === 'approve' ? 'approved' : 'removed'} by admin`,
    tip,
  });
});

// ---------- CATEGORY MANAGEMENT ----------

const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;

  const existing = await Category.findOne({ name });
  if (existing) throw new AppError('A category with this name already exists', 409);

  const category = await Category.create({ name, description, icon });
  res.status(201).json({ success: true, message: 'Category created', category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const { name, description, icon, isActive } = req.body;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (icon !== undefined) category.icon = icon;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  res.status(200).json({ success: true, message: 'Category updated', category });
});

// ---------- LOCAL AREA VERIFICATION ----------
// "Local" status now lives per-area on each user (User.localAreas), not as a
// global account role, so verification works on individual area claims
// rather than on the account as a whole.

/**
 * @route   GET /api/admin/users/pending-local-areas
 * @access  Private/Admin
 * Flattens every user's unverified localAreas entries into one reviewable list.
 */
const listPendingLocalAreas = asyncHandler(async (req, res) => {
  const users = await User.find({ 'localAreas.isVerified': false }).select(
    'name email localAreas'
  );

  const pending = [];
  users.forEach((u) => {
    u.localAreas.forEach((area) => {
      if (!area.isVerified) {
        pending.push({
          userId: u._id,
          userName: u.name,
          userEmail: u.email,
          areaId: area._id,
          label: area.label,
          coordinates: area.location.coordinates,
          radiusKm: area.radiusKm,
          requestedAt: area.createdAt,
        });
      }
    });
  });

  pending.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  res.status(200).json({ success: true, count: pending.length, areas: pending });
});

/**
 * @route   PATCH /api/admin/users/:userId/local-areas/:areaId/verify
 * @access  Private/Admin
 */
const verifyLocalArea = asyncHandler(async (req, res) => {
  const { userId, areaId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const area = user.localAreas.id(areaId);
  if (!area) throw new AppError('Local area not found', 404);

  area.isVerified = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: `${user.name}'s "${area.label}" area is now verified`,
  });
});

/**
 * @route   PATCH /api/admin/users/:userId/local-areas/:areaId/reject
 * @access  Private/Admin
 */
const rejectLocalArea = asyncHandler(async (req, res) => {
  const { userId, areaId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const area = user.localAreas.id(areaId);
  if (!area) throw new AppError('Local area not found', 404);

  area.deleteOne();
  await user.save();

  res.status(200).json({ success: true, message: 'Local area request rejected and removed' });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deactivated via this endpoint', 403);
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({ success: true, message: `${user.name}'s account has been deactivated` });
});

// ---------- SYSTEM / INGESTION MONITORING ----------

const getSystemStats = asyncHandler(async (req, res) => {
  const [placeCount, reviewCount, tipCount, userCount, cacheEntries, flaggedTipCount] =
    await Promise.all([
      Place.countDocuments({ isActive: true }),
      Review.countDocuments(),
      LocalTip.countDocuments({ status: { $ne: 'removed' } }),
      User.countDocuments({ isActive: true }),
      PlaceCache.countDocuments(),
      LocalTip.countDocuments({ status: 'flagged' }),
    ]);

  const oldestCache = await PlaceCache.findOne().sort({ createdAt: 1 });
  const newestCache = await PlaceCache.findOne().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    stats: {
      places: placeCount,
      reviews: reviewCount,
      tips: tipCount,
      users: userCount,
      flaggedTipsAwaitingReview: flaggedTipCount,
      ingestionCache: {
        activeCacheEntries: cacheEntries,
        oldestEntry: oldestCache?.createdAt || null,
        newestEntry: newestCache?.createdAt || null,
      },
    },
  });
});

module.exports = {
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
};