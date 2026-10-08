const { Place } = require('../models');

const MAX_AGGREGATED_TAGS = 100; // keeps the array bounded for performance

/**
 * Merges new keyword tokens into a Place's aggregatedTags array, deduplicated,
 * capped at MAX_AGGREGATED_TAGS (oldest tags dropped first via FIFO trim).
 */
const mergeTagsIntoPlace = async (placeId, newTags = []) => {
  if (!newTags.length) return;

  const place = await Place.findById(placeId).select('aggregatedTags');
  if (!place) return;

  const merged = Array.from(new Set([...place.aggregatedTags, ...newTags]));
  const trimmed = merged.slice(-MAX_AGGREGATED_TAGS); // keep most recent tags if over cap

  await Place.findByIdAndUpdate(placeId, { aggregatedTags: trimmed });
};

/**
 * Recalculates a Place's cached avgRating and reviewCount from its actual
 * Review documents. Called whenever a review is added/edited/deleted so
 * the denormalized fields (used heavily by Step 6's WR formula) stay accurate.
 */
const recalculatePlaceRatingStats = async (placeId) => {
  const stats = await require('../models').Review.aggregate([
    { $match: { place: placeId } },
    {
      $group: {
        _id: '$place',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const reviewCount = stats.length ? stats[0].reviewCount : 0;

  await Place.findByIdAndUpdate(placeId, { avgRating, reviewCount });

  return { avgRating, reviewCount };
};

module.exports = { mergeTagsIntoPlace, recalculatePlaceRatingStats, MAX_AGGREGATED_TAGS };