const asyncHandler = require('../middleware/asyncHandler');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const { ok, fail } = require('../utils/apiResponse');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');
const { computeAvailableSlots, DAY_NAMES } = require('../utils/slotEngine');
const ClinicSettings = require('../models/ClinicSettings');

const ACTIVE_STATUSES = ['pending', 'confirmed', 'rescheduled'];

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

// @desc    Dashboard overview statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    totalPatients,
    totalDoctors,
    totalServices,
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    todayCount,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ accountStatus: 'active' }),
    Service.countDocuments({ status: 'active' }),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: 'confirmed' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Appointment.countDocuments({
      appointmentDate: { $gte: startOfToday, $lt: endOfToday },
      status: { $in: ACTIVE_STATUSES },
    }),
  ]);

  return ok(res, 'Dashboard stats fetched', {
    totalPatients,
    totalDoctors,
    totalServices,
    appointments: {
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount,
      today: todayCount,
    },
  });
});

// @desc    List all appointments, filterable by date/doctor/service/status
// @route   GET /api/admin/appointments?date=&doctorId=&serviceId=&status=
// @access  Private/Admin
const listAllAppointments = asyncHandler(async (req, res) => {
  const { date, doctorId, serviceId, status } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;
  if (serviceId) filter.service = serviceId;
  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    filter.appointmentDate = { $gte: dayStart, $lt: dayEnd };
  }

  const appointments = await Appointment.find(filter)
    .populate('doctor', 'name specialization')
    .populate('service', 'name duration price')
    .populate('patient', 'name email phone')
    .sort({ appointmentDate: 1, startTime: 1 });

  return ok(res, 'Appointments fetched', { appointments, count: appointments.length });
});

// @desc    Confirm a pending appointment
// @route   PATCH /api/admin/appointments/:id/confirm
// @access  Private/Admin
const confirmAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return fail(res, 404, 'Appointment not found');
  if (appointment.status !== 'pending') {
    return fail(res, 400, `Only pending appointments can be confirmed (current status: ${appointment.status})`);
  }

  appointment.status = 'confirmed';
  appointment.statusHistory.push({ status: 'confirmed', changedBy: req.user._id });
  await appointment.save();

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Appointment confirmed — ${emailPayload.bookingReference}`,
    html: templates.appointmentConfirmed(emailPayload),
  });

  return ok(res, 'Appointment confirmed successfully', { appointment });
});

// @desc    Reject a pending appointment
// @route   PATCH /api/admin/appointments/:id/reject
// @access  Private/Admin
const rejectAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return fail(res, 404, 'Appointment not found');
  if (appointment.status !== 'pending') {
    return fail(res, 400, `Only pending appointments can be rejected (current status: ${appointment.status})`);
  }

  appointment.status = 'rejected';
  appointment.cancellationReason = req.body.reason || 'Rejected by clinic';
  appointment.statusHistory.push({
    status: 'rejected',
    changedBy: req.user._id,
    note: appointment.cancellationReason,
  });
  await appointment.save();

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Update on your appointment request — ${emailPayload.bookingReference}`,
    html: templates.appointmentRejected(emailPayload),
  });

  return ok(res, 'Appointment rejected', { appointment });
});

// @desc    Reschedule an appointment to a new date/time
// @route   PATCH /api/admin/appointments/:id/reschedule
// @access  Private/Admin
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { date, startTime } = req.body;
  const appointment = await Appointment.findById(req.params.id).populate('doctor').populate('service');
  if (!appointment) return fail(res, 404, 'Appointment not found');

  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    return fail(res, 400, `Appointments with status "${appointment.status}" cannot be rescheduled`);
  }

  const requestedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(requestedDate.getTime())) {
    return fail(res, 400, 'Invalid date format, expected YYYY-MM-DD');
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (requestedDate < startOfToday) {
    return fail(res, 400, 'Cannot reschedule to a date in the past');
  }

  const settings = await ClinicSettings.getSingleton();
  const dayName = DAY_NAMES[requestedDate.getDay()];
  const daySettings = settings.workingHours.find((d) => d.day === dayName);

  const dayStart = new Date(requestedDate);
  const dayEnd = new Date(requestedDate);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await Appointment.find({
    doctor: appointment.doctor._id,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ACTIVE_STATUSES },
    _id: { $ne: appointment._id },
  }).select('startTime');

  const validSlots = computeAvailableSlots({
    doctor: appointment.doctor,
    daySettings,
    slotDurationMinutes: settings.slotDurationMinutes,
    serviceDurationMinutes: appointment.service.duration,
    bookedStartTimes: existing.map((a) => a.startTime),
    date: requestedDate,
  });

  const chosenSlot = validSlots.find((s) => s.startTime === startTime);
  if (!chosenSlot) {
    return fail(res, 409, 'The requested new time is not available for this doctor');
  }

  appointment.appointmentDate = requestedDate;
  appointment.startTime = chosenSlot.startTime;
  appointment.endTime = chosenSlot.endTime;
  appointment.status = 'rescheduled';
  appointment.statusHistory.push({
    status: 'rescheduled',
    changedBy: req.user._id,
    note: `Rescheduled to ${date} ${chosenSlot.startTime}`,
  });
  await appointment.save();

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Appointment rescheduled — ${emailPayload.bookingReference}`,
    html: templates.appointmentRescheduled(emailPayload),
  });

  return ok(res, 'Appointment rescheduled successfully', { appointment });
});

// @desc    Cancel any appointment (admin-initiated)
// @route   PATCH /api/admin/appointments/:id/cancel
// @access  Private/Admin
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return fail(res, 404, 'Appointment not found');
  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    return fail(res, 400, `This appointment can no longer be cancelled (status: ${appointment.status})`);
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.reason || 'Cancelled by clinic';
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

  return ok(res, 'Appointment cancelled', { appointment });
});

// @desc    Mark an appointment as completed
// @route   PATCH /api/admin/appointments/:id/complete
// @access  Private/Admin
const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return fail(res, 404, 'Appointment not found');
  if (appointment.status !== 'confirmed' && appointment.status !== 'rescheduled') {
    return fail(res, 400, `Only confirmed appointments can be marked completed (current status: ${appointment.status})`);
  }

  appointment.status = 'completed';
  appointment.statusHistory.push({ status: 'completed', changedBy: req.user._id });
  await appointment.save();

  const emailPayload = await buildEmailPayload(appointment);
  await sendEmail({
    to: emailPayload.patientEmail,
    subject: `Thanks for visiting — ${emailPayload.bookingReference}`,
    html: templates.appointmentCompleted(emailPayload),
  });

  return ok(res, 'Appointment marked as completed', { appointment });
});

// @desc    List all patients with basic contact info
// @route   GET /api/admin/patients
// @access  Private/Admin
const listPatients = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const filter = { role: 'patient' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const patients = await User.find(filter).sort({ name: 1 });
  return ok(res, 'Patients fetched', { patients: patients.map((p) => p.toSafeObject()) });
});

module.exports = {
  getDashboardStats,
  listAllAppointments,
  confirmAppointment,
  rejectAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  listPatients,
};
