const mongoose = require('mongoose');

const searchQuerySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // allows anonymous/guest searches to be logged too
    },
    radius: {
      type: Number,
      required: [true, 'Search radius is required'],
      min: [0.5, 'Radius must be at least 0.5 km'],
      max: [40, 'Radius cannot exceed 40 km'], // hard cap per SRS FR-01 / 3.5 constraints
    },
    keyword: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    // GeoJSON Point — the origin location the search was run from.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Search origin coordinates are required'],
      },
    },
    resultCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

searchQuerySchema.index({ location: '2dsphere' });
searchQuerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchQuery', searchQuerySchema);