/**
 * Generates a human-friendly, reasonably-unique booking reference,
 * e.g. RDC-8F3K2Q. Uniqueness is still enforced by the Appointment
 * model's `unique: true` constraint at the database level.
 */
function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RDC-${code}`;
}

module.exports = generateBookingReference;
