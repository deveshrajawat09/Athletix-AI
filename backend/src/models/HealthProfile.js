const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    age: { type: Number, min: 5, max: 120 },
    height: { type: Number, min: 50, max: 260 }, // cm
    weight: { type: Number, min: 20, max: 400 }, // kg
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness', 'strength', 'maintenance'],
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    },
    preferredWorkoutDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    preferredWorkoutTime: { type: String }, // e.g. "06:30"
    fitnessExperience: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    healthNotes: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } }
);

// General informational BMI only — never treated as a diagnosis.
healthProfileSchema.virtual('bmi').get(function computeBmi() {
  if (!this.height || !this.weight) return null;
  const heightM = this.height / 100;
  return Number((this.weight / (heightM * heightM)).toFixed(1));
});

healthProfileSchema.set('toJSON', { virtuals: true });
healthProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
