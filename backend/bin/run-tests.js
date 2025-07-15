#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'blue');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 14) {
    log(`❌ Node.js version ${nodeVersion} is not supported. Please use Node.js 14 or higher.`, 'red');
    return false;
  }
  
  log(`✅ Node.js version: ${nodeVersion}`, 'green');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found. Are you in the correct directory?', 'red');
    return false;
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    log('📦 Installing dependencies...', 'yellow');
    if (!runCommand('npm install')) {
      return false;
    }
  }
  
  return true;
}

function setupTestEnvironment() {
  log('🏗️  Setting up test environment...', 'blue');
  
  // Set environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.LOG_LEVEL = 'error';
  
  // Database configuration
  if (!process.env.DB_NAME) {
    process.env.DB_NAME = 'chess_test';
  }
  
  if (!process.env.DB_HOST) {
    process.env.DB_HOST = 'localhost';
  }
  
  log('✅ Test environment configured', 'green');
}

function runTests(testType = 'all') {
  log(`🧪 Running ${testType} tests...`, 'blue');
  
  const testCommands = {
    all: 'npm test',
    auth: 'npm run test:auth',
    games: 'npm run test:games',
    users: 'npm run test:users',
    coverage: 'npm run test:coverage',
    watch: 'npm run test:watch'
  };
  
  const command = testCommands[testType] || testCommands.all;
  
  if (runCommand(command)) {
    log(`✅ ${testType} tests completed successfully!`, 'green');
    return true;
  } else {
    log(`❌ ${testType} tests failed!`, 'red');
    return false;
  }
}

function generateTestReport() {
  log('📊 Generating test report...', 'blue');
  
  if (fs.existsSync('coverage/lcov-report/index.html')) {
    log('✅ Coverage report generated: coverage/lcov-report/index.html', 'green');
  }
  
  if (fs.existsSync('test-results.xml')) {
    log('✅ JUnit report generated: test-results.xml', 'green');
  }
}

function main() {
  log('🧪 Chess App Backend Test Runner', 'magenta');
  log('================================', 'magenta');
  
  const testType = process.argv[2] || 'all';
  
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  setupTestEnvironment();
  
  const success = runTests(testType);
  
  if (testType === 'coverage') {
    generateTestReport();
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  setupTestEnvironment,
  runTests,
  generateTestReport
};
