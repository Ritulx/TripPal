const {
  MIN_REVIEW_THRESHOLD_M,
  DEFAULT_MEAN_RATING_C,
  KEYWORD_WEIGHT_ALPHA,
  LOCAL_TIP_BOOST_BETA,
  MAX_TIPS_COUNTED,
} = require('../config/scoringConstants');

/**
 * Bayesian Weighted Rating (WR) — SRS §4.2 Formula 1.
 * WR = (v / (v+m)) * R + (m / (v+m)) * C
 *
 * @param {number} v - number of reviews for the place
 * @param {number} R - average star rating of the place (1.0–5.0)
 * @param {number} m - minimum review threshold (default 25)
 * @param {number} C - mean rating across the category (default 3.8)
 */
const computeWR = (v, R, m = MIN_REVIEW_THRESHOLD_M, C = DEFAULT_MEAN_RATING_C) => {
  const safeV = Math.max(0, v || 0);
  const safeR = Math.max(0, Math.min(5, R || 0));
  return (safeV / (safeV + m)) * safeR + (m / (safeV + m)) * C;
};

/**
 * Final TripPal Composite Score (S_final) — SRS §4.2 Formula 2.
 * S_final = WR * (1 + α * (K_matched / (K_total + 1))) + β * min(N_tips, 5)
 */
const computeSFinal = ({
  WR,
  kMatched = 0,
  kTotal = 0,
  nTips = 0,
  alpha = KEYWORD_WEIGHT_ALPHA,
  beta = LOCAL_TIP_BOOST_BETA,
}) => {
  const keywordMultiplier = 1 + alpha * (kMatched / (kTotal + 1));
  const tipBonus = beta * Math.min(nTips, MAX_TIPS_COUNTED);
  return WR * keywordMultiplier + tipBonus;
};

module.exports = { computeWR, computeSFinal };