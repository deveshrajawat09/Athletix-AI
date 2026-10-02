const Goal = require('../models/Goal');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, goals });
});

const createGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!goal) throw new AppError('Goal not found.', 404);
  res.json({ success: true, goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) throw new AppError('Goal not found.', 404);
  res.json({ success: true, message: 'Goal deleted.' });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
