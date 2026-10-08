const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Place, Review } = require('../models');
const { extractKeyPhrases } = require('../services/keywordEngine');

/** Recomputes the denormalized avgRating/reviewCount cache on a Place after any review change. */
const mongoose = require('mongoose'); // Make sure mongoose is required at the top of reviewController.js

/** Recomputes the denormalized avgRating/reviewCount cache on a Place after any review change. */
const recomputePlaceRatingCache = async (placeId) => {
  const stats = await Review.aggregate([
    { $match: { place: new mongoose.Types.ObjectId(placeId) } }, // ✅ Explicitly cast to ObjectId
    { $group: { _id: '$place', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats[0]?.avgRating || 0;
  const reviewCount = stats[0]?.count || 0;

  await Place.findByIdAndUpdate(placeId, {
    avgRating: Math.round(avgRating * 100) / 100,
    reviewCount,
  });
};

/** Merges newly extracted keywords into the Place's searchable aggregatedTags array. */
const mergeAggregatedTags = async (placeId, newTags) => {
  const place = await Place.findById(placeId).select('aggregatedTags');
  if (!place) return;
  const merged = Array.from(new Set([...(place.aggregatedTags || []), ...newTags])).slice(0, 300);
  await Place.findByIdAndUpdate(placeId, { aggregatedTags: merged });
};

/**
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { place, rating, text } = req.body;

  const placeDoc = await Place.findOne({ _id: place, isActive: true });
  if (!placeDoc) {
    throw new AppError('Place not found', 404);
  }

  const existing = await Review.findOne({ place, user: req.user._id });
  if (existing) {
    throw new AppError(
      'You have already reviewed this place. Edit your existing review instead.',
      409
    );
  }

  const extractedKeywords = extractKeyPhrases(text);

  const review = await Review.create({
    place,
    user: req.user._id,
    authorName: req.user.name,
    rating,
    text,
    extractedKeywords,
    source: 'user',
  });

  await recomputePlaceRatingCache(place);
  await mergeAggregatedTags(place, extractedKeywords);

  res.status(201).json({ success: true, message: 'Review submitted', review });
});

/**
 * @route   GET /api/reviews/place/:placeId
 * @access  Public
 */
const getReviewsForPlace = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  const [reviews, total] = await Promise.all([
    Review.find({ place: req.params.placeId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name'),
    Review.countDocuments({ place: req.params.placeId }),
  ]);

  res.status(200).json({ success: true, count: reviews.length, total, page, reviews });
});

/**
 * @route   PATCH /api/reviews/:id
 * @access  Private (owner or admin)
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not authorized to edit this review', 403);
  }

  const { rating, text } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (text !== undefined) {
    review.text = text;
    review.extractedKeywords = extractKeyPhrases(text);
  }
  review.isPositive = review.rating >= 4;

  await review.save();
  await recomputePlaceRatingCache(review.place);
  if (text !== undefined) await mergeAggregatedTags(review.place, review.extractedKeywords);

  res.status(200).json({ success: true, message: 'Review updated', review });
});

/**
 * @route   DELETE /api/reviews/:id
 * @access  Private (owner or admin)
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this review', 403);
  }

  const placeId = review.place;
  await review.deleteOne();
  await recomputePlaceRatingCache(placeId);

  res.status(200).json({ success: true, message: 'Review deleted' });
});
/**
 * @route   GET /api/reviews/mine
 * @access  Private
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('place', 'name address');
  res.status(200).json({ success: true, count: reviews.length, reviews });
});
module.exports = { createReview, getReviewsForPlace, updateReview, deleteReview, getMyReviews};