const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ok, created, fail } = require('../utils/apiResponse');

// @desc    Register a new patient account
// @route   POST /api/auth/register
// @access  Public
// Note: public registration always creates a "patient" role account.
// Admin accounts are provisioned via the seed script / directly in the DB,
// never through this open endpoint.
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return fail(res, 409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, phone, password, role: 'patient' });
  const token = generateToken(user);

  return created(res, 'Account created successfully', {
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Log in (patient or admin — role comes from the stored user record)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return fail(res, 401, 'Invalid email or password');
  }

  if (user.accountStatus !== 'active') {
    return fail(res, 403, 'Your account is not active. Please contact the clinic.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return fail(res, 401, 'Invalid email or password');
  }

  const token = generateToken(user);

  return ok(res, 'Logged in successfully', {
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return ok(res, 'Current user fetched', { user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
