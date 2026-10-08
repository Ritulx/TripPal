const { User } = require('../models');

/**
 * Adjusts a user's cached karma by a delta (positive or negative).
 * Called whenever a vote changes the net-vote count on one of their tips.
 * Karma is clamped at a minimum of 0 — a tip getting heavily downvoted
 * shouldn't be able to push a user's karma into negative territory.
 */
const adjustKarma = async (userId, delta) => {
  if (!userId || delta === 0) return;

  const user = await User.findById(userId);
  if (!user) return;

  user.karma = Math.max(0, (user.karma || 0) + delta);
  await user.save();
};

module.exports = { adjustKarma };