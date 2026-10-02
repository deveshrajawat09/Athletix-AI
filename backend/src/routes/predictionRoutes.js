const express = require('express');
const { protect } = require('../middleware/auth');
const { getTodayPrediction, acceptPrediction } = require('../controllers/predictionController');

const router = express.Router();

router.use(protect);

router.get('/today', getTodayPrediction);
router.post('/accept', acceptPrediction);

module.exports = router;
