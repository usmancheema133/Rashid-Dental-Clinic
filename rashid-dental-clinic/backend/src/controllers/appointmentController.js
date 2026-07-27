const asyncHandler = require('../middleware/asyncHandler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const ClinicSettings = require('../models/ClinicSettings');
const { ok, created, fail } = require('../utils/apiResponse');
const generateBookingReference = require('../utils/bookingReference');
const { computeAvailableSlots, DAY_NAMES } = require('../utils/slotEngine');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

const formatDateLabel = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

async function buildEmailPayload(appointment) {
  await appointment.populate('patient doctor service');
  return {
    patientName: appointment.patient.name,
    doctorName: appointment.doctor.name,
    serviceName: appointment.service.name,
    dateLabel: formatDateLabel(appointment.appointmentDate),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    bookingReference: appointment.bookingReference,
    cancellationReason: appointment.cancellationReason,
    patientEmail: appointment.patient.email,
  };
}

// @desc    Submit a new appointment request
// @route   POST /api/appointments
// @access  Private/Patient
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, serviceId, date, startTime, reason } = req.body;

  const requestedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(requestedDate.getTime())) {
    return fail(res, 400, 'Invalid date format, expected YYYY-MM-DD');
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (requestedDate < startOfToday) {
    return fail(res, 400, 'You cannot book an appointment in the past');
  }

  const [doctor, service, settings] = await Promise.all([
    Doctor.findById(doctorId),
    Service.findById(serviceId),
    ClinicSettings.getSingleton(),
  ]);

  if (!doctor || doctor.accountStatus !== 'active') {
    return fail(res, 404, 'Doctor not found or not currently accepting appointments');
  }
  if (!service || service.status !== 'active') {
    return fail(res, 404, 'Service not found or not currently offered');
  }
  if (!settings.onlineBookingEnabled) {
    return fail(res, 403, 'Online booking is currently disabled. Please contact the clinic.');
  }

  // Re-verify the requested slot is genuinely still open (defends against
  // race conditions between the availability check and this submission).
  const dayName = DAY_NAMES[requestedDate.getDay()];
  const daySettings = settings.workingHours.find((d) => d.day === dayName);

  const dayStart = new Date(requestedDate);
  const dayEnd = new Date(requestedDate);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ACTIVE_STATUSES },
  }).select('startTime');

  const validSlots = computeAvailableSlots({
    doctor,
    daySettings,
    slotDurationMinutes: settings.slotDurationMinutes,
    serviceDurationMinutes: service.duration,
    bookedStartTimes: existing.map((a) => a.startTime),
    date: requestedDate,
  });

  const chosenSlot = validSlots.find((s) => s.startTime === startTime);
  if (!chosenSlot) {
    return fail(
      res,
      409,
      'The selected time slot is no longer available. Please choose a different time.'
    );
  }

  // Attempt creation, retrying the reference a couple of times on the very
  // unlikely chance of a random-code collision.
  let appointment;
  for (let attempt = 0; attempt < 3 && !appointment; attempt += 1) {
    try {
      appointment = await Appointment.create({
        bookingReference: generateBookingReference(),
        patient: req.user._id,
        doctor: doctorId,
        service: serviceId,
        appointmentDate: requestedDate,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        status: 'pending',
        reason: reason || '',
        statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Appointment requested by patient' }],
      });
    } catch (error) {
      if (error.code === 11000 && attempt < 2) continue; // retry on collision
      throw error;
    }
  }

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Appointment request received — ${emailPayload.bookingReference}`,
    html: templates.appointmentRequested(emailPayload),
  });

  return created(res, 'Appointment request submitted successfully', { appointment });
});

// @desc    Get my own appointments (optionally filtered by status)
// @route   GET /api/appointments/my?status=
// @access  Private/Patient
const getMyAppointments = asyncHandler(async (req, res) => {
  const filter = { patient: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'name specialization')
    .populate('service', 'name duration price')
    .sort({ appointmentDate: -1, startTime: -1 });

  return ok(res, 'Appointments fetched', { appointments });
});

// @desc    Get a single appointment (must belong to the requesting patient, or be an admin)
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('doctor', 'name specialization profileImage')
    .populate('service', 'name duration price')
    .populate('patient', 'name email phone');

  if (!appointment) return fail(res, 404, 'Appointment not found');

  const isOwner = appointment.patient._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return fail(res, 403, 'You do not have permission to view this appointment');
  }

  return ok(res, 'Appointment fetched', { appointment });
});

// @desc    Cancel my own appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private/Patient
const cancelMyAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return fail(res, 404, 'Appointment not found');

  if (appointment.patient.toString() !== req.user._id.toString()) {
    return fail(res, 403, 'You can only cancel your own appointments');
  }

  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    return fail(res, 400, `This appointment can no longer be cancelled (status: ${appointment.status})`);
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.cancellationReason || 'Cancelled by patient';
  appointment.statusHistory.push({
    status: 'cancelled',
    changedBy: req.user._id,
    note: appointment.cancellationReason,
  });
  await appointment.save();

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Appointment cancelled — ${emailPayload.bookingReference}`,
    html: templates.appointmentCancelled(emailPayload),
  });

  return ok(res, 'Appointment cancelled successfully', { appointment });
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelMyAppointment,
};
