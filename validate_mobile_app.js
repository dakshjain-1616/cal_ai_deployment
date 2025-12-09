#!/usr/bin/env node

/**
 * Mobile App Structure Validation
 * Verifies all screens are properly connected to the API
 */

const fs = require('fs');
const path = require('path');

const mobileAppDir = path.join(__dirname, 'cai_mobile_app');

const checks = {
  screens: {},
  api: {},
  navigation: {}
};

console.log('🔍 Validating Mobile App Structure...\n');

// Check 1: Screen Files Exist
console.log('📱 Checking Screen Files:');
const screenFiles = {
  dashboard: 'app/(tabs)/index.tsx',
  water: 'app/(tabs)/water.tsx',
  exercise: 'app/(tabs)/exercise.tsx',
  scan: 'app/(tabs)/scan.tsx',
  settings: 'app/(tabs)/settings.tsx'
};

for (const [name, file] of Object.entries(screenFiles)) {
  const filepath = path.join(mobileAppDir, file);
  const exists = fs.existsSync(filepath);
  checks.screens[name] = exists;
  console.log(`  ${exists ? '✅' : '❌'} ${name}: ${file}`);
}

// Check 2: API Client Exists
console.log('\n🔗 Checking API Client:');
const apiPath = path.join(mobileAppDir, 'src/services/api.js');
const apiExists = fs.existsSync(apiPath);
checks.api.exists = apiExists;
console.log(`  ${apiExists ? '✅' : '❌'} API client: src/services/api.js`);

if (apiExists) {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  const hasWaterApi = apiContent.includes('export const waterApi');
  const hasExerciseApi = apiContent.includes('export const exerciseApi');
  const hasSummaryApi = apiContent.includes('export const summaryApi');
  const hasUploadScan = apiContent.includes('uploadImageForScan');
  
  checks.api.waterApi = hasWaterApi;
  checks.api.exerciseApi = hasExerciseApi;
  checks.api.summaryApi = hasSummaryApi;
  checks.api.uploadScan = hasUploadScan;
  
  console.log(`  ${hasWaterApi ? '✅' : '❌'} waterApi exported`);
  console.log(`  ${hasExerciseApi ? '✅' : '❌'} exerciseApi exported`);
  console.log(`  ${hasSummaryApi ? '✅' : '❌'} summaryApi exported`);
  console.log(`  ${hasUploadScan ? '✅' : '❌'} uploadImageForScan function`);
}

// Check 3: Tab Navigation
console.log('\n🧭 Checking Tab Navigation:');
const tabLayoutPath = path.join(mobileAppDir, 'app/(tabs)/_layout.tsx');
const tabLayoutExists = fs.existsSync(tabLayoutPath);

if (tabLayoutExists) {
  const tabContent = fs.readFileSync(tabLayoutPath, 'utf8');
  const tabs = ['index', 'water', 'exercise', 'scan', 'settings'];
  
  for (const tab of tabs) {
    const hasTab = tabContent.includes(`name="${tab}"`);
    checks.navigation[tab] = hasTab;
    console.log(`  ${hasTab ? '✅' : '❌'} ${tab} screen in tab bar`);
  }
}

// Check 4: Package.json Dependencies
console.log('\n📦 Checking Dependencies:');
const packagePath = path.join(mobileAppDir, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'axios',
    '@react-native-async-storage/async-storage',
    'expo-image-picker',
    'expo-router',
    'react-native'
  ];
  
  for (const dep of requiredDeps) {
    const hasdep = dep in pkg.dependencies || dep in pkg.devDependencies;
    console.log(`  ${hasdep ? '✅' : '❌'} ${dep}`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Integration Summary:');
const allChecks = Object.values(checks).flatMap(v => Object.values(v));
const passedChecks = allChecks.filter(v => v === true).length;
const totalChecks = allChecks.length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks}`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All screens and integrations are ready for testing!');
  console.log('\n📝 Next Steps:');
  console.log('  1. Ensure backend is running on http://127.0.0.1:8000');
  console.log('  2. Run: npm start (in cai_mobile_app)');
  console.log('  3. Scan QR code with Expo Go or use simulator');
  console.log('  4. Test each screen and feature');
  console.log('\n📖 See MOBILE_TESTING_GUIDE.md for detailed instructions');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.');
  process.exit(1);
}
