const express = require('express');
// mergeParams: true exposes :tipId from the parent router (server.js mount).
const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');
const {
  createReply,
  getReplies,
  deleteReply,
  voteReply,
} = require('../controllers/tipReplyController');

// POST   /api/tips/:tipId/replies          — create a reply (auth required)
// GET    /api/tips/:tipId/replies          — list replies for a tip (public)
router.route('/').post(protect, createReply).get(getReplies);

// DELETE /api/tips/:tipId/replies/:replyId — delete a reply (owner or admin)
router.route('/:replyId').delete(protect, deleteReply);

// PATCH  /api/tips/:tipId/replies/:replyId/vote — up/down vote toggle (auth required)
router.route('/:replyId/vote').patch(protect, voteReply);

module.exports = router;
