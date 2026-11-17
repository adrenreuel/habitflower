// Extends app.json with values that come from the environment.
// Google sign-in on iOS needs its reversed client id registered as a URL scheme.
module.exports = ({ config }) => {
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!googleIosClientId) return config;
  const scheme = `com.googleusercontent.apps.${googleIosClientId.split('.')[0]}`;
  const types = config.ios?.infoPlist?.CFBundleURLTypes ?? [];
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: { ...config.ios?.infoPlist, CFBundleURLTypes: [...types, { CFBundleURLSchemes: [scheme] }] },
    },
  };
};
