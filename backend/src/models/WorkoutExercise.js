const mongoose = require('mongoose');

const setSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weight: { type: Number, min: 0 }, // kg
    reps: { type: Number, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true, index: true },
    exerciseName: { type: String, required: true, trim: true },
    sets: [setSchema],
    durationSeconds: { type: Number, min: 0 },
    notes: { type: String, maxlength: 500 },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutExercise', workoutExerciseSchema);
