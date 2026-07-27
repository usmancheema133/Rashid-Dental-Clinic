const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Builds the list of candidate start times (as "HH:mm") for a given
 * doctor + clinic day config + requested service duration, then removes
 * any that are already booked or that fall in the past for today's date.
 *
 * @param {Object} params
 * @param {Object} params.doctor - Doctor mongoose document
 * @param {Object} params.daySettings - { isOpen, openTime, closeTime } from ClinicSettings for the requested day
 * @param {number} params.slotDurationMinutes - base clinic slot size
 * @param {number} params.serviceDurationMinutes - duration of the selected service (defaults to slot size)
 * @param {string[]} params.bookedStartTimes - "HH:mm" strings already taken for that doctor/date
 * @param {Date} params.date - the requested calendar date
 */
function computeAvailableSlots({
  doctor,
  daySettings,
  slotDurationMinutes,
  serviceDurationMinutes,
  bookedStartTimes,
  date,
}) {
  const dayName = DAY_NAMES[date.getDay()];

  if (!daySettings || !daySettings.isOpen) return [];
  if (doctor.availableDays.length > 0 && !doctor.availableDays.includes(dayName)) return [];

  // Intersect clinic hours with doctor's own working hours for that day.
  const clinicStart = timeToMinutes(daySettings.openTime);
  const clinicEnd = timeToMinutes(daySettings.closeTime);
  const doctorStart = timeToMinutes(doctor.workingHours?.start || daySettings.openTime);
  const doctorEnd = timeToMinutes(doctor.workingHours?.end || daySettings.closeTime);

  const windowStart = Math.max(clinicStart, doctorStart);
  const windowEnd = Math.min(clinicEnd, doctorEnd);

  const step = slotDurationMinutes;
  const duration = serviceDurationMinutes || slotDurationMinutes;

  const bookedSet = new Set(bookedStartTimes);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let start = windowStart; start + duration <= windowEnd; start += step) {
    if (isToday && start <= nowMinutes) continue; // no booking in the past, including "today, earlier today"
    const startStr = minutesToTime(start);
    if (bookedSet.has(startStr)) continue;
    slots.push({ startTime: startStr, endTime: minutesToTime(start + duration) });
  }

  return slots;
}

module.exports = { computeAvailableSlots, timeToMinutes, minutesToTime, DAY_NAMES };
