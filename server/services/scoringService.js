/**
 * TripPal Local Preference Score
 *
 * Simple, deterministic formula that rewards places locals genuinely prefer —
 * i.e. places with a good rating AND a meaningful number of reviews.
 *
 *   score = (avgRating × reviewCount) / (reviewCount + 10)
 *
 * Properties:
 *  - No reviews → score approaches 0 (untested place floats to bottom)
 *  - Many reviews + high rating → score approaches avgRating (max 5)
 *  - The constant 10 is the "minimum sample" anchor: a place needs ~10+
 *    reviews before its raw rating is trusted at face value.
 *  - Keyword searches do NOT change the score — it is stable and glitch-free.
 */

const REVIEW_ANCHOR = 10; // how many reviews before rating is fully trusted

/**
 * Compute the Local Preference Score for a place.
 *
 * @param {number} avgRating  - average star rating (0–5)
 * @param {number} reviewCount - total number of reviews
 * @returns {number} score in [0, 5], rounded to 2 decimal places
 */
const computeLocalScore = (avgRating = 0, reviewCount = 0) => {
  const R = Math.max(0, Math.min(5, avgRating || 0));
  const v = Math.max(0, reviewCount || 0);
  const raw = (R * v) / (v + REVIEW_ANCHOR);
  return Math.round(raw * 100) / 100;
};

module.exports = { computeLocalScore };