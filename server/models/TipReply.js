const mongoose = require('mongoose');

const tipReplySchema = new mongoose.Schema(
  {
    tip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LocalTip',
      required: [true, 'Reply must belong to a tip'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reply must have an author'],
    },
    // Denormalized so replies remain readable even if user is later deleted.
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
    },
    text: {
      type: String,
      required: [true, 'Reply text is required'],
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters'],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: net vote score (upvotes - downvotes).
tipReplySchema.virtual('netVotes').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

// Compound index to efficiently fetch all replies for a tip in chronological order.
tipReplySchema.index({ tip: 1, createdAt: 1 });

module.exports = mongoose.model('TipReply', tipReplySchema);
