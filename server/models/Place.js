const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
      maxlength: [100, 'Place name cannot exceed 100 characters'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    // GeoJSON Point — REQUIRED for 2dsphere radius queries in Step 4.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Invalid coordinates — must be [longitude, latitude]',
        },
      },
    },
    // Denormalized cache fields — updated whenever a Review is added/edited (Step 5/6).
    avgRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Structured searchable tags, e.g. ["fresh lilies", "seafood", "authentic dosas"]
    // Populated from LocalTip tags and Review extractedKeywords (Step 5/7).
    aggregatedTags: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['geoapify', 'manual', 'crowdsourced'],
      default: 'geoapify',
    },
    externalId: {
      // Geoapify's place_id — unique external reference, used for upserts.
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true, // false = admin-purged / delisted
    },
  },
  { timestamps: true }
);

// CRITICAL: 2dsphere index enables $geoWithin / $near radius queries (up to 40km per SRS FR-01).
placeSchema.index({ location: '2dsphere' });

// Text index across name + aggregatedTags for MongoDB's native text search scoring (Step 5).
placeSchema.index({ name: 'text', aggregatedTags: 'text', address: 'text' });

// Compound index to speed up "places in category X near Y" queries.
placeSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Place', placeSchema);