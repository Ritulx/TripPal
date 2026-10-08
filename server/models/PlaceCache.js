const mongoose = require('mongoose');

const placeCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  gridLat: Number,
  gridLng: Number,
  radiusBucketKm: Number,
  categorySlug: {
    type: String,
    default: 'all',
  },
  placesIngested: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // MongoDB automatically deletes documents once `expiresAt` is in the past,
  // because of the TTL index below. This is what implements the 7-day cache
  // window from SRS Mitigation R-01 without needing Redis.
  expiresAt: {
    type: Date,
    required: true,
  },
});

placeCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PlaceCache', placeCacheSchema);