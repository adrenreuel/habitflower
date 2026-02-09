const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Use react-native-svg-transformer for .svg imports
config.transformer = {
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// Remove svg from assetExts and add it to sourceExts
if (config.resolver) {
  const { assetExts = [], sourceExts = [] } = config.resolver;
  config.resolver.assetExts = assetExts.filter((ext) => ext !== "svg");
  config.resolver.sourceExts = Array.from(new Set([...sourceExts, "svg"]));
}

module.exports = config;
