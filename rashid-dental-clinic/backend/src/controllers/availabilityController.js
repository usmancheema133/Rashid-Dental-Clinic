const asyncHandler = require('../middleware/asyncHandler');
const ClinicSettings = require('../models/ClinicSettings');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const { ok, fail } = require('../utils/apiResponse');
const { computeAvailableSlots, DAY_NAMES } = require('../utils/slotEngine');

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

// @desc    Get clinic working hours / booking settings
// @route   GET /api/availability/settings
// @access  Public
const getClinicSettings = asyncHandler(async (req, res) => {
  const settings = await ClinicSettings.getSingleton();
  return ok(res, 'Clinic settings fetched', { settings });
});

// @desc    Update clinic working hours / booking settings
// @route   PATCH /api/availability/settings
// @access  Private/Admin
const updateClinicSettings = asyncHandler(async (req, res) => {
  const settings = await ClinicSettings.getSingleton();

  const editableFields = [
    'clinicName',
    'address',
    'phone',
    'email',
    'workingHours',
    'slotDurationMinutes',
    'onlineBookingEnabled',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  await settings.save();
  return ok(res, 'Clinic settings updated successfully', { settings });
});

// @desc    Get available appointment slots for a doctor on a given date
// @route   GET /api/availability/slots?doctorId=&date=YYYY-MM-DD&serviceId=
// @access  Public
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date, serviceId } = req.query;

  if (!doctorId || !date) {
    return fail(res, 400, 'doctorId and date query parameters are required');
  }

  const requestedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(requestedDate.getTime())) {
    return fail(res, 400, 'Invalid date format, expected YYYY-MM-DD');
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (requestedDate < startOfToday) {
    return fail(res, 400, 'Cannot check availability for a past date');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor || doctor.accountStatus !== 'active') {
    return fail(res, 404, 'Doctor not found or not currently accepting appointments');
  }

  const settings = await ClinicSettings.getSingleton();
  const dayName = DAY_NAMES[requestedDate.getDay()];
  const daySettings = settings.workingHours.find((d) => d.day === dayName);

  let serviceDuration = settings.slotDurationMinutes;
  if (serviceId) {
    const service = await Service.findById(serviceId);
    if (!service) return fail(res, 404, 'Service not found');
    serviceDuration = service.duration;
  }

  const dayStart = new Date(requestedDate);
  const dayEnd = new Date(requestedDate);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ACTIVE_STATUSES },
  }).select('startTime');

  const slots = computeAvailableSlots({
    doctor,
    daySettings,
    slotDurationMinutes: settings.slotDurationMinutes,
    serviceDurationMinutes: serviceDuration,
    bookedStartTimes: existing.map((a) => a.startTime),
    date: requestedDate,
  });

  return ok(res, 'Available slots fetched', { date, doctorId, slots });
});

module.exports = { getClinicSettings, updateClinicSettings, getAvailableSlots };
