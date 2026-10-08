const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Place, LocalTip } = require('../models');
const { adjustKarma } = require('../services/karmaService');
const { haversineDistanceKm } = require('../utils/geoUtils');
const { extractKeywords } = require('../utils/keywordTokenizer');

const FLAG_THRESHOLD = 3;

const mergeAggregatedTags = async (placeId, newTags) => {
  if (!newTags || newTags.length === 0) return;
  const place = await Place.findById(placeId).select('aggregatedTags');
  if (!place) return;
  const merged = Array.from(new Set([...(place.aggregatedTags || []), ...newTags])).slice(0, 300);
  await Place.findByIdAndUpdate(placeId, { aggregatedTags: merged });
};

/**
 * Checks whether a user has a VERIFIED local area covering the given place's
 * coordinates. Replaces the old global role==='local' + isVerifiedLocal
 * check — "local" status is now per-area, not per-account, so a user with a
 * verified area in Ranchi has no standing to post tips in Delhi.
 */
const hasVerifiedLocalAccess = (user, placeCoords) => {
  if (!placeCoords) return false;
  return (user.localAreas || []).some(
    (area) =>
      area.isVerified &&
      area.location?.coordinates &&
      haversineDistanceKm(area.location.coordinates, placeCoords) <= area.radiusKm
  );
};

/**
 * @route   POST /api/tips
 * @access  Private (any authenticated user, gated by place-scoped local status)
 */
const createTip = asyncHandler(async (req, res) => {
  const { place, tipText, categoryTag } = req.body;

  const placeDoc = await Place.findOne({ _id: place, isActive: true });
  if (!placeDoc) throw new AppError('Place not found', 404);

  if (req.user.role !== 'admin' && !hasVerifiedLocalAccess(req.user, placeDoc.location.coordinates)) {
    throw new AppError(
      "You're not a verified local near this place yet. Claim this area from the place page to request verification.",
      403
    );
  }

  // Auto-extract keywords from the tip text — locals don't need to type tags manually.
  const autoTags = extractKeywords(tipText);

  const tip = await LocalTip.create({
    place,
    local: req.user._id,
    tipText,
    tags: autoTags,
    categoryTag: categoryTag || '',
    status: 'approved',
  });

  await mergeAggregatedTags(place, autoTags);

  res.status(201).json({ success: true, message: 'Tip submitted', tip });
});

/**
 * @route   GET /api/tips/place/:placeId?status=approved
 * @access  Public
 */
const getTipsForPlace = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status || 'approved';

  const tips = await LocalTip.find({ place: req.params.placeId, status: statusFilter })
    .sort({ createdAt: -1 })
    .populate('local', 'name karma');

  const sorted = [...tips].sort((a, b) => b.netVotes - a.netVotes);

  res.status(200).json({ success: true, count: sorted.length, tips: sorted });
});

/**
 * @route   PATCH /api/tips/:id
 * @access  Private (owner or admin)
 */
const updateTip = asyncHandler(async (req, res) => {
  const tip = await LocalTip.findById(req.params.id);
  if (!tip) throw new AppError('Tip not found', 404);

  if (String(tip.local) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not authorized to edit this tip', 403);
  }

  const { tipText, categoryTag } = req.body;
  if (tipText !== undefined) {
    tip.tipText = tipText;
    // Re-extract keywords whenever the tip text changes.
    const autoTags = extractKeywords(tipText);
    tip.tags = autoTags;
    await mergeAggregatedTags(tip.place, autoTags);
  }
  if (categoryTag !== undefined) tip.categoryTag = categoryTag;

  await tip.save();

  res.status(200).json({ success: true, message: 'Tip updated', tip });
});

/**
 * @route   DELETE /api/tips/:id
 * @access  Private (owner or admin)
 */
const deleteTip = asyncHandler(async (req, res) => {
  const tip = await LocalTip.findById(req.params.id);
  if (!tip) throw new AppError('Tip not found', 404);

  if (String(tip.local) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this tip', 403);
  }

  const netVotes = tip.netVotes;
  if (netVotes !== 0) {
    await adjustKarma(tip.local, -netVotes);
  }

  await tip.deleteOne();

  res.status(200).json({ success: true, message: 'Tip deleted' });
});

/**
 * @route   PATCH /api/tips/:id/vote   body: { direction: 'up' | 'down' }
 * @access  Private
 */
const voteTip = asyncHandler(async (req, res) => {
  const { direction } = req.body;
  const userId = req.user._id;

  const tip = await LocalTip.findById(req.params.id);
  if (!tip) throw new AppError('Tip not found', 404);

  if (String(tip.local) === String(userId)) {
    throw new AppError('You cannot vote on your own tip', 400);
  }

  const beforeNet = tip.netVotes;

  const hasUpvoted = tip.upvotes.some((id) => String(id) === String(userId));
  const hasDownvoted = tip.downvotes.some((id) => String(id) === String(userId));

  const removeVote = (arr) => arr.filter((id) => String(id) !== String(userId));

  if (direction === 'up') {
    if (hasUpvoted) {
      tip.upvotes = removeVote(tip.upvotes);
    } else {
      tip.upvotes = [...removeVote(tip.upvotes), userId];
      tip.downvotes = removeVote(tip.downvotes);
    }
  } else {
    if (hasDownvoted) {
      tip.downvotes = removeVote(tip.downvotes);
    } else {
      tip.downvotes = [...removeVote(tip.downvotes), userId];
      tip.upvotes = removeVote(tip.upvotes);
    }
  }

  await tip.save();

  const afterNet = tip.netVotes;
  const delta = afterNet - beforeNet;
  await adjustKarma(tip.local, delta);

  res.status(200).json({
    success: true,
    message: 'Vote registered',
    netVotes: tip.netVotes,
    userVote: tip.upvotes.some((id) => String(id) === String(userId))
      ? 'up'
      : tip.downvotes.some((id) => String(id) === String(userId))
      ? 'down'
      : null,
  });
});

/**
 * @route   PATCH /api/tips/:id/flag
 * @access  Private
 */
const flagTip = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tip = await LocalTip.findById(req.params.id);
  if (!tip) throw new AppError('Tip not found', 404);

  const alreadyFlagged = tip.flaggedBy.some((id) => String(id) === String(userId));
  if (alreadyFlagged) {
    throw new AppError('You have already flagged this tip', 409);
  }

  tip.flaggedBy.push(userId);

  if (tip.flaggedBy.length >= FLAG_THRESHOLD && tip.status === 'approved') {
    tip.status = 'flagged';
  }

  await tip.save();

  res.status(200).json({
    success: true,
    message: tip.status === 'flagged' ? 'Tip flagged and sent for admin review' : 'Tip flagged',
    flagCount: tip.flagCount,
    status: tip.status,
  });
});

/**
 * @route   GET /api/tips/mine
 * @access  Private
 */
const getMyTips = asyncHandler(async (req, res) => {
  const tips = await LocalTip.find({ local: req.user._id, status: { $ne: 'removed' } })
    .sort({ createdAt: -1 })
    .populate('place', 'name address');
  res.status(200).json({ success: true, count: tips.length, tips });
});

module.exports = {
  createTip,
  getTipsForPlace,
  updateTip,
  deleteTip,
  voteTip,
  flagTip,
  getMyTips,
};