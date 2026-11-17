/**
 * The shared flower drawing (port of docs/handoff/design/Flower.dc.html).
 * Every screen and widget draws flowers through this component.
 * The soil stays level in every state; wilting is its own drooping drawing.
 */
import { createContext, memo, useContext } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { flowerColors, type FlowerKind } from '@/theme/tokens';
import type { FlowerHealth, FlowerStage } from '@/domain/types';

export type FlowerProps = {
  kind: FlowerKind;
  stage?: FlowerStage;
  health?: FlowerHealth;
  size?: number;
  /** Draw the soil oval (default). Off when the soil is drawn separately, e.g. under a swaying flower. */
  soil?: boolean;
};

// Illustration palette (fixed artwork colours, not UI tokens).
const SOIL = '#6B4436';
const LEAF = '#74D447';
const LEAF_LIGHT = '#9BE36F';
const LEAF_DARK = '#5FAE38';
const WILT_LEAF = '#86A862';
const WILT_LEAF_LIGHT = '#9DB97A';
const DRY = '#8A6A48';
const DRY_LIGHT = '#A07E58';
const FADE_TO = '#9A8A92';

function mix(hex: string, toHex: string, t: number): string {
  const a = parseInt(hex.slice(1), 16);
  const c = parseInt(toHex.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((c >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((c >> 8) & 255) * t);
  const b = Math.round((a & 255) * (1 - t) + (c & 255) * t);
  return `rgb(${r},${g},${b})`;
}

const SoilOn = createContext(true);
const Soil = () => (useContext(SoilOn) ? <Ellipse cx={32} cy={58} rx={13} ry={3.5} fill={SOIL} /> : null);

const rot = (deg: number, cx: number, cy: number) => `rotate(${deg} ${cx} ${cy})`;

function WiltSeed() {
  return (
    <>
      <Soil />
      <Path d="M32 58C32 51 32.5 46.5 35 43.5" stroke={WILT_LEAF} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Ellipse cx={31.5} cy={47.5} rx={7.5} ry={3.4} transform={rot(-62, 31.5, 47.5)} fill={WILT_LEAF} />
      <Ellipse cx={38.5} cy={47.5} rx={7.5} ry={3.4} transform={rot(62, 38.5, 47.5)} fill={WILT_LEAF_LIGHT} />
    </>
  );
}

function WiltBud({ faded }: { faded: string }) {
  return (
    <>
      <Soil />
      <Path d="M32 58C32 46 32 35 36 28C39 23 44 22 46 26" stroke={WILT_LEAF} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Ellipse cx={28.5} cy={49} rx={7} ry={3} transform={rot(-58, 28.5, 49)} fill={WILT_LEAF} />
      <Ellipse cx={36} cy={46} rx={7} ry={3} transform={rot(58, 36, 46)} fill={WILT_LEAF_LIGHT} />
      <Ellipse cx={46} cy={32.5} rx={3.8} ry={6.2} fill={faded} />
      <Circle cx={46} cy={27} r={2.4} fill={WILT_LEAF} />
    </>
  );
}

function WiltBloom({ faded, fadedCenter }: { faded: string; fadedCenter: string }) {
  return (
    <>
      <Soil />
      <Path d="M32 58C32 46 32 34 36 27C39 22 44 21 46 25" stroke={WILT_LEAF} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Ellipse cx={28.5} cy={49} rx={7} ry={3} transform={rot(-58, 28.5, 49)} fill={WILT_LEAF} />
      <Ellipse cx={36} cy={46} rx={7} ry={3} transform={rot(58, 36, 46)} fill={WILT_LEAF_LIGHT} />
      <G fill={faded}>
        <Ellipse cx={46} cy={34} rx={3.2} ry={7} transform={rot(-32, 46, 27.5)} />
        <Ellipse cx={46} cy={34} rx={3.2} ry={7} transform={rot(32, 46, 27.5)} />
        <Ellipse cx={46} cy={34.5} rx={3.4} ry={7.2} />
      </G>
      <Circle cx={46} cy={27} r={3} fill={fadedCenter} />
    </>
  );
}

function Dormant() {
  return (
    <>
      <Soil />
      <Path d="M32 58V41" stroke={DRY} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={25.5} cy={40.5} rx={8} ry={3.8} transform={rot(-18, 25.5, 40.5)} fill={DRY} />
      <Ellipse cx={38.5} cy={40.5} rx={8} ry={3.8} transform={rot(18, 38.5, 40.5)} fill={DRY_LIGHT} />
    </>
  );
}

function Seed() {
  return (
    <>
      <Soil />
      <Path d="M32 58V40" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={25} cy={38} rx={8} ry={4} transform={rot(-28, 25, 38)} fill={LEAF} />
      <Ellipse cx={39} cy={38} rx={8} ry={4} transform={rot(28, 39, 38)} fill={LEAF_LIGHT} />
    </>
  );
}

function Bud({ color }: { color: string }) {
  return (
    <>
      <Soil />
      <Path d="M32 58V24" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={25} cy={46} rx={7} ry={3.5} transform={rot(-28, 25, 46)} fill={LEAF} />
      <Ellipse cx={39} cy={40} rx={7} ry={3.5} transform={rot(28, 39, 40)} fill={LEAF_LIGHT} />
      <Ellipse cx={32} cy={17} rx={5.5} ry={8.5} fill={color} />
      <Path d="M26.5 22C28 26 30 27 32 27C34 27 36 26 37.5 22C35.5 23.5 34 23.5 32 21.5C30 23.5 28.5 23.5 26.5 22Z" fill={LEAF_DARK} />
    </>
  );
}

/** Petals rotated around a centre, the pattern most bloom drawings use. */
function Ring({ n, step, render }: { n: number; step: number; render: (transform?: string) => React.ReactNode }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <G key={i}>{render(i === 0 ? undefined : rot(i * step, 32, 20))}</G>
      ))}
    </>
  );
}

