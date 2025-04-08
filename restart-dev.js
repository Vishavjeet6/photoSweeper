const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Kill any existing Metro bundler processes
try {
  execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors if no processes are found
}

// Clear Metro bundler cache
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
}

// Start the development server with clear cache
console.log('Starting development server...');
execSync('npx expo start --clear', { stdio: 'inherit' }); 