#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('🧹 Running clean build script...');
  execSync('node scripts/clean-build-errors.js', { stdio: 'inherit' });
  console.log('✨ Clean build script completed!');
} catch (error) {
  console.error('❌ Error running clean build script:', error.message);
  process.exit(1);
}