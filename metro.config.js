const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear resolver cache to prevent SDK upgrade issues
config.resetCache = true;

// Ensure proper handling of React Native modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;