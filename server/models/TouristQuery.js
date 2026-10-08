const mongoose = require('mongoose');

const touristQuerySchema = new mongoose.Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'Query must belong to a place'],
    },
    tourist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Query must have an author'],
    },
    text: {
      type: String,
      required: [true, 'Query text is required'],
      trim: true,
      maxlength: [500, 'Query cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

touristQuerySchema.virtual('replies', {
  ref: 'QueryReply',
  foreignField: 'query',
  localField: '_id',
});

touristQuerySchema.index({ place: 1, createdAt: -1 });

module.exports = mongoose.model('TouristQuery', touristQuerySchema);
