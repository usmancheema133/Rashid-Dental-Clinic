const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'rejected',
  'rescheduled',
  'cancelled',
  'completed',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPOINTMENT_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    appointmentDate: {
      // stored as a normalized midnight-UTC Date representing the calendar day
      type: Date,
      required: true,
    },
    startTime: {
      // "HH:mm" 24hr
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'pending',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);

// A doctor cannot have two active (non-cancelled/rejected) appointments
// in the same date + startTime slot. Enforced here via index + also
// re-checked in the controller inside the booking transaction.
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'rescheduled'] },
    },
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
