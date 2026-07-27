const mongoose = require('mongoose');

const dayHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '17:00' },
  },
  { _id: false }
);

// Singleton document — only one ClinicSettings doc should ever exist.
const clinicSettingsSchema = new mongoose.Schema(
  {
    clinicName: { type: String, default: 'Rashid Dental Clinic' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    workingHours: {
      type: [dayHoursSchema],
      default: [
        { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
        { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Saturday', isOpen: false, openTime: '09:00', closeTime: '14:00' },
      ],
    },
    slotDurationMinutes: { type: Number, default: 30 },
    onlineBookingEnabled: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);

clinicSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);
