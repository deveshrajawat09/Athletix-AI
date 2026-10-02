const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    intent: {
      type: String,
      enum: [
        'GET_TODAY_PLAN', 'GET_PAST_ACTIVITY', 'GET_PENDING_TASKS', 'GET_HEALTH_SUMMARY',
        'GET_PROGRESS', 'GET_LAST_WORKOUT', 'START_WORKOUT', 'SAVE_WORKOUT', 'SAVE_SET',
        'SAVE_CARDIO', 'GET_NEXT_WORKOUT', 'DAILY_SUMMARY', 'UPDATE_GOAL', 'UNKNOWN',
      ],
      default: 'UNKNOWN',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

aiConversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
