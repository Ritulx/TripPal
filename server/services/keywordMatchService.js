const { Review } = require('../models');
const { splitIntoSentences, buildKeywordRegex } = require('../utils/keywordTokenizer');

/**
 * For ONE place and ONE search keyword, computes:
 *   kMatched — count of POSITIVE review SENTENCES mentioning the keyword
 *   kTotal   — total number of parsed reviews for the place
 *   matchedSnippets — up to 3 example sentences, for UI display ("why this ranked")
 *
 * This directly implements the K_matched / K_total inputs to the SRS's
 * S_final formula (Step 6).
 */
const computeKeywordRelevanceForPlace = async (placeId, keyword) => {
  const reviews = await Review.find({ place: placeId }).select('text isPositive rating');

  const kTotal = reviews.length;

  if (!keyword || !keyword.trim() || kTotal === 0) {
    return { kMatched: 0, kTotal, matchedSnippets: [] };
  }

  const regex = buildKeywordRegex(keyword);
  let kMatched = 0;
  const matchedSnippets = [];

  for (const review of reviews) {
    if (!review.isPositive) continue; // mitigates keyword stuffing per SRS R-04

    const sentences = splitIntoSentences(review.text);
    for (const sentence of sentences) {
      if (regex.test(sentence)) {
        kMatched += 1;
        if (matchedSnippets.length < 3) {
          matchedSnippets.push(sentence);
        }
      }
    }
  }

  return { kMatched, kTotal, matchedSnippets };
};

/**
 * Batch version — computes keyword relevance for MANY places at once,
 * avoiding an N+1 query pattern when scoring a full search results page.
 * Returns a Map keyed by placeId string -> { kMatched, kTotal, matchedSnippets }.
 */
const batchComputeKeywordRelevance = async (placeIds, keyword) => {
  const resultMap = new Map();

  if (!keyword || !keyword.trim()) {
    // Still need kTotal per place even with no keyword (used by Step 6's WR formula).
    const counts = await Review.aggregate([
      { $match: { place: { $in: placeIds } } },
      { $group: { _id: '$place', kTotal: { $sum: 1 } } },
    ]);
    counts.forEach((c) => {
      resultMap.set(c._id.toString(), { kMatched: 0, kTotal: c.kTotal, matchedSnippets: [] });
    });
    placeIds.forEach((id) => {
      if (!resultMap.has(id.toString())) {
        resultMap.set(id.toString(), { kMatched: 0, kTotal: 0, matchedSnippets: [] });
      }
    });
    return resultMap;
  }

  const regex = buildKeywordRegex(keyword);

  const allReviews = await Review.find({ place: { $in: placeIds } }).select(
    'place text isPositive'
  );

  // Initialize every requested place, even ones with zero reviews.
  placeIds.forEach((id) => {
    resultMap.set(id.toString(), { kMatched: 0, kTotal: 0, matchedSnippets: [] });
  });

  for (const review of allReviews) {
    const key = review.place.toString();
    const entry = resultMap.get(key);
    if (!entry) continue;

    entry.kTotal += 1;

    if (!review.isPositive) continue;

    const sentences = splitIntoSentences(review.text);
    for (const sentence of sentences) {
      if (regex.test(sentence)) {
        entry.kMatched += 1;
        if (entry.matchedSnippets.length < 3) {
          entry.matchedSnippets.push(sentence);
        }
      }
    }
  }

  return resultMap;
};

module.exports = { computeKeywordRelevanceForPlace, batchComputeKeywordRelevance };