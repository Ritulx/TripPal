const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'A review must belong to a place'],
    },
    // Optional — reviews ingested from Google Maps won't map to a TripPal User account.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      // Used when the review is sourced externally (Google) and has no linked User.
      type: String,
      trim: true,
      default: 'Anonymous',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review text cannot exceed 2000 characters'],
      default: '',
    },
    // Tokens extracted from `text` via regex (Step 5) — e.g. ["fresh", "lilies", "seafood"].
    // This is the non-AI substitute for the SRS's NLP keyword extraction.
    extractedKeywords: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['user'], // all reviews are now first-party, submitted by TripPal users (Step 5)
      default: 'user',
    },
    // Only positive-sentiment reviews should count toward keyword match scoring
    // (mitigates SRS Risk R-04 — keyword stuffing). Positive = rating >= 4.
    isPositive: {
      type: Boolean,
      default: function () {
        return this.rating >= 4;
      },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ place: 1, createdAt: -1 });
reviewSchema.index({ extractedKeywords: 1 });
reviewSchema.index({ text: 'text' });

module.exports = mongoose.model('Review', reviewSchema);