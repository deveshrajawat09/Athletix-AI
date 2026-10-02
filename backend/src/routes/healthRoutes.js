const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getProfile, createProfile, updateProfile, saveMetrics, getMetrics,
} = require('../controllers/healthController');

const router = express.Router();
router.use(protect);

router.get('/profile', getProfile);
router.post('/profile', createProfile);
router.put('/profile', updateProfile);
router.post('/metrics', saveMetrics);
router.get('/metrics', getMetrics);

module.exports = router;
