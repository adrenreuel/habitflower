/**
 * Environment config. Values come from EXPO_PUBLIC_* variables (.env files
 * or EAS environment), never hardcoded. See .env.example.
 */
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};

/** False in local-only builds without a server configured. */
export const backendEnabled = () => config.apiUrl.length > 0;
