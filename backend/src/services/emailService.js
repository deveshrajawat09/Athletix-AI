const nodemailer = require('nodemailer');
const User = require('../models/User');
const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const CardioSession = require('../models/CardioSession');
const DailyHealthMetric = require('../models/DailyHealthMetric');
const Goal = require('../models/Goal');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // 1. If SMTP environment variables are provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // 2. If Gmail App credentials are provided
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });
    }

    // 3. Dev fallback: Ethereal test account for instant testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[email] Created Ethereal test mail account: ${testAccount.user}`);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (e) {
      console.warn('[email] Could not create Ethereal account. Using JSON stream transporter.');
      return nodemailer.createTransport({ jsonTransport: true });
    }
  })();

  return transporterPromise;
}

/**
 * Send Workout Summary Email
 */
async function sendWorkoutSummaryEmail(userId, workoutId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const targetEmail = user.automationPreferences?.notificationEmail || user.email;
  const workout = await Workout.findOne({ _id: workoutId, userId });
  if (!workout) throw new Error('Workout not found');

  const exercises = await WorkoutExercise.find({ workoutId: workout._id });
  const cardio = await CardioSession.find({ userId, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });

  const durationMin = workout.actualDurationMinutes || workout.estimatedDurationMinutes || 45;

  let exerciseRows = '';
  if (exercises && exercises.length > 0) {
    exerciseRows = exercises
      .map((ex) => {
        const setsHtml = (ex.sets || [])
          .map((s) => `<li style="color: #4b5563;">Set ${s.setNumber}: <strong>${s.weight} kg</strong> × <strong>${s.reps} reps</strong> ${s.completed ? '✅' : '⏳'}</li>`)
          .join('');
        return `
          <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid #2563eb;">
            <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 15px;">${ex.exerciseName}</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px;">${setsHtml}</ul>
          </div>
        `;
      })
      .join('');
  } else {
    exerciseRows = '<p style="color: #6b7280; font-style: italic;">No specific exercises recorded.</p>';
  }

  let cardioHtml = '';
  if (cardio && cardio.length > 0) {
    const cardioItems = cardio
      .map((c) => `<li style="color: #4b5563;">${c.activityType.toUpperCase()}: ${c.distanceKm || 0} km in ${c.durationMinutes || 0} mins (${c.calories || 0} kcal)</li>`)
      .join('');
    cardioHtml = `
      <div style="margin-top: 16px;">
        <h3 style="color: #111827; font-size: 16px; margin-bottom: 8px;">🏃 Cardio Logged Today</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px;">${cardioItems}</ul>
      </div>
    `;
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #2563eb; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">⚡ Athletix AI Agent</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Workout Summary & Performance Report</p>
      </div>
      
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #374151;">Hello <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Great job on crushing your training session today! Here is your complete workout breakdown logged by your Athletix AI Coach:</p>
        
        <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h2 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px;">${workout.workoutName}</h2>
          <div style="display: flex; gap: 16px; font-size: 13px; color: #1e3a8a;">
            <span>🎯 <strong>Focus:</strong> ${workout.muscleGroup || 'Full Body'}</span> | 
            <span>⏱️ <strong>Duration:</strong> ${durationMin} mins</span> | 
            <span>📊 <strong>Status:</strong> ${workout.status}</span>
          </div>
        </div>

        <h3 style="color: #111827; font-size: 16px; margin-bottom: 12px;">🏋️ Exercises & Sets Completed</h3>
        ${exerciseRows}

        ${cardioHtml}

        <div style="background: #f3f4f6; border-radius: 8px; padding: 14px; margin-top: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #4b5563;">💡 <em>AI Coach Tip: Ensure 7-8 hours of quality sleep tonight to maximize muscle protein synthesis and recovery.</em></p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="http://localhost:5173" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Open Athletix Dashboard</a>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        Athletix AI Automation Agent • Real-Time Health & Fitness Tracking
      </div>
    </div>
  `;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Athletix AI Agent" <agent@athletix.ai>',
    to: targetEmail,
    subject: `💪 Workout Logged: ${workout.workoutName} (${durationMin}m)`,
    text: `Workout Summary for ${workout.workoutName}. Focus: ${workout.muscleGroup}. Duration: ${durationMin} mins. Keep it up!`,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[email] Workout summary preview URL: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    recipient: targetEmail,
    workoutName: workout.workoutName,
  };
}

/**
 * Send Daily Morning Briefing Email
 */
async function sendDailyBriefingEmail(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const targetEmail = user.automationPreferences?.notificationEmail || user.email;
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [todayWorkout, dailyMetric, goals] = await Promise.all([
    Workout.findOne({ userId, date: { $gte: today } }),
    DailyHealthMetric.findOne({ userId, date: today }),
    Goal.find({ userId, status: 'active' }).limit(4),
  ]);

  const steps = dailyMetric?.steps || 0;
  const workoutTitle = todayWorkout ? todayWorkout.workoutName : 'Rest / Active Recovery Day';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #059669; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">🌅 Athletix Daily Morning Briefing</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Your AI Fitness Plan for Today</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #374151;">Good morning <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Here is your personal fitness briefing prepared by your Athletix AI Agent:</p>

        <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #a7f3d0;">
          <h3 style="margin: 0 0 6px 0; color: #065f46; font-size: 16px;">🏋️ Today's Focus: ${workoutTitle}</h3>
          <p style="margin: 0; font-size: 13px; color: #047857;">
            ${todayWorkout ? `Muscle Group: ${todayWorkout.muscleGroup || 'Custom'} • Status: ${todayWorkout.status}` : 'No intensive lifting scheduled. Perfect day for mobility or zone-2 cardio.'}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Google Fit Steps</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${steps.toLocaleString()} / 10,000</p>
          </div>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Hydration Target</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">8 Glasses (2.5L)</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="http://localhost:5173/ai-coach" style="background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Talk to AI Coach</a>
        </div>
      </div>
    </div>
  `;

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Athletix AI Agent" <agent@athletix.ai>',
    to: targetEmail,
    subject: `🌅 Daily Briefing: ${workoutTitle}`,
    text: `Daily briefing for ${user.name}: Today's workout is ${workoutTitle}. Current steps: ${steps}.`,
    html: htmlContent,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return {
    success: true,
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    recipient: targetEmail,
  };
}

module.exports = {
  sendWorkoutSummaryEmail,
  sendDailyBriefingEmail,
};
