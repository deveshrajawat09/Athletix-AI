const mongoose = require('mongoose');

const dailyHealthMetricSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    heartRate: { type: Number, min: 0, max: 300, default: null },
    sleepDurationHours: { type: Number, min: 0, max: 24, default: null },
    steps: { type: Number, min: 0, default: null },
    waterIntakeGlasses: { type: Number, min: 0, default: null },
    weight: { type: Number, min: 0, default: null },
    calories: { type: Number, min: 0, default: null },
  },
  { timestamps: true }
);

// One metrics document per user per day.
dailyHealthMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyHealthMetric', dailyHealthMetricSchema);
