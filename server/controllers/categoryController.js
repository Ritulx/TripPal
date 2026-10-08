const { asyncHandler } = require('../middleware/errorHandler');
const { Category } = require('../models');

/**
 * @route   GET /api/categories
 * @access  Public
 */
const listActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, count: categories.length, categories });
});

module.exports = { listActiveCategories };