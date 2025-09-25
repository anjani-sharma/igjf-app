const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// Ensure proper handling of web builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;