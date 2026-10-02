require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('./src/server');

const PORT = 5005;

async function runTests() {
  console.log('--- ATHLETIX AI BACKEND END-TO-END VERIFICATION ---');

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[test] Test server listening on port ${PORT}`);
  });

  // Wait for MongoDB connection ready and demo user seeded
  console.log('[test] Waiting for MongoDB connection...');
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('[test] MongoDB connection established! Waiting for demo data...');
  const User = require('./src/models/User');
  while (!(await User.findOne({ email: 'demo@athletix.ai' }))) {
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log('[test] Demo user ready!');

  const api = axios.create({ baseURL: `http://localhost:${PORT}/api` });

  try {
    // 1. Auth: Login with demo credentials
    console.log('\n1. Testing Auth Login (demo@athletix.ai)...');
    const loginRes = await api.post('/auth/login', {
      email: 'demo@athletix.ai',
      password: 'password123',
    });
    console.log('✓ Login successful! Token received for user:', loginRes.data.user.name);
    const token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Auth: GET /auth/me
    console.log('\n2. Testing GET /auth/me...');
    const meRes = await api.get('/auth/me');
    console.log('✓ Auth/me confirmed user ID:', meRes.data.user.id);

    // 3. Health Profile
    console.log('\n3. Testing GET /health/profile...');
    const profileRes = await api.get('/health/profile');
    console.log('✓ Profile loaded:', {
      goal: profileRes.data.profile.fitnessGoal,
      bmi: profileRes.data.profile.bmi,
      weight: profileRes.data.profile.weight,
    });

    // 4. Dashboard Today
    console.log('\n4. Testing GET /dashboard/today...');
    const todayRes = await api.get('/dashboard/today');
    console.log('✓ Today summary:', {
      workout: todayRes.data.workout?.workoutName,
      cardio: todayRes.data.cardio?.activityType,
      steps: todayRes.data.healthMetrics?.steps,
      pendingTasks: todayRes.data.pendingTasks,
    });

    // 5. Workouts & Exercises
    console.log('\n5. Testing GET /workouts...');
    const workoutsRes = await api.get('/workouts');
    console.log(`✓ Loaded ${workoutsRes.data.workouts.length} workouts.`);
    const firstWorkout = workoutsRes.data.workouts[0];
    console.log('  Top workout:', firstWorkout.workoutName, `(${firstWorkout.exercises?.length || 0} exercises)`);
    if (firstWorkout.exercises && firstWorkout.exercises.length > 0) {
      console.log('  Top exercise:', firstWorkout.exercises[0].exerciseName, `(${firstWorkout.exercises[0].sets.length} sets)`);
    }

    // 6. Personal Records
    console.log('\n6. Testing GET /workouts/records/all...');
    const prRes = await api.get('/workouts/records/all');
    console.log(`✓ Found ${prRes.data.records.length} personal records:`);
    prRes.data.records.forEach((r) => {
      console.log(`  - ${r.exerciseName}: max weight ${r.maxWeight} kg, max reps ${r.maxReps}`);
    });

    // 7. Add Exercise & Add Set
    console.log('\n7. Testing Exercise & Set Management...');
    const addExRes = await api.post(`/workouts/${firstWorkout._id}/exercises`, {
      exerciseName: 'Incline Cable Fly',
    });
    console.log('✓ Added exercise:', addExRes.data.exercise.exerciseName);
    const addSetRes = await api.post(`/workouts/${firstWorkout._id}/exercises/${addExRes.data.exercise._id}/sets`, {
      weight: 15,
      reps: 12,
    });
    console.log('✓ Added set to exercise:', addSetRes.data.exercise.sets[0]);

    // 8. Cardio Sessions
    console.log('\n8. Testing GET /cardio...');
    const cardioRes = await api.get('/cardio');
    console.log(`✓ Loaded ${cardioRes.data.sessions.length} cardio sessions. Latest:`, {
      type: cardioRes.data.sessions[0]?.activityType,
      distance: `${cardioRes.data.sessions[0]?.distanceKm} km`,
    });

    // 9. Goals
    console.log('\n9. Testing GET /goals & Update Progress...');
    const goalsRes = await api.get('/goals');
    console.log(`✓ Loaded ${goalsRes.data.goals.length} goals.`);
    const g = goalsRes.data.goals[0];
    const updateGoalRes = await api.put(`/goals/${g._id}`, { currentProgress: g.currentProgress + 1 });
    console.log(`✓ Updated goal [${g.goalType}] progress: ${g.currentProgress} -> ${updateGoalRes.data.goal.currentProgress}`);

    // 10. AI Chat - Plan inquiry
    console.log('\n10. Testing POST /ai/chat (Plan Inquiry)...');
    const aiPlanRes = await api.post('/ai/chat', { message: 'Aaj ka plan kya hai?' });
    console.log('✓ AI Response:', aiPlanRes.data.response);
    console.log('  Intent detected:', aiPlanRes.data.intent);

    // 11. AI Chat - Write intent (SAVE_SET)
    console.log('\n11. Testing POST /ai/chat (SAVE_SET write intent)...');
    const aiSetRes = await api.post('/ai/chat', { message: 'Bench Press 85kg x 5 reps save karo' });
    console.log('✓ AI Response:', aiSetRes.data.response);
    console.log('  Intent:', aiSetRes.data.intent, 'Executed:', aiSetRes.data.execution?.executed);

    // 12. AI Chat - Write intent (SAVE_CARDIO)
    console.log('\n12. Testing POST /ai/chat (SAVE_CARDIO write intent)...');
    const aiCardioRes = await api.post('/ai/chat', { message: '6km running hui save karo' });
    console.log('✓ AI Response:', aiCardioRes.data.response);
    console.log('  Intent:', aiCardioRes.data.intent, 'Executed:', aiCardioRes.data.execution?.executed);

    // 13. Daily Briefing
    console.log('\n13. Testing GET /ai/daily-briefing (morning & evening)...');
    const morningBriefing = await api.get('/ai/daily-briefing?type=morning');
    console.log('✓ Morning briefing:', morningBriefing.data.response);
    const eveningBriefing = await api.get('/ai/daily-briefing?type=evening');
    console.log('✓ Evening briefing:', eveningBriefing.data.response);

    console.log('\n=============================================');
    console.log(' ALL 13 END-TO-END TESTS PASSED SUCCESSFULLY! ');
    console.log('=============================================\n');
  } catch (err) {
    console.error('Test failed with error:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();
