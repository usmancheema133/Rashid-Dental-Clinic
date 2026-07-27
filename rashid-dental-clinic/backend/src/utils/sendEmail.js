const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      'EMAIL_USER / EMAIL_PASS not set — emails will be skipped. Set these in .env to enable Gmail SMTP.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE !== 'false',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Sends an email. Never throws — logs and resolves so that a failed
 * email never breaks the underlying appointment operation. Callers can
 * inspect the returned { sent, error } result if they want to surface it.
 */
async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    return { sent: false, error: 'Email transporter not configured' };
  }

  try {
    await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Rashid Dental Clinic'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = sendEmail;
