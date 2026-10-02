const CardioSession = require('../models/CardioSession');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/cardio?from=&to=
const getCardioSessions = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = { userId: req.user._id };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const sessions = await CardioSession.find(query).sort({ date: -1 });
  res.json({ success: true, sessions });
});

// POST /api/cardio
const createCardioSession = asyncHandler(async (req, res) => {
  const session = await CardioSession.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, session });
});

// GET /api/cardio/:id
const getCardioSessionById = asyncHandler(async (req, res) => {
  const session = await CardioSession.findOne({ _id: req.params.id, userId: req.user._id });
  if (!session) throw new AppError('Cardio session not found.', 404);
  res.json({ success: true, session });
});

// PUT /api/cardio/:id
const updateCardioSession = asyncHandler(async (req, res) => {
  const session = await CardioSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!session) throw new AppError('Cardio session not found.', 404);
  res.json({ success: true, session });
});

// DELETE /api/cardio/:id
const deleteCardioSession = asyncHandler(async (req, res) => {
  const session = await CardioSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!session) throw new AppError('Cardio session not found.', 404);
  res.json({ success: true, message: 'Cardio session deleted.' });
});

module.exports = {
  getCardioSessions, createCardioSession, getCardioSessionById, updateCardioSession, deleteCardioSession,
};
