const mongoose = require('mongoose');

const dailyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    plannedWorkout: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', default: null },
    plannedCardio: { type: mongoose.Schema.Types.ObjectId, ref: 'CardioSession', default: null },
    completedTasks: [{ type: String }],
    pendingTasks: [{ type: String }],
  },
  { timestamps: true }
);

dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyPlan', dailyPlanSchema);
