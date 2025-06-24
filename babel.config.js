module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins: [
      // Required for expo-router - MUST be first
      'expo-router/babel',
      // Required for react-native-reanimated - MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};