/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'HabitFlowersWidget',
  displayName: 'My HabitFlowers',
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: '#241628',
    $accent: '#74D447',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
  infoPlist: {
    UIAppFonts: ['PlusJakartaSans_600SemiBold.ttf', 'PlusJakartaSans_700Bold.ttf', 'PlusJakartaSans_800ExtraBold.ttf'],
  },
});