function StemLeaves({ ry = 3.5, leftRot = -30, rightRot = 30, rightY = 42 }: { ry?: number; leftRot?: number; rightRot?: number; rightY?: number }) {
  return (
    <>
      <Path d="M32 58V30" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={25} cy={46} rx={7} ry={ry} transform={rot(leftRot, 25, 46)} fill={LEAF} />
      <Ellipse cx={39} cy={rightY} rx={7} ry={ry} transform={rot(rightRot, 39, rightY)} fill={LEAF_LIGHT} />
    </>
  );
}

function Sunflower() {
  return (
    <>
      <Soil />
      <StemLeaves />
      <G fill={flowerColors.sunflower}>
        <Ring n={12} step={30} render={(t) => <Ellipse cx={32} cy={9} rx={3.6} ry={7} transform={t} />} />
      </G>
      <Circle cx={32} cy={20} r={7.5} fill="#6B3E1F" />
      <Circle cx={30} cy={18} r={1} fill="#9A5E33" />
      <Circle cx={34} cy={19} r={1} fill="#9A5E33" />
      <Circle cx={31} cy={22.5} r={1} fill="#9A5E33" />
    </>
  );
}

function Daisy() {
  return (
    <>
      <Soil />
      <StemLeaves ry={3} />
      <G fill={flowerColors.daisy}>
        <Ring n={10} step={36} render={(t) => <Ellipse cx={32} cy={10} rx={2.8} ry={8} transform={t} />} />
      </G>
      <Circle cx={32} cy={20} r={5} fill="#FFD24A" />
    </>
  );
}

function Tulip() {
  return (
    <>
      <Soil />
      <Path d="M32 58V28" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <Path d="M32 56C24 50 21 42 22 34C27 38 31 46 32 56Z" fill={LEAF} />
      <Path d="M32 56C40 50 43 42 42 34C37 38 33 46 32 56Z" fill={LEAF_LIGHT} />
      <Path d="M21 12C21 24 25 30 32 30C39 30 43 24 43 12L37.5 18L32 9L26.5 18Z" fill={flowerColors.tulip} />
      <Path d="M32 9L26.5 18L28 28C30 29.5 34 29.5 36 28L37.5 18Z" fill="#E84B6E" />
    </>
  );
}

function Rose() {
  return (
    <>
      <Soil />
      <Path d="M32 58V30" stroke={LEAF_DARK} strokeWidth={3} strokeLinecap="round" />
      <Path d="M32 46l-3 -1.5M32 40l3 -1.5" stroke={LEAF_DARK} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={24} cy={44} rx={7} ry={3.5} transform={rot(-25, 24, 44)} fill={LEAF_DARK} />
      <Ellipse cx={40} cy={48} rx={7} ry={3.5} transform={rot(25, 40, 48)} fill={LEAF} />
      <Path d="M24 26C20 22 21 14 26 11C30 8 36 8 40 11C44 14 45 22 40 26C37 29 27 29 24 26Z" fill={flowerColors.rose} />
      <Path d="M32 13C27 13 25 17 27 20C29 23 34 23 36 20C37.5 17.5 36 15 33 15.5C31 16 31 18.5 33 18.5" fill="none" stroke="#A8203A" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M24.5 21C27 25 31 26.5 32 26.5C33 26.5 37 25 39.5 21" fill="none" stroke="#A8203A" strokeWidth={1.6} strokeLinecap="round" />
    </>
  );
}

