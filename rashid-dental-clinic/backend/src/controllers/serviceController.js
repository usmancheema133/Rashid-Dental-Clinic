const asyncHandler = require('../middleware/asyncHandler');
const Service = require('../models/Service');
const { ok, created, fail } = require('../utils/apiResponse');

// @desc    List all active services
// @route   GET /api/services
// @access  Public
const listServices = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { status: 'active' };
  const services = await Service.find(filter).sort({ name: 1 });
  return ok(res, 'Services fetched', { services });
});

// @desc    Get a single service
// @route   GET /api/services/:id
// @access  Public
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return fail(res, 404, 'Service not found');
  return ok(res, 'Service fetched', { service });
});

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  return created(res, 'Service added successfully', { service });
});

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private/Admin
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) return fail(res, 404, 'Service not found');
  return ok(res, 'Service updated successfully', { service });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return fail(res, 404, 'Service not found');
  return ok(res, 'Service removed successfully');
});

module.exports = { listServices, getService, createService, updateService, deleteService };
