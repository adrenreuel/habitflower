/**
 * Stroke icons taken from the mockups (24x24, round caps and joins).
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

type Shape =
  | { p: string; fill?: boolean }
  | { c: [number, number, number]; fill?: boolean }
  | { r: [number, number, number, number, number] };

const ICONS = {
  back: [{ p: 'M15 5l-7 7 7 7' }],
  chevronRight: [{ p: 'M9 6l6 6-6 6' }],
  chevronDown: [{ p: 'M6 9l6 6 6-6' }],
  chevronDownSmall: [{ p: 'M7 10l5 5 5-5' }],
  dueChevron: [{ p: 'M5 9l7 7 7-7' }],
  close: [{ p: 'M6 6l12 12M18 6L6 18' }],
  plus: [{ p: 'M12 5v14M5 12h14' }],
  plusSmall: [{ p: 'M12 6v12M6 12h12' }],
  minus: [{ p: 'M5 12h14' }],
  check: [{ p: 'M5 12.5l4.5 4.5L19 7.5' }],
  checkCircle: [{ c: [12, 12, 9] }, { p: 'M8 12.5l2.8 2.8L16.5 9.5' }],
  pencil: [{ p: 'M4 20h4L19 9l-4-4L4 16z' }, { p: 'M13.5 6.5l4 4' }],
  trash: [{ p: 'M4 7h16' }, { p: 'M9 7V4.5h6V7' }, { p: 'M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5' }],
  pause: [{ c: [12, 12, 9] }, { p: 'M10 9v6M14 9v6' }],
  clock: [{ c: [12, 12, 9] }, { p: 'M12 7.5V12l3 2' }],
  bell: [{ p: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z' }, { p: 'M10 20.5a2 2 0 0 0 4 0' }],
  bellTab: [{ p: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4' }],
  habitsTab: [{ p: 'M12 21v-8' }, { p: 'M12 13c0-3 2-5 5-5 0 3-2 5-5 5z' }, { p: 'M12 15c0-2.5-1.8-4.5-4.5-4.5 0 2.5 1.8 4.5 4.5 4.5z' }, { c: [12, 6, 3] }],
  tasksTab: [{ r: [4, 4, 16, 16, 4] }, { p: 'M8.5 12l2.5 2.5 4.5-5' }],
  friendsTab: [{ c: [9, 9, 3.5] }, { c: [17, 10, 2.5] }, { p: 'M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5' }, { p: 'M15.5 14.2c2.8 0 5 1.8 5 4.8' }],
  addFriend: [{ c: [9, 8.5, 3.5] }, { p: 'M2.5 19.5c0-3.4 2.9-5.8 6.5-5.8s6.5 2.4 6.5 5.8' }, { p: 'M19 8v6M16 11h6' }],
  umbrella: [{ p: 'M4 11a8 8 0 0 1 16 0zM12 11l-2.5 8.5M5 20.5h10' }],
  repeat: [{ p: 'M17 2l3 3-3 3' }, { p: 'M4 11V9a4 4 0 0 1 4-4h12' }, { p: 'M7 22l-3-3 3-3' }, { p: 'M20 13v2a4 4 0 0 1-4 4H4' }],
  calendar: [{ p: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4' }],
  help: [{ p: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01' }],
  counter: [{ r: [3, 7, 18, 10, 5] }, { p: 'M7.5 12h3M15 10.5v3M13.5 12h3' }],
  list: [{ p: 'M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4.5 18h3M11 7h9M11 13h9M11 18h9' }],
  camera: [{ p: 'M4 8h3l2-3h6l2 3h3v11H4z' }, { c: [12, 13, 3.5] }],
  health: [{ p: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8c0 1-.2 1.9-.6 2.7' }, { p: 'M3 12.5h4l1.5-2.5 2.5 5 1.5-2.5h3' }],
  heart: [{ p: 'M12 20.5s-8-4.9-8-10.9A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 3c0 6-8 10.9-8 10.9z' }],
  globe: [{ c: [12, 12, 9] }, { p: 'M3 12h18' }, { p: 'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z' }],
  flame: [{ p: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.2 2.2-5.3 3.6-7.1.4 1.8 1.4 2.9 2.4 3.2-.3-2.9.9-5.6 3-7.4.2 2.6 1.4 4.1 2.6 5.6 1.1 1.4 1.4 2.6 1.4 4.1C18.5 17.9 15.9 21 12 21z' }],
  drop: [{ p: 'M12 3C9 7.5 6.5 10.6 6.5 14a5.5 5.5 0 0 0 11 0C17.5 10.6 15 7.5 12 3z' }],
  offline: [{ p: 'M3 3l18 18M8.5 8.6A5 5 0 0 0 7 18h10.5M18.5 17.8A4 4 0 0 0 17 10h-.5A6 6 0 0 0 11 6c-.6 0-1.2.1-1.8.3' }],
  more: [{ c: [5.5, 12, 1.8] }, { c: [12, 12, 1.8] }, { c: [18.5, 12, 1.8] }],
  moon: [{ p: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' }],
  eye: [{ p: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }],
  share: [{ p: 'M12 15V3M7.5 7.5L12 3l4.5 4.5' }, { p: 'M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6' }],
  lock: [{ r: [5, 11, 14, 9, 2.5] }, { p: 'M8 11V8a4 4 0 0 1 8 0v3' }],
  swap: [{ p: 'M4 9h13l-3-3M20 15H7l3 3' }],
  search: [{ c: [11, 11, 6.5] }, { p: 'M20 20l-4.2-4.2' }],
  sparkle: [{ p: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z' }, { p: 'M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z' }],
  undo: [{ p: 'M9 14L4 9l5-5' }, { p: 'M4 9h10a6 6 0 0 1 0 12h-3' }],
  sliders: [{ p: 'M4 7h10M18 7h2M4 17h4M12 17h8' }, { c: [16, 7, 2] }, { c: [10, 17, 2] }],
  widget: [{ p: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' }],
  dome: [{ p: 'M5 20h14M6 20v-7a6 6 0 0 1 12 0v7M12 20v-5' }],
  moonSmall: [{ p: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z' }],
  alert: [{ p: 'M12 4v8M12 16h.01' }],
  star: [{ p: 'M12 3l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z', fill: true }],
  qr: [{ r: [4, 4, 6, 6, 1.5] }, { r: [14, 4, 6, 6, 1.5] }, { r: [4, 14, 6, 6, 1.5] }, { p: 'M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5z', fill: true }],
  settings: [{ c: [12, 12, 3] }, { p: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }],
  apple: [{ p: 'M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3-2.5 1-1.4 1.4-2.8 1.4-2.8s-2.6-1-2.6-4.3zM14 5.1c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z', fill: true }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = colors.text, strokeWidth = 2.2 }: IconProps) {
  const shapes: Shape[] = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {shapes.map((s, i) => {
        if ('r' in s) return <Rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} />;
        if ('c' in s) return <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill={s.fill ? color : 'none'} />;
        return <Path key={i} d={s.p} fill={s.fill ? color : 'none'} stroke={s.fill ? 'none' : color} />;
      })}
    </Svg>
  );
}

/** Google "G" logo in brand colours (Account backup). */
export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <Path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <Path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.6z" />
      <Path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4 5.6-4z" />
    </Svg>
  );
}
