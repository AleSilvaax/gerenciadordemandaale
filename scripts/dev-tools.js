
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const commands = {
  test: 'vitest',
  'test:watch': 'vitest --watch',
  'test:ui': 'vitest --ui',
  'test:coverage': 'vitest --coverage',
  lint: 'eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0',
  'lint:fix': 'eslint . --ext .ts,.tsx --fix',
  format: 'prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"',
  'format:check': 'prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"',
  'type-check': 'tsc --noEmit',
  'dev:check': 'npm run type-check && npm run lint && npm run format:check',
};

const command = process.argv[2];

if (!command || !commands[command]) {
  console.log('Available commands:');
  Object.keys(commands).forEach(cmd => {
    console.log(`  npm run ${cmd}`);
  });
  process.exit(1);
}

try {
  execSync(commands[command], { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
