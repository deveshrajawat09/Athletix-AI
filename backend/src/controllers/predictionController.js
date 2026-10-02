const asyncHandler = require('../utils/asyncHandler');
const { predictNextMovement, acceptPredictedPlan } = require('../services/predictionService');

// GET /api/prediction/today
const getTodayPrediction = asyncHandler(async (req, res) => {
  const prediction = await predictNextMovement(req.user._id);
  res.json(prediction);
});

// POST /api/prediction/accept
const acceptPrediction = asyncHandler(async (req, res) => {
  const result = await acceptPredictedPlan(req.user._id, req.body);
  res.status(201).json(result);
});

module.exports = {
  getTodayPrediction,
  acceptPrediction,
};
