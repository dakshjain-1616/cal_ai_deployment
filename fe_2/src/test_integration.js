/**
 * End-to-End Integration Tests for Frontend API
 * Tests all major user flows and API integrations
 */

import * as api from './services/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const runIntegrationTests = async () => {
  const results = [];
  
  const test = async (name, fn) => {
    try {
      console.log(`\n🧪 Running: ${name}`);
      await fn();
      console.log(`✅ PASSED: ${name}`);
      results.push({ name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      results.push({ name, status: 'FAILED', error: error.message });
    }
  };

  // Test 1: Ensure session
  await test('ensureSession - creates or retrieves session', async () => {
    const token = await api.ensureSession();
    if (!token || typeof token !== 'string') {
      throw new Error(`Invalid token: ${token}`);
    }
  });

  // Test 2: Get user profile
  await test('getUserProfile - retrieves user profile', async () => {
    const profile = await api.getUserProfile();
    if (!profile || !profile.userId) {
      throw new Error('Invalid profile response');
    }
    console.log(`   Profile: ${JSON.stringify(profile)}`);
  });

  // Test 3: Update user profile
  await test('updateUserProfile - updates daily calorie target', async () => {
    const updated = await api.updateUserProfile({ dailyCalorieTarget: 2500, timezone: 'EST' });
    if (updated.dailyCalorieTarget !== 2500) {
      throw new Error('Profile update failed');
    }
    console.log(`   Updated profile: ${JSON.stringify(updated)}`);
  });

  // Test 4: Log water
  await test('logWater - logs water intake', async () => {
    const waterLog = await api.logWater(500);
    if (!waterLog || !waterLog.id) {
      throw new Error('Water log creation failed');
    }
    console.log(`   Water log: ${JSON.stringify(waterLog)}`);
  });

  // Test 5: Get water logs
  await test('getWaterLogs - retrieves water logs', async () => {
    const logs = await api.getWaterLogs();
    if (!Array.isArray(logs)) {
      throw new Error('Invalid water logs response');
    }
    console.log(`   Retrieved ${logs.length} water logs`);
  });

  // Test 6: Log exercise
  await test('logExercise - logs exercise', async () => {
    const exerciseLog = await api.logExercise({
      name: 'Running',
      duration: 30,
      caloriesBurned: 300
    });
    if (!exerciseLog || !exerciseLog.id) {
      throw new Error('Exercise log creation failed');
    }
    console.log(`   Exercise log: ${JSON.stringify(exerciseLog)}`);
  });

  // Test 7: Get exercises
  await test('getExercises - retrieves exercise logs', async () => {
    const logs = await api.getExercises();
    if (!Array.isArray(logs)) {
      throw new Error('Invalid exercises response');
    }
    console.log(`   Retrieved ${logs.length} exercise logs`);
  });

  // Test 8: Log weight
  await test('logWeight - logs weight', async () => {
    const weightLog = await api.logWeight(75.5);
    if (!weightLog || !weightLog.id) {
      throw new Error('Weight log creation failed');
    }
    console.log(`   Weight log: ${JSON.stringify(weightLog)}`);
  });

  // Test 9: Get weight logs
  await test('getWeightLogs - retrieves weight logs', async () => {
    const logs = await api.getWeightLogs();
    if (!Array.isArray(logs)) {
      throw new Error('Invalid weight logs response');
    }
    console.log(`   Retrieved ${logs.length} weight logs`);
  });

  // Test 10: Get daily summary
  await test('getDailySummary - retrieves daily summary', async () => {
    const summary = await api.getDailySummary();
    if (!summary || !summary.date) {
      throw new Error('Invalid summary response');
    }
    console.log(`   Summary: ${JSON.stringify(summary)}`);
  });

  // Test 11: Log meal from text
  await test('logMealFromText - logs meal from text description', async () => {
    const meal = await api.logMealFromText('A chicken sandwich with salad');
    if (!meal || !meal.id) {
      throw new Error('Meal log creation failed');
    }
    console.log(`   Meal: ${JSON.stringify(meal)}`);
  });

  // Test 12: Get meals
  await test('getMeals - retrieves meals', async () => {
    const meals = await api.getMeals();
    if (!Array.isArray(meals)) {
      throw new Error('Invalid meals response');
    }
    console.log(`   Retrieved ${meals.length} meals`);
  });

  // Print summary
  console.log('\n\n========================================');
  console.log('INTEGRATION TEST SUMMARY');
  console.log('========================================');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  console.log('========================================\n');

  return { passed, failed, total: results.length, results };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runIntegrationTests = runIntegrationTests;
  console.log('Integration tests available via: window.runIntegrationTests()');
}
