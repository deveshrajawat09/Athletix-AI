const axios = require('axios');

async function testAll() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Testing Athletix AI Backend Agent & Integrations...');

  // 1. Health check
  const health = await axios.get('http://localhost:5000/health');
  console.log('✅ Health check passed:', health.data);

  // 2. Login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'demo@athletix.ai',
    password: 'password123',
  });
  const token = loginRes.data.token;
  console.log('✅ Login successful. Token obtained for user:', loginRes.data.user.name);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 3. Integration status
  const statusRes = await axios.get(`${BASE_URL}/integrations/status`, authHeader);
  console.log('✅ Integration Status:', statusRes.data);

  // 4. Google Fit sync
  const fitRes = await axios.post(`${BASE_URL}/integrations/google-fit/sync`, { stepDelta: 450 }, authHeader);
  console.log('✅ Google Fit Real-Time Sync:', fitRes.data);

  // 5. Fetch workouts
  const workoutsRes = await axios.get(`${BASE_URL}/workouts`, authHeader);
  const workout = workoutsRes.data.workouts[0];
  console.log(`✅ Fetched workout: "${workout.workoutName}" (ID: ${workout._id})`);

  // 6. Google Calendar sync
  const calRes = await axios.post(`${BASE_URL}/integrations/google-calendar/sync-workout`, { workoutId: workout._id }, authHeader);
  console.log('✅ Google Calendar Sync Result:', {
    title: calRes.data.title,
    calendarLink: calRes.data.calendarLink ? 'Link generated' : 'No link',
    message: calRes.data.message,
  });

  // 7. Email workout summary
  const emailRes = await axios.post(`${BASE_URL}/integrations/email/send-summary`, { workoutId: workout._id }, authHeader);
  console.log('✅ Email Workout Summary Sent:', {
    success: emailRes.data.success,
    recipient: emailRes.data.recipient,
    previewUrl: emailRes.data.previewUrl,
  });

  // 8. Email daily briefing
  const briefingRes = await axios.post(`${BASE_URL}/integrations/email/send-daily-briefing`, {}, authHeader);
  console.log('✅ Morning Daily Briefing Email Sent:', {
    success: briefingRes.data.success,
    recipient: briefingRes.data.recipient,
    previewUrl: briefingRes.data.previewUrl,
  });

  console.log('\n🎉 ALL AGENT INTEGRATIONS PASSED SUCCESSFULLY!');
}

testAll().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
