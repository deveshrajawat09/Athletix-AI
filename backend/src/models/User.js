const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    googleAuth: {
      connected: { type: Boolean, default: false },
      googleId: { type: String, default: null, index: true, sparse: true },
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      expiryDate: { type: Date, default: null },
      scope: { type: String, default: null },
      lastFitSyncAt: { type: Date, default: null },
    },
    automationPreferences: {
      autoFitSync: { type: Boolean, default: true },
      autoCalendarSync: { type: Boolean, default: true },
      emailWorkoutSummary: { type: Boolean, default: true },
      emailDailyBriefing: { type: Boolean, default: true },
      notificationEmail: { type: String, default: null },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Hash password before saving, only if it was modified
userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    googleAuth: {
      connected: !!this.googleAuth?.connected,
      lastFitSyncAt: this.googleAuth?.lastFitSyncAt,
    },
    automationPreferences: this.automationPreferences || {
      autoFitSync: true,
      autoCalendarSync: true,
      emailWorkoutSummary: true,
      emailDailyBriefing: true,
      notificationEmail: this.email,
    },
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