function Spider() {
  const petals = ['M32 24C28 18 24 16 20 18', 'M32 24C36 18 40 16 44 18', 'M32 24C27 22 22 24 20 28', 'M32 24C37 22 42 24 44 28', 'M32 24C30 18 31 12 34 10', 'M32 24C34 18 37 14 41 13'];
  const stamens = ['M32 24C27 16 20 10 14 9', 'M32 24C30 14 26 7 22 4', 'M32 24C34 14 38 7 43 5', 'M32 24C37 16 44 11 50 10', 'M32 24C36 20 44 18 52 19'];
  const tips: [number, number][] = [[14, 9], [22, 4], [43, 5], [50, 10], [52, 19]];
  return (
    <>
      <Soil />
      <Path d="M32 58V28" stroke={LEAF} strokeWidth={3} strokeLinecap="round" />
      <G fill="none" stroke={flowerColors.spider} strokeWidth={3} strokeLinecap="round">
        {petals.map((d) => <Path key={d} d={d} />)}
      </G>
      <G fill="none" stroke="#FF8A7A" strokeWidth={1} strokeLinecap="round">
        {stamens.map((d) => <Path key={d} d={d} />)}
      </G>
      <G fill="#FFD24A">
        {tips.map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.4} />)}
      </G>
    </>
  );
}

function Lavender() {
  const buds: [number, number, number, number][] = [
    [32, 8, 2.4, 3.2], [29.8, 12.5, 2.4, 3], [34.2, 12.5, 2.4, 3], [29.8, 17.5, 2.4, 3], [34.2, 17.5, 2.4, 3], [32, 22, 2.4, 3],
    [21, 16, 2.2, 2.8], [19.5, 20, 2.2, 2.7], [23, 20.5, 2.2, 2.7], [21.5, 24.5, 2.2, 2.7],
    [43, 16, 2.2, 2.8], [41, 20.5, 2.2, 2.7], [44.5, 20, 2.2, 2.7], [42.5, 24.5, 2.2, 2.7],
  ];
  return (
    <>
      <Soil />
      <Path d="M32 58V12M32 58C30 48 26 36 22 20M32 58C34 48 38 36 42 20" stroke={LEAF} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <G fill={flowerColors.lavender}>
        {buds.map(([cx, cy, rx, ry]) => <Ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} />)}
      </G>
    </>
  );
}

function Blossom() {
  const pollen: [number, number][] = [[32, 15.5], [36, 19], [28, 19], [34.5, 23.5], [29.5, 23.5]];
  return (
    <>
      <Soil />
      <Path d="M32 58V30" stroke="#8A5A3C" strokeWidth={3} strokeLinecap="round" />
      <Path d="M32 44L40 38" stroke="#8A5A3C" strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={42} cy={36.5} r={3} fill="#FFC9D6" />
      <G fill={flowerColors.blossom}>
        <Ring n={5} step={72} render={(t) => <Circle cx={32} cy={11} r={6.5} transform={t} />} />
      </G>
      <Circle cx={32} cy={20} r={4} fill="#E86A8E" />
      <G fill="#FFE08A">
        {pollen.map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1} />)}
      </G>
    </>
  );
}

function Marigold() {
  return (
    <>
      <Soil />
      <StemLeaves ry={3} />
      <G fill={flowerColors.marigold}>
        <Ring n={8} step={45} render={(t) => <Circle cx={32} cy={9} r={4.5} transform={t} />} />
      </G>
      <G fill="#FFC23C">
        <Ring n={6} step={60} render={(t) => <Circle cx={32} cy={14} r={3.6} transform={t} />} />
      </G>
      <Circle cx={32} cy={20} r={3.2} fill="#E07A10" />
    </>
  );
}

const BLOOMS: Record<FlowerKind, () => React.JSX.Element> = {
  sunflower: Sunflower,
  daisy: Daisy,
  tulip: Tulip,
  rose: Rose,
  spider: Spider,
  lavender: Lavender,
  blossom: Blossom,
  marigold: Marigold,
};

function FlowerImpl({ kind, stage = 'bloom', health = 'ok', size = 96, soil = true }: FlowerProps) {
  const color = flowerColors[kind];
  let body: React.ReactNode;
  if (health === 'dormant') {
    body = <Dormant />;
  } else if (health === 'wilt') {
    const faded = mix(color, FADE_TO, 0.4);
    if (stage === 'seed') body = <WiltSeed />;
    else if (stage === 'bud') body = <WiltBud faded={faded} />;
    else body = <WiltBloom faded={faded} fadedCenter={mix('#FFD24A', FADE_TO, 0.45)} />;
  } else if (stage === 'seed') {
    body = <Seed />;
  } else if (stage === 'bud') {
    body = <Bud color={color} />;
  } else {
    const Bloom = BLOOMS[kind];
    body = <Bloom />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <SoilOn.Provider value={soil}>{body}</SoilOn.Provider>
    </Svg>
  );
}

export const Flower = memo(FlowerImpl);
export default Flower;
