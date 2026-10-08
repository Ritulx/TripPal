const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('./errorHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized — no token provided', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists', 401);
  }

  if (!currentUser.isActive) {
    throw new AppError('This account has been deactivated', 403);
  }

  req.user = currentUser;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    req.user = currentUser && currentUser.isActive ? currentUser : null;
  } catch (err) {
    req.user = null;
  }

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Not authorized — no user context', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied — requires one of the following roles: ${roles.join(', ')}`,
        403
      );
    }
    next();
  };
};

// requireVerifiedLocal has been removed. "Local" status is now scoped to a
// specific place/area, not the account as a whole, so it can't be checked
// generically at the route level anymore — the check now lives inside
// tipController.createTip, where the target place's coordinates are known.

module.exports = { protect, optionalAuth, restrictTo };