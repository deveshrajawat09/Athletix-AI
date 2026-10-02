const mongoose = require('mongoose');

const cardioSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    activityType: { type: String, enum: ['running', 'walking', 'cycling', 'jogging', 'other'], required: true },
    distanceKm: { type: Number, min: 0 },
    durationMinutes: { type: Number, min: 0 },
    calories: { type: Number, min: 0 },
    averageHeartRate: { type: Number, min: 0 },
    notes: { type: String, maxlength: 500 },
    status: { type: String, enum: ['planned', 'completed', 'skipped'], default: 'planned' },
  },
  { timestamps: true }
);

// Pace (min/km) and speed (km/h) are derived, not stored, so they never go stale
// relative to distance/duration. Handles missing/zero values safely.
cardioSessionSchema.virtual('paceMinPerKm').get(function getPace() {
  if (!this.distanceKm || !this.durationMinutes || this.distanceKm <= 0) return null;
  return Number((this.durationMinutes / this.distanceKm).toFixed(2));
});

cardioSessionSchema.virtual('speedKmH').get(function getSpeed() {
  if (!this.distanceKm || !this.durationMinutes || this.durationMinutes <= 0) return null;
  return Number((this.distanceKm / (this.durationMinutes / 60)).toFixed(2));
});

cardioSessionSchema.set('toJSON', { virtuals: true });
cardioSessionSchema.set('toObject', { virtuals: true });
cardioSessionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CardioSession', cardioSessionSchema);
