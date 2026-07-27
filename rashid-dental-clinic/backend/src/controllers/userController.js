const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const { ok, fail } = require('../utils/apiResponse');

// @desc    Get my own profile
// @route   GET /api/users/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  return ok(res, 'Profile fetched', { user: req.user.toSafeObject() });
});

// @desc    Update my own profile (name / phone only — email and role are locked)
// @route   PATCH /api/users/me
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;

  await req.user.save();

  return ok(res, 'Profile updated successfully', { user: req.user.toSafeObject() });
});

// @desc    Change my own password
// @route   PATCH /api/users/me/password
// @access  Private
const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return fail(res, 401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return ok(res, 'Password updated successfully');
});

module.exports = { getMyProfile, updateMyProfile, changeMyPassword };
