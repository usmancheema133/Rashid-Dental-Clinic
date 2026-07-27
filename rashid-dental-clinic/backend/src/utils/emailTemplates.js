const CLINIC_NAME = 'Rashid Dental Clinic';

function wrapper(title, bodyHtml) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f5; padding:24px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e3e8e6;">
      <div style="background:#1f6f5c;padding:20px 24px;">
        <h1 style="color:#ffffff;font-size:18px;margin:0;">${CLINIC_NAME}</h1>
      </div>
      <div style="padding:24px;color:#1c2b27;">
        <h2 style="font-size:16px;margin-top:0;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f4f6f5;color:#6b7a76;font-size:12px;">
        This is an automated message from ${CLINIC_NAME}. Please do not reply directly to this email.
      </div>
    </div>
  </div>`;
}

function detailsTable(appt) {
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7a76;">Booking reference</td><td style="padding:6px 0;text-align:right;"><strong>${appt.bookingReference}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7a76;">Doctor</td><td style="padding:6px 0;text-align:right;">${appt.doctorName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7a76;">Service</td><td style="padding:6px 0;text-align:right;">${appt.serviceName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7a76;">Date</td><td style="padding:6px 0;text-align:right;">${appt.dateLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7a76;">Time</td><td style="padding:6px 0;text-align:right;">${appt.startTime} - ${appt.endTime}</td></tr>
    </table>`;
}

const templates = {
  appointmentRequested: (appt) =>
    wrapper(
      'We received your appointment request',
      `<p>Hi ${appt.patientName},</p>
       <p>Thanks for booking with us. Your appointment request has been received and is <strong>pending confirmation</strong> from our team.</p>
       ${detailsTable(appt)}
       <p>We'll email you again as soon as it's confirmed.</p>`
    ),
  appointmentConfirmed: (appt) =>
    wrapper(
      'Your appointment is confirmed',
      `<p>Hi ${appt.patientName},</p>
       <p>Good news — your appointment has been <strong>confirmed</strong>.</p>
       ${detailsTable(appt)}
       <p>Please arrive 10 minutes early. If you need to cancel, you can do so from your patient dashboard.</p>`
    ),
  appointmentRejected: (appt) =>
    wrapper(
      'Update on your appointment request',
      `<p>Hi ${appt.patientName},</p>
       <p>Unfortunately we're unable to accommodate the following appointment request:</p>
       ${detailsTable(appt)}
       ${appt.cancellationReason ? `<p><strong>Reason:</strong> ${appt.cancellationReason}</p>` : ''}
       <p>Please feel free to book another slot that works for you.</p>`
    ),
  appointmentRescheduled: (appt) =>
    wrapper(
      'Your appointment has been rescheduled',
      `<p>Hi ${appt.patientName},</p>
       <p>Your appointment has been rescheduled by our clinic team. The new details are below:</p>
       ${detailsTable(appt)}
       <p>If this new time doesn't work for you, please contact us or cancel from your dashboard.</p>`
    ),
  appointmentCancelled: (appt) =>
    wrapper(
      'Your appointment has been cancelled',
      `<p>Hi ${appt.patientName},</p>
       <p>The following appointment has been cancelled:</p>
       ${detailsTable(appt)}
       ${appt.cancellationReason ? `<p><strong>Reason:</strong> ${appt.cancellationReason}</p>` : ''}
       <p>You're welcome to book a new appointment anytime.</p>`
    ),
  appointmentCompleted: (appt) =>
    wrapper(
      'Thanks for visiting us',
      `<p>Hi ${appt.patientName},</p>
       <p>Your appointment has been marked as <strong>completed</strong>. We hope everything went well.</p>
       ${detailsTable(appt)}
       <p>Thank you for choosing ${CLINIC_NAME}.</p>`
    ),
};

module.exports = templates;
