const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalType: {
      type: String,
      enum: ['run_distance', 'workouts_per_week', 'daily_steps', 'daily_water', 'weight_target', 'consistency'],
      required: true,
    },
    target: { type: Number, required: true },
    currentProgress: { type: Number, default: 0 },
    unit: { type: String }, // e.g. "km", "sessions", "steps", "glasses", "kg"
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
