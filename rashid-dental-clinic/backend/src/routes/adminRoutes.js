const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  listAllAppointments,
  confirmAppointment,
  rejectAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  listPatients,
} = require('../controllers/adminController');

const router = express.Router();

// Every route in this file is admin-only.
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/appointments', listAllAppointments);
router.patch('/appointments/:id/confirm', confirmAppointment);
router.patch('/appointments/:id/reject', rejectAppointment);
router.patch(
  '/appointments/:id/reschedule',
  [
    body('date').notEmpty().withMessage('date is required (YYYY-MM-DD)'),
    body('startTime')
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('startTime is required in HH:mm format'),
  ],
  validate,
  rescheduleAppointment
);
router.patch('/appointments/:id/cancel', cancelAppointment);
router.patch('/appointments/:id/complete', completeAppointment);
router.get('/patients', listPatients);

module.exports = router;
