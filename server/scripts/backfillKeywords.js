// Run with: node scripts/backfillKeywords.js
// Re-tokenizes every existing Review that has empty extractedKeywords,
// then re-merges tags onto each affected Place.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Review } = require('../models');
const { extractKeywords } = require('../utils/keywordTokenizer');
const { mergeTagsIntoPlace, recalculatePlaceRatingStats } = require('../services/placeTagService');

const run = async () => {
  await connectDB();

  try {
    const staleReviews = await Review.find({
      $or: [{ extractedKeywords: { $size: 0 } }, { extractedKeywords: { $exists: false } }],
    });

    console.log(`Found ${staleReviews.length} review(s) needing keyword backfill.\n`);

    const affectedPlaceIds = new Set();

    for (const review of staleReviews) {
      const keywords = extractKeywords(review.text);
      review.extractedKeywords = keywords;
      await review.save();

      if (keywords.length > 0) {
        await mergeTagsIntoPlace(review.place, keywords);
      }
      affectedPlaceIds.add(review.place.toString());
      console.log(`  ✔ Backfilled review ${review._id} (${keywords.length} tokens)`);
    }

    console.log(`\nRecalculating rating stats for ${affectedPlaceIds.size} affected place(s)...`);
    for (const placeId of affectedPlaceIds) {
      await recalculatePlaceRatingStats(placeId);
    }

    console.log('\n✅ Backfill complete.');
  } catch (err) {
    console.error('❌ Backfill failed:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();