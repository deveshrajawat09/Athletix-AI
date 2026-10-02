const HealthProfile = require('../models/HealthProfile');
const DailyHealthMetric = require('../models/DailyHealthMetric');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/health/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await HealthProfile.findOne({ userId: req.user._id });
  res.json({ success: true, profile: profile || null });
});

// POST /api/health/profile (create if none exists)
const createProfile = asyncHandler(async (req, res) => {
  const existing = await HealthProfile.findOne({ userId: req.user._id });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Profile already exists. Use PUT to update.' });
  }
  const profile = await HealthProfile.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, profile });
});

// PUT /api/health/profile
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await HealthProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, profile });
});

// POST /api/health/metrics (upsert today's or a given date's metrics)
const saveMetrics = asyncHandler(async (req, res) => {
  const { date, ...rest } = req.body;
  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);

  const metric = await DailyHealthMetric.findOneAndUpdate(
    { userId: req.user._id, date: day },
    { $set: rest },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, metric });
});

// GET /api/health/metrics?from=&to=
const getMetrics = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = { userId: req.user._id };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const metrics = await DailyHealthMetric.find(query).sort({ date: -1 });
  res.json({ success: true, metrics });
});

module.exports = { getProfile, createProfile, updateProfile, saveMetrics, getMetrics };
