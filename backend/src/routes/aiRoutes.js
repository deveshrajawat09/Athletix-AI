const express = require('express');
const { protect } = require('../middleware/auth');
const { chat, voice, dailyBriefing } = require('../controllers/aiController');

const router = express.Router();
router.use(protect);

router.post('/chat', chat);
router.post('/voice', voice);
router.get('/daily-briefing', dailyBriefing);

module.exports = router;
