const asyncHandler = require('../middleware/asyncHandler');
const Doctor = require('../models/Doctor');
const { ok, created, fail } = require('../utils/apiResponse');

// @desc    List all active doctors (public directory)
// @route   GET /api/doctors
// @access  Public
const listDoctors = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { accountStatus: 'active' };
  const doctors = await Doctor.find(filter).sort({ name: 1 });
  return ok(res, 'Doctors fetched', { doctors });
});

// @desc    Get a single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return fail(res, 404, 'Doctor not found');
  return ok(res, 'Doctor fetched', { doctor });
});

// @desc    Create a doctor
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.body);
  return created(res, 'Doctor added successfully', { doctor });
});

// @desc    Update a doctor
// @route   PATCH /api/doctors/:id
// @access  Private/Admin
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) return fail(res, 404, 'Doctor not found');
  return ok(res, 'Doctor updated successfully', { doctor });
});

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) return fail(res, 404, 'Doctor not found');
  return ok(res, 'Doctor removed successfully');
});

module.exports = { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor };
