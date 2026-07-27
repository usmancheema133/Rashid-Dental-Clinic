const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');
const { fail } = require('../utils/apiResponse');

/**
 * Verifies the Bearer JWT and attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return fail(res, 401, 'Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return fail(res, 401, 'Not authorized — user no longer exists');
    }

    if (user.accountStatus !== 'active') {
      return fail(res, 403, 'Your account is not active. Please contact the clinic.');
    }

    req.user = user;
    next();
  } catch (error) {
    return fail(res, 401, 'Not authorized — invalid or expired token');
  }
});

/**
 * Restricts a route to the given roles, e.g. authorize('admin').
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return fail(res, 403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { protect, authorize };
