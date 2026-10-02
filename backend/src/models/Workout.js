const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    workoutName: { type: String, required: true, trim: true },
    muscleGroup: {
      type: String,
      enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'other'],
      required: true,
    },
    estimatedDurationMinutes: { type: Number, min: 0 },
    actualDurationMinutes: { type: Number, min: 0 },
    status: { type: String, enum: ['planned', 'in_progress', 'completed', 'skipped'], default: 'planned' },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
