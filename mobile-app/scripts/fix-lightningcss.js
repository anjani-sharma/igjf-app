#!/usr/bin/env node

/**
 * Fix LightningCSS platform binary issues for Render deployment
 * This script attempts multiple strategies to resolve lightningcss platform-specific binary problems
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing LightningCSS platform binary issues...');

function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} failed:`, error.message);
    return false;
  }
}

function main() {
  const strategies = [
    {
      name: 'Install Linux x64 binary directly',
      command: 'npm install @lightningcss/linux-x64-gnu@^1.21.0 --save-optional'
    },
    {
      name: 'Rebuild lightningcss for current platform',
      command: 'npm rebuild lightningcss'
    },
    {
      name: 'Force install all platform binaries',
      command: 'npm install @lightningcss/linux-x64-gnu@^1.21.0 @lightningcss/darwin-x64@^1.21.0 @lightningcss/darwin-arm64@^1.21.0 @lightningcss/win32-x64-msvc@^1.21.0 --save-optional'
    },
    {
      name: 'Clear npm cache and reinstall',
      command: 'npm cache clean --force && npm install'
    }
  ];

  let success = false;
  
  for (const strategy of strategies) {
    console.log(`\n🚀 Trying strategy: ${strategy.name}`);
    if (runCommand(strategy.command, strategy.name)) {
      success = true;
      break;
    }
  }

  if (!success) {
    console.log('\n⚠️  All strategies failed. LightningCSS may not work properly.');
    console.log('💡 The build will continue with CSS modules disabled as fallback.');
  } else {
    console.log('\n✅ LightningCSS platform binary issue resolved!');
  }

  console.log('🎉 Script completed.');
}

main();