/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary text on pale background
    text: '#6B3F69',
    // Soft pale pink background
    background: '#FEF3FF',
    // Primary tint (purple)
    tint: '#6B3F69',
    // Secondary icon color (muted purple)
    icon: '#9b6b8f',
    tabIconDefault: '#9b6b8f',
    tabIconSelected: '#6B3F69',
  },
  dark: {
    // Lighter text on dark background
    text: '#FEF3FF',
    // Dark background with purple undertone
    background: '#1f0f20',
    // Accent tint in dark mode (use green for emphasis)
    tint: '#4BAF17',
    icon: '#b99fc0',
    tabIconDefault: '#b99fc0',
    tabIconSelected: '#4BAF17',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
