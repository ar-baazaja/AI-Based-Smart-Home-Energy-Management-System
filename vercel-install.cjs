#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Temporarily rename requirements.txt to prevent Vercel from detecting Python
const requirementsPath = path.join(process.cwd(), 'requirements.txt');
const backupPath = path.join(process.cwd(), 'requirements.txt.backup');

if (fs.existsSync(requirementsPath)) {
  fs.renameSync(requirementsPath, backupPath);
  console.log('Temporarily renamed requirements.txt to prevent Python detection');
}

// Run npm install
const { execSync } = require('child_process');
try {
  execSync('npm install', { stdio: 'inherit' });
} finally {
  // Restore requirements.txt after install
  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, requirementsPath);
    console.log('Restored requirements.txt');
  }
}

