const mongoose = require('mongoose');

const queryReplySchema = new mongoose.Schema(
  {
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TouristQuery',
      required: [true, 'Reply must belong to a query'],
    },
    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reply must have an author'],
    },
    text: {
      type: String,
      required: [true, 'Reply text is required'],
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

queryReplySchema.index({ query: 1, createdAt: 1 });

module.exports = mongoose.model('QueryReply', queryReplySchema);
