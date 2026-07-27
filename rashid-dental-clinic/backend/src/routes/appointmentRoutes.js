const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelMyAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('patient'),
  [
    body('doctorId').notEmpty().withMessage('doctorId is required'),
    body('serviceId').notEmpty().withMessage('serviceId is required'),
    body('date').notEmpty().withMessage('date is required (YYYY-MM-DD)'),
    body('startTime')
      .matches(/^\d{2}:\d{2}$/)
      .withMessage('startTime is required in HH:mm format'),
    body('reason').optional().isLength({ max: 300 }).withMessage('Reason must be under 300 characters'),
  ],
  validate,
  createAppointment
);

router.get('/my', authorize('patient'), getMyAppointments);
router.get('/:id', getAppointmentById); // ownership/admin check happens in controller
router.patch('/:id/cancel', authorize('patient'), cancelMyAppointment);

module.exports = router;
