const mongoose = require('mongoose');

const localTipSchema = new mongoose.Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'A tip must be linked to a place'],
    },
    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A tip must have an author'],
    },
    tipText: {
      type: String,
      required: [true, 'Tip text is required'],
      trim: true,
      maxlength: [255, 'Tip text cannot exceed 255 characters'],
    },
    tags: {
      type: [String],
      default: [],
    },
    categoryTag: {
      type: String,
      trim: true,
      default: '',
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    downvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    flaggedBy: {
      // distinct users who have flagged this tip — prevents one user
      // spamming flags to force auto-moderation
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'removed'],
      default: 'approved',
    },
  },
  { timestamps: true }
);

localTipSchema.index({ place: 1, status: 1, createdAt: -1 });
localTipSchema.index({ tags: 'text', tipText: 'text' });
localTipSchema.index({ local: 1 });

localTipSchema.virtual('netVotes').get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

localTipSchema.virtual('flagCount').get(function () {
  return this.flaggedBy?.length || 0;
});

localTipSchema.set('toJSON', { virtuals: true });
localTipSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LocalTip', localTipSchema);