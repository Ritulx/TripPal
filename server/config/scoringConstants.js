// Defaults taken directly from SRS §4.2 "Mathematical Ranking Algorithm Specification"
module.exports = {
  MIN_REVIEW_THRESHOLD_M: 25,      // m — minimum review threshold for a "dependable" sample
  DEFAULT_MEAN_RATING_C: 3.8,      // C — fallback mean rating when category has no data yet
  KEYWORD_WEIGHT_ALPHA: 0.5,       // α — keyword relevance scaling factor
  LOCAL_TIP_BOOST_BETA: 0.1,       // β — local tip boost constant
  MAX_TIPS_COUNTED: 5,             // cap on N_tips contribution, per SRS formula
};