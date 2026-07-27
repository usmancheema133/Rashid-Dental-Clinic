const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getClinicSettings,
  updateClinicSettings,
  getAvailableSlots,
} = require('../controllers/availabilityController');

const router = express.Router();

router.get('/settings', getClinicSettings);
router.patch('/settings', protect, authorize('admin'), updateClinicSettings);
router.get('/slots', getAvailableSlots);

module.exports = router;
