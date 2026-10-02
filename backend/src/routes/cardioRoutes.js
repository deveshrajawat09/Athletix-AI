const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getCardioSessions, createCardioSession, getCardioSessionById, updateCardioSession, deleteCardioSession,
} = require('../controllers/cardioController');

const router = express.Router();
router.use(protect);

router.get('/', getCardioSessions);
router.post('/', createCardioSession);
router.get('/:id', getCardioSessionById);
router.put('/:id', updateCardioSession);
router.delete('/:id', deleteCardioSession);

module.exports = router;
