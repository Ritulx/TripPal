const { asyncHandler, AppError } = require('../middleware/errorHandler');
const TipReply = require('../models/TipReply');

// POST /api/tips/:tipId/replies — create a reply (protected)
const createReply = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw new AppError('Reply text is required', 400);
  }

  const reply = await TipReply.create({
    tip: req.params.tipId,
    author: req.user._id,
    authorName: req.user.name,
    text,
  });

  res.status(201).json({
    success: true,
    reply,
  });
});

// GET /api/tips/:tipId/replies — fetch all replies for a tip (public)
const getReplies = asyncHandler(async (req, res) => {
  const replies = await TipReply.find({ tip: req.params.tipId })
    .sort({ createdAt: 1 })
    .populate('author', 'name');

  res.status(200).json({
    success: true,
    count: replies.length,
    replies,
  });
});

// DELETE /api/tips/:tipId/replies/:replyId — delete a reply (owner or admin)
const deleteReply = asyncHandler(async (req, res) => {
  const reply = await TipReply.findById(req.params.replyId);

  if (!reply) {
    throw new AppError('Reply not found', 404);
  }

  // Ensure the reply belongs to the requested tip.
  if (reply.tip.toString() !== req.params.tipId) {
    throw new AppError('Reply does not belong to this tip', 400);
  }

  const isOwner = reply.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized to delete this reply', 403);
  }

  await reply.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Reply deleted',
  });
});

// PATCH /api/tips/:tipId/replies/:replyId/vote — toggle upvote/downvote (protected)
const voteReply = asyncHandler(async (req, res) => {
  const { direction } = req.body;

  if (!['up', 'down'].includes(direction)) {
    throw new AppError("Vote direction must be 'up' or 'down'", 400);
  }

  const reply = await TipReply.findById(req.params.replyId);

  if (!reply) {
    throw new AppError('Reply not found', 404);
  }

  // Authors cannot vote on their own replies.
  if (reply.author.toString() === req.user._id.toString()) {
    throw new AppError('You cannot vote on your own reply', 403);
  }

  const userId = req.user._id.toString();

  const alreadyUpvoted = reply.upvotes.some((id) => id.toString() === userId);
  const alreadyDownvoted = reply.downvotes.some((id) => id.toString() === userId);

  if (direction === 'up') {
    if (alreadyUpvoted) {
      // Toggle off: remove existing upvote.
      reply.upvotes = reply.upvotes.filter((id) => id.toString() !== userId);
    } else {
      // Add upvote and remove any downvote.
      reply.upvotes.push(req.user._id);
      reply.downvotes = reply.downvotes.filter((id) => id.toString() !== userId);
    }
  } else {
    if (alreadyDownvoted) {
      // Toggle off: remove existing downvote.
      reply.downvotes = reply.downvotes.filter((id) => id.toString() !== userId);
    } else {
      // Add downvote and remove any upvote.
      reply.downvotes.push(req.user._id);
      reply.upvotes = reply.upvotes.filter((id) => id.toString() !== userId);
    }
  }

  await reply.save();

  // Recalculate user's current vote state after save.
  const userVote = reply.upvotes.some((id) => id.toString() === userId)
    ? 'up'
    : reply.downvotes.some((id) => id.toString() === userId)
    ? 'down'
    : null;

  res.status(200).json({
    success: true,
    netVotes: reply.netVotes,
    userVote,
  });
});

module.exports = { createReply, getReplies, deleteReply, voteReply };
