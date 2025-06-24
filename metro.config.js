const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Clear all caches to prevent SDK upgrade issues
config.resetCache = true;

// Ensure proper platform resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add source extensions for better compatibility
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Transformer options for better compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Disable minification that can cause C++ exceptions
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Serializer options to prevent bundling issues
config.serializer = {
  ...config.serializer,
  customSerializer: null,
};

module.exports = config;