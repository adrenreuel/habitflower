import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, DISPLAY_TRACKING, fontFor, fonts, type Weight } from '@/theme/tokens';

export type AppTextProps = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  align?: TextStyle['textAlign'];
  lineHeight?: number;
  /** 13/800 uppercase label style. */
  label?: boolean;
  /** Young Serif display style (titles). Ignores `weight`; the font has one weight. */
  display?: boolean;
};

export function Text({ size = 16, weight = 600, color = colors.text, align, lineHeight, label, display, style, ...rest }: AppTextProps) {
  const base: TextStyle = label
    ? { fontFamily: fontFor(800), fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.text2 }
    : display
      ? { fontFamily: fonts.display, fontSize: size, color, lineHeight: lineHeight ?? Math.round(size * 1.25), letterSpacing: DISPLAY_TRACKING }
      : { fontFamily: fontFor(weight), fontSize: size, color, lineHeight: lineHeight ?? Math.round(size * 1.3) };
  if (label && color !== colors.text) base.color = color;
  return <RNText maxFontSizeMultiplier={1.4} {...rest} style={[base, align ? { textAlign: align } : null, style]} />;
}
