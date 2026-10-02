const cron = require('node-cron');
const User = require('../models/User');
const Workout = require('../models/Workout');
const { syncGoogleFitData } = require('./googleFitService');
const { syncWorkoutToGoogleCalendar } = require('./googleCalendarService');
const { sendWorkoutSummaryEmail, sendDailyBriefingEmail } = require('./emailService');

class AthletixAgentService {
  constructor() {
    this.cronJobs = [];
    this.isRunning = false;
  }

  /**
   * Start the background agent worker and cron schedules
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[AgentService] 🤖 Athletix Background Automation Agent initialized.');

    // 1. Google Fit Auto-Sync: Runs every 15 minutes (or on interval)
    const fitSyncJob = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('[AgentService] 🔄 Running scheduled Google Fit real-time step sync...');
        const users = await User.find({ 'automationPreferences.autoFitSync': true });
        for (const user of users) {
          try {
            await syncGoogleFitData(user._id);
          } catch (e) {
            console.warn(`[AgentService] Step sync failed for user ${user._id}: ${e.message}`);
          }
        }
      } catch (err) {
        console.error('[AgentService] Fit sync job error:', err.message);
      }
    });
    this.cronJobs.push(fitSyncJob);

    // 2. Morning Daily Briefing Dispatch: Runs at 07:00 AM daily
    const morningBriefingJob = cron.schedule('0 7 * * *', async () => {
      try {
        console.log('[AgentService] 🌅 Dispatching morning briefing emails...');
        const users = await User.find({ 'automationPreferences.emailDailyBriefing': true });
        for (const user of users) {
          try {
            await sendDailyBriefingEmail(user._id);
          } catch (e) {
            console.warn(`[AgentService] Morning email failed for user ${user._id}: ${e.message}`);
          }
        }
      } catch (err) {
        console.error('[AgentService] Morning briefing job error:', err.message);
      }
    });
    this.cronJobs.push(morningBriefingJob);
  }

  /**
   * Triggered when a workout is completed or logged
   */
  async onWorkoutCompleted(userId, workoutId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const results = {};

      // 1. Auto-sync to Google Calendar
      if (user.automationPreferences?.autoCalendarSync !== false) {
        try {
          const calResult = await syncWorkoutToGoogleCalendar(userId, workoutId);
          results.calendar = calResult;
          console.log(`[AgentService] 📅 Calendar event synced for workout ${workoutId}`);
        } catch (calErr) {
          console.warn(`[AgentService] Calendar auto-sync error: ${calErr.message}`);
        }
      }

      // 2. Auto-send Email Summary
      if (user.automationPreferences?.emailWorkoutSummary !== false) {
        try {
          const emailResult = await sendWorkoutSummaryEmail(userId, workoutId);
          results.email = emailResult;
          console.log(`[AgentService] 📧 Workout summary email sent for workout ${workoutId}`);
        } catch (emailErr) {
          console.warn(`[AgentService] Email summary error: ${emailErr.message}`);
        }
      }

      return results;
    } catch (err) {
      console.error('[AgentService] onWorkoutCompleted error:', err.message);
    }
  }

  stop() {
    this.cronJobs.forEach((job) => job.stop());
    this.cronJobs = [];
    this.isRunning = false;
    console.log('[AgentService] Background agent stopped.');
  }
}

const agentService = new AthletixAgentService();
module.exports = agentService;
