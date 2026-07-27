const { fail } = require('../utils/apiResponse');

// 404 handler — placed after all routes.
const notFound = (req, res, next) => {
  fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

// Generic error handler — placed last. Formats Mongoose validation/cast
// errors and duplicate-key errors into the project's standard response shape.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.message || 'Server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'doctor' || err.message.includes('doctor_1_appointmentDate_1_startTime_1')) {
      message = 'This doctor already has an appointment at the selected date and time';
    } else {
      message = `Duplicate value for field: ${field || 'unknown'}`;
    }
  }

  fail(res, statusCode, message);
};

module.exports = { notFound, errorHandler };
