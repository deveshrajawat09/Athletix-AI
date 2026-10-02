const express = require('express');
const { protect } = require('../middleware/auth');
const { getToday, getSummary, getProgress, getDailyProgress } = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect);

router.get('/today', getToday);
router.get('/summary', getSummary);
router.get('/progress/daily', getDailyProgress); // before /progress so it isn't shadowed
router.get('/progress', getProgress);

module.exports = router;
