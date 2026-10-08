const { Review, LocalTip } = require('../models');

/**
 * For a batch of place ids and an optional search keyword, returns a map:
 * {
 *   [placeId]: {
 *     totalReviews, positiveMatchedReviews,   // feeds WR & K_matched/K_total (Step 6)
 *     totalTips, matchedTipCount, matchedTipsNetVotes  // feeds N_tips boost (Step 6)
 *   }
 * }
 * Runs as two aggregation pipelines (not N+1 queries) regardless of how many
 * places are in the result set — this keeps search latency flat as results grow.
 */
const getPlaceSignals = async (placeIds, keyword) => {
  const signals = {};
  placeIds.forEach((id) => {
    signals[id.toString()] = {
      totalReviews: 0,
      positiveMatchedReviews: 0,
      totalTips: 0,
      matchedTipCount: 0,
      matchedTipsNetVotes: 0,
    };
  });

  const reviewAgg = await Review.aggregate([
    { $match: { place: { $in: placeIds } } },
    {
      $group: {
        _id: '$place',
        totalReviews: { $sum: 1 },
        positiveMatchedReviews: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isPositive', true] },
                  keyword
                    ? { $regexMatch: { input: '$text', regex: keyword, options: 'i' } }
                    : false,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  reviewAgg.forEach((r) => {
    const key = r._id.toString();
    if (signals[key]) {
      signals[key].totalReviews = r.totalReviews;
      signals[key].positiveMatchedReviews = r.positiveMatchedReviews;
    }
  });

  const tipAgg = await LocalTip.aggregate([
    { $match: { place: { $in: placeIds }, status: 'approved' } },
    {
      $addFields: {
        netVotes: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] },
        matchesKeyword: keyword
          ? {
              $or: [
                { $regexMatch: { input: '$tipText', regex: keyword, options: 'i' } },
                {
                  $anyElementTrue: {
                    $map: {
                      input: '$tags',
                      as: 'tag',
                      in: { $regexMatch: { input: '$$tag', regex: keyword, options: 'i' } },
                    },
                  },
                },
              ],
            }
          : false,
      },
    },
    {
      $group: {
        _id: '$place',
        totalTips: { $sum: 1 },
        matchedTipCount: { $sum: { $cond: ['$matchesKeyword', 1, 0] } },
        matchedTipsNetVotes: {
          $sum: { $cond: ['$matchesKeyword', { $max: ['$netVotes', 0] }, 0] },
        },
      },
    },
  ]);

  tipAgg.forEach((t) => {
    const key = t._id.toString();
    if (signals[key]) {
      signals[key].totalTips = t.totalTips;
      signals[key].matchedTipCount = t.matchedTipCount;
      signals[key].matchedTipsNetVotes = t.matchedTipsNetVotes;
    }
  });

  return signals;
};

module.exports = { getPlaceSignals };