const axios = require('axios');

async function testPrediction() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🤖 Testing Adaptive AI Movement Predictor...');

  // 1. Register or Login
  let token;
  try {
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Athletix Athlete',
      email: 'athlete@athletix.ai',
      password: 'password123',
    });
    token = regRes.data.token;
    console.log('✅ Registered fresh user:', regRes.data.user.name);
  } catch (err) {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'athlete@athletix.ai',
      password: 'password123',
    });
    token = loginRes.data.token;
    console.log('✅ Logged in as:', loginRes.data.user.name);
  }
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Fetch today's prediction
  const predRes = await axios.get(`${BASE_URL}/prediction/today`, authHeader);
  console.log('✅ Prediction Output:');
  console.log('   Target Muscle:', predRes.data.targetMuscleGroup);
  console.log('   Workout Name:', predRes.data.workoutName);
  console.log('   Readiness Score:', predRes.data.readinessScore + '%');
  console.log('   Rationale:', predRes.data.aiRationale);
  console.log('   Predicted Movements:');
  predRes.data.predictedMovements.forEach((m, idx) => {
    console.log(`     ${idx + 1}. ${m.exerciseName}: ${m.setsCount} sets × ${m.targetReps} reps (${m.targetWeight}kg) - ${m.overloadReason}`);
  });

  // 3. Test Accept Prediction
  const acceptRes = await axios.post(`${BASE_URL}/prediction/accept`, {}, authHeader);
  console.log('\n✅ Accept Prediction Output:');
  console.log('   Status:', acceptRes.data.message);
  console.log('   Created Workout ID:', acceptRes.data.workout._id);
  console.log('   Exercises Scheduled:', acceptRes.data.exercises.length);

  console.log('\n🎉 ALL PREDICTIVE ENGINE TESTS PASSED!');
}

testPrediction().catch((err) => {
  console.error('❌ Prediction test failed:', err.response?.data || err.message);
  process.exit(1);
});
