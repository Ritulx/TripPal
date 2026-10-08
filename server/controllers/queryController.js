const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { TouristQuery, QueryReply, Place } = require('../models');
const { haversineDistanceKm } = require('../utils/geoUtils');

const hasVerifiedLocalAccess = (user, placeCoords) => {
  if (!placeCoords) return false;
  return (user.localAreas || []).some(
    (area) =>
      area.isVerified &&
      area.location?.coordinates &&
      haversineDistanceKm(area.location.coordinates, placeCoords) <= area.radiusKm
  );
};

// GET /api/queries/place/:placeId
const getQueries = asyncHandler(async (req, res) => {
  const queries = await TouristQuery.find({ place: req.params.placeId })
    .sort({ createdAt: -1 })
    .populate('tourist', 'name')
    .populate({
      path: 'replies',
      populate: { path: 'local', select: 'name karma' }
    });

  res.status(200).json({
    success: true,
    count: queries.length,
    queries,
  });
});

// POST /api/queries/place/:placeId
const createQuery = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new AppError('Query text is required', 400);
  }

  const place = await Place.findById(req.params.placeId);
  if (!place) throw new AppError('Place not found', 404);

  const query = await TouristQuery.create({
    place: req.params.placeId,
    tourist: req.user._id,
    text,
  });

  await query.populate('tourist', 'name');

  // Trigger notifications for locals in this area
  const { Notification, User } = require('../models');
  
  // Find all verified locals
  const allVerifiedUsers = await User.find({ 'localAreas.isVerified': true });
  
  // Filter eligible locals
  const eligibleLocals = allVerifiedUsers.filter(u => 
    u._id.toString() !== req.user._id.toString() && 
    hasVerifiedLocalAccess(u, place.location.coordinates)
  );

  if (eligibleLocals.length > 0) {
    const notifications = eligibleLocals.map(u => ({
      recipient: u._id,
      type: 'NEW_QUERY',
      message: `${req.user.name} asked about ${place.name}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
      link: `/places/${place._id}`,
    }));
    await Notification.insertMany(notifications);
  }

  res.status(201).json({
    success: true,
    query: { ...query.toObject(), replies: [] },
  });
});

// POST /api/queries/:queryId/replies
const replyToQuery = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new AppError('Reply text is required', 400);
  }

  const query = await TouristQuery.findById(req.params.queryId).populate('place');
  if (!query) throw new AppError('Query not found', 404);

  const place = query.place;
  if (req.user.role !== 'admin' && !hasVerifiedLocalAccess(req.user, place.location.coordinates)) {
    throw new AppError('Only verified locals can reply to this query.', 403);
  }

  const reply = await QueryReply.create({
    query: query._id,
    local: req.user._id,
    text,
  });

  await reply.populate('local', 'name karma');

  res.status(201).json({
    success: true,
    reply,
  });
});

// DELETE /api/queries/:queryId
const deleteQuery = asyncHandler(async (req, res) => {
  const query = await TouristQuery.findById(req.params.queryId);
  if (!query) throw new AppError('Query not found', 404);

  if (query.tourist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  await query.deleteOne(); // query replies will be orphaned, ideally we cascade delete but this is fine for now

  res.status(200).json({ success: true, message: 'Query deleted' });
});

module.exports = {
  getQueries,
  createQuery,
  replyToQuery,
  deleteQuery,
};
